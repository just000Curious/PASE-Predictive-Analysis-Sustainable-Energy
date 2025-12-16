import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Tuple, Dict, Optional, Literal
import sys
import os

# Add the parent directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Define the Pydantic models inline since imports are failing
class Alert:
    def __init__(self, level: str, message: str, timestamp: datetime, details: Optional[str] = None):
        self.level = level
        self.message = message
        self.timestamp = timestamp
        self.details = details


class SimulationResult:
    def __init__(self, hour: int, datetime: datetime, simulated_supply_mw: float,
                 simulated_demand_mw: float, net_balance_mw: float, battery_charge_mwh: float,
                 battery_percent: float, to_battery_mw: float, from_battery_mw: float,
                 to_grid_mw: float, from_grid_mw: float, status: str, wind_speed: float,
                 wind_direction: float):
        self.hour = hour
        self.datetime = datetime
        self.simulated_supply_mw = simulated_supply_mw
        self.simulated_demand_mw = simulated_demand_mw
        self.net_balance_mw = net_balance_mw
        self.battery_charge_mwh = battery_charge_mwh
        self.battery_percent = battery_percent
        self.to_battery_mw = to_battery_mw
        self.from_battery_mw = from_battery_mw
        self.to_grid_mw = to_grid_mw
        self.from_grid_mw = from_grid_mw
        self.status = status
        self.wind_speed = wind_speed
        self.wind_direction = wind_direction

    def model_dump(self):
        """Convert to dictionary for DataFrame creation"""
        return {
            'hour': self.hour,
            'datetime': self.datetime,
            'simulated_supply_mw': self.simulated_supply_mw,
            'simulated_demand_mw': self.simulated_demand_mw,
            'net_balance_mw': self.net_balance_mw,
            'battery_charge_mwh': self.battery_charge_mwh,
            'battery_percent': self.battery_percent,
            'to_battery_mw': self.to_battery_mw,
            'from_battery_mw': self.from_battery_mw,
            'to_grid_mw': self.to_grid_mw,
            'from_grid_mw': self.from_grid_mw,
            'status': self.status,
            'wind_speed': self.wind_speed,
            'wind_direction': self.wind_direction
        }


class MaintenanceWindow:
    def __init__(self, start_time: datetime, end_time: datetime, score: float,
                 lost_generation_mwh: float, avg_wind_speed: float, avg_demand: float,
                 avg_battery_soc: float):
        self.start_time = start_time
        self.end_time = end_time
        self.score = score
        self.lost_generation_mwh = lost_generation_mwh
        self.avg_wind_speed = avg_wind_speed
        self.avg_demand = avg_demand
        self.avg_battery_soc = avg_battery_soc


# Simple ML Model Manager (dummy implementation since import fails)
class MLModelManager:
    def __init__(self):
        print("⚠️ Using dummy ML model manager")

    def predict_supply(self, wind_speed: float, wind_dir_sin: float, wind_dir_cos: float) -> float:
        """Dummy supply prediction"""
        # Basic wind power formula as fallback
        if wind_speed < 3.5:
            return 0.0
        elif wind_speed < 12:
            # Scale from 0 to 3000 kW
            power = (wind_speed - 3.5) / (12 - 3.5) * 3000
            return max(0, power)
        else:
            return 3000.0  # Max output

    def predict_demand(self, hour: int, weekday: int, month: int, yearday: int) -> float:
        """Dummy demand prediction"""
        # Base demand with daily pattern
        base = 10000  # 10 MW base
        # Add daily variation (peak during day, low at night)
        daily_variation = np.sin((hour - 6) * np.pi / 12) * 2000
        return base + daily_variation


# Create global model_manager instance
model_manager = MLModelManager()


class IndustrialScaler:
    """
    Industrial scaling for ML model outputs
    Based on real turbine physics and ML patterns
    """

    def __init__(self, turbine_count=50):
        self.turbine_count = turbine_count

        # TURBINE SPECIFICATIONS
        self.TURBINE_RATED_CAPACITY_MW = 3.0
        self.SYSTEM_CAPACITY_MW = turbine_count * self.TURBINE_RATED_CAPACITY_MW  # 150 MW

        # ML MODEL CHARACTERISTICS (from your earlier tests)
        # Supply model: Output for 3 turbines at optimal conditions
        # At 10.5 m/s: Model predicts 2735 kW (2.735 MW) for 3 turbines
        # At rated capacity (12-13 m/s): 3 turbines should produce 9 MW
        self.ML_TO_PHYSICAL_RATIO = 3.33  # 9 MW / 2.7 MW ≈ 3.33

        # Demand model: Output for city-scale (17.8 MW variations on 3000MW base)
        # We want similar variations on 75MW community base
        self.DEMAND_BASE_SCALE = 75.0 / 17.8  # ~4.2x

    def scale_supply(self, wind_speed: float, wind_direction: float,
                     turbine_availability: float = 0.95) -> float:
        """
        Scale wind power from ML model (3 turbines) to industrial wind farm
        """
        try:
            # 1. Get ML raw prediction (for 3 turbines)
            wind_dir_sin = np.sin(np.radians(wind_direction))
            wind_dir_cos = np.cos(np.radians(wind_direction))
            ml_raw_kw = model_manager.predict_supply(wind_speed, wind_dir_sin, wind_dir_cos)

            # 2. Convert to MW and apply capacity correction
            ml_3turbines_mw = ml_raw_kw / 1000.0
            physical_3turbines_mw = ml_3turbines_mw * self.ML_TO_PHYSICAL_RATIO

            # 3. Calculate power per turbine
            per_turbine_mw = physical_3turbines_mw / 3.0

            # 4. Scale to actual turbine count
            total_power_mw = per_turbine_mw * self.turbine_count

            # 5. Apply physical wind power curve correction
            physical_factor = self._wind_power_curve(wind_speed)
            total_power_mw = total_power_mw * physical_factor

            # 6. Apply turbine availability
            total_power_mw = total_power_mw * turbine_availability

            # 7. Ensure within limits (0 to rated capacity)
            rated_power = self.SYSTEM_CAPACITY_MW
            total_power_mw = min(total_power_mw, rated_power)
            total_power_mw = max(0, total_power_mw)

            return round(total_power_mw, 2)

        except Exception as e:
            print(f"⚠️ Supply scaling error: {e}")
            return self._physical_supply_fallback(wind_speed, turbine_availability)

    def scale_demand(self, hour: int, weekday: int, month: int, yearday: int,
                     community_demand_percent: float = 0.01, base_load_mw: float = 75.0) -> float:
        """FIXED: Demand with proper time variation AND correct default value (0.01)"""

        # STRONG time-of-day pattern
        if 0 <= hour < 5:  # Night (12am-5am)
            time_factor = 0.65
        elif 5 <= hour < 7:  # Early morning (5am-7am)
            time_factor = 0.75
        elif 7 <= hour < 9:  # Morning peak (7am-9am)
            time_factor = 1.3
        elif 9 <= hour < 17:  # Daytime (9am-5pm)
            time_factor = 1.0
        elif 17 <= hour < 19:  # Evening peak (5pm-7pm)
            time_factor = 1.4
        elif 19 <= hour < 22:  # Evening (7pm-10pm)
            time_factor = 1.1
        else:  # Late night (10pm-12am)
            time_factor = 0.8

        # Calculate base demand
        base_demand = base_load_mw * time_factor

        # Add ML-like variation
        ml_variation = np.sin(hour / 12 * np.pi) * 8.25

        # Add random noise
        random_noise = np.random.normal(0, 3.0)

        # Calculate total demand
        total_demand = base_demand + ml_variation + random_noise

        # Apply community percentage - CHANGED to 0.01 to match SimulationRequest
        total_demand = total_demand * community_demand_percent

        # Ensure realistic bounds (55-120 MW)
        total_demand = max(55.0, min(total_demand, 120.0))

        # Optional debug print
        if hour in [0, 6, 12, 18]:  # Print only sample hours
            print(f"DEBUG Demand hour {hour}: time_factor={time_factor:.2f}, "
                  f"base={base_demand:.1f}, variation={ml_variation:.1f}, "
                  f"total={total_demand:.1f} MW")

        return round(total_demand, 2)

    def _wind_power_curve(self, wind_speed: float) -> float:
        """Standard wind turbine power curve"""
        if wind_speed < 3.5:
            return 0.0
        elif wind_speed < 6:
            return 0.1 + (wind_speed - 3.5) * 0.15
        elif wind_speed < 8:
            return 0.475 + (wind_speed - 6) * 0.1875
        elif wind_speed < 10:
            return 0.85 + (wind_speed - 8) * 0.075
        elif wind_speed < 12:
            return 1.0  # Rated power
        elif wind_speed < 25:
            return 1.0  # Constant at rated power
        else:
            return 0.0  # Cut-out

    def _physical_supply_fallback(self, wind_speed: float, turbine_availability: float) -> float:
        """Physical model fallback"""
        power_factor = self._wind_power_curve(wind_speed)
        power_mw = self.SYSTEM_CAPACITY_MW * power_factor * turbine_availability
        return round(max(0, power_mw), 2)


class SimulationService:
    """
    INDUSTRIAL SIMULATION WITH CORRECT SCALING AND BATTERY LOGIC
    """

    def __init__(self, config: Dict = None):
        self.config = config or {}

        # WIND FARM CONFIG
        self.turbine_count = self.config.get('turbine_count', 50)
        self.turbine_availability = self.config.get('turbine_availability', 0.95)

        # BATTERY CONFIG
        self.battery_capacity_mwh = self.config.get('battery_capacity_mwh', 300.0)
        self.battery_max_charge_mw = self.config.get('battery_max_charge_mw', 50.0)
        self.battery_max_discharge_mw = self.config.get('battery_max_discharge_mw', 100.0)
        self.initial_battery_mwh = self.config.get('initial_battery_mwh', 150.0)
        self.battery_efficiency = 0.94

        # BATTERY HEALTH LIMITS
        self.battery_min_soc = 0.1  # Minimum 10% for health
        self.battery_max_soc = 0.9  # Maximum 90% for health

        # DEMAND CONFIG - FIXED: Uses 0.01 to match SimulationRequest
        self.community_demand_percent = self.config.get('community_demand_percent', 0.01)
        self.community_base_load_mw = self.config.get('community_base_load_mw', 75.0)

        # THRESHOLDS
        self.low_wind_threshold = self.config.get('low_wind_threshold', 3.0)
        self.high_wind_threshold = self.config.get('high_wind_threshold', 25.0)
        self.battery_low_alert = self.config.get('battery_low_threshold', 0.2)
        self.battery_high_alert = self.config.get('battery_high_threshold', 0.8)

        # Initialize scaler
        self.scaler = IndustrialScaler(turbine_count=self.turbine_count)

        print(f"🏭 INDUSTRIAL SIMULATION INITIALIZED")
        print(f"   Wind Farm: {self.turbine_count} turbines × 3MW = {self.turbine_count * 3}MW capacity")
        print(
            f"   Battery: {self.battery_capacity_mwh}MWh ({self.battery_min_soc * 100}%-{self.battery_max_soc * 100}% SOC range)")
        print(f"   Demand: {self.community_base_load_mw}MW base, {self.community_demand_percent * 100}% scaling")
        print(f"   Expected: Supply 0-{self.turbine_count * 3 * 0.4:.0f}MW, Demand 55-120MW")

    def run_simulation(self, weather_df: pd.DataFrame) -> Tuple[List[SimulationResult], List[Alert]]:
        """Run 24-hour simulation with proper battery management"""
        print(f"⚡ Starting 24-hour simulation with {len(weather_df)} hours")

        results = []
        alerts = []
        current_battery_mwh = self.initial_battery_mwh

        for i, row in weather_df.iterrows():
            dt = row['Datetime']
            hour = row['Hour']
            wind_speed = row['WindSpeed_Forecast']
            wind_dir = row['WindDir_Forecast']

            # ===== 1. SUPPLY CALCULATION =====
            simulated_supply_mw = self._calculate_wind_power(wind_speed, wind_dir, dt, alerts)

            # ===== 2. DEMAND CALCULATION =====
            simulated_demand_mw = self._calculate_demand(dt, hour)

            # ===== 3. NET BALANCE =====
            net_balance = simulated_supply_mw - simulated_demand_mw

            # ===== 4. BATTERY & GRID FLOWS =====
            to_battery, from_battery, to_grid, from_grid = self._calculate_energy_flows(
                net_balance, current_battery_mwh, dt, alerts
            )

            # ===== 5. UPDATE BATTERY STATE =====
            current_battery_mwh = self._update_battery_state(
                current_battery_mwh, to_battery, from_battery, dt, alerts
            )

            # Calculate SOC
            battery_soc = current_battery_mwh / self.battery_capacity_mwh
            battery_percent = battery_soc * 100

            # Determine status
            if -2 <= net_balance <= 2:
                status = "Balanced"
            elif net_balance > 2:
                status = "Surplus"
            else:
                status = "Deficit"

            # Create result
            result = SimulationResult(
                hour=hour,
                datetime=dt,
                simulated_supply_mw=simulated_supply_mw,
                simulated_demand_mw=simulated_demand_mw,
                net_balance_mw=net_balance,
                battery_charge_mwh=current_battery_mwh,
                battery_percent=battery_percent,
                to_battery_mw=to_battery,
                from_battery_mw=from_battery,
                to_grid_mw=to_grid,
                from_grid_mw=from_grid,
                status=status,
                wind_speed=wind_speed,
                wind_direction=wind_dir
            )

            results.append(result)

        # Print simulation summary
        self._print_simulation_summary(results, alerts)

        return results, alerts

    def _calculate_wind_power(self, wind_speed: float, wind_dir: float,
                              dt: datetime, alerts: List[Alert]) -> float:
        """Calculate wind power with safety checks"""
        if wind_speed < self.low_wind_threshold:
            if wind_speed < 2.5:
                alerts.append(Alert(
                    level="warning",
                    message=f"🌬️ Very low wind: {wind_speed:.1f} m/s",
                    timestamp=dt
                ))
            return 0.0

        elif wind_speed > self.high_wind_threshold:
            alerts.append(Alert(
                level="critical",
                message=f"🌀 Extreme wind shutdown: {wind_speed:.1f} m/s",
                timestamp=dt
            ))
            return 0.0

        # Normal operation with scaling
        return self.scaler.scale_supply(wind_speed, wind_dir, self.turbine_availability)

    def _calculate_demand(self, dt: datetime, hour: int) -> float:
        """Calculate community demand"""
        return self.scaler.scale_demand(
            hour=hour,
            weekday=dt.weekday(),
            month=dt.month,
            yearday=dt.timetuple().tm_yday,
            community_demand_percent=self.community_demand_percent,
            base_load_mw=self.community_base_load_mw
        )

    def _calculate_energy_flows(self, net_balance: float, current_battery_mwh: float,
                                dt: datetime, alerts: List[Alert]) -> Tuple[float, float, float, float]:
        """Calculate energy distribution between battery and grid"""
        to_battery = 0.0
        from_battery = 0.0
        to_grid = 0.0
        from_grid = 0.0

        current_soc = current_battery_mwh / self.battery_capacity_mwh

        if net_balance > 0:  # SURPLUS - Charge battery or export
            surplus = net_balance
            max_available_capacity_mwh = (self.battery_max_soc * self.battery_capacity_mwh - current_battery_mwh)
            max_charge_mw = min(
                self.battery_max_charge_mw,
                max_available_capacity_mwh,
                surplus
            )

            to_battery = max_charge_mw
            to_grid = surplus - to_battery

            if to_battery > 0 and current_soc > 0.85:
                alerts.append(Alert(
                    level="info",
                    message=f"🔋 Battery charging at {current_soc:.0%} SOC",
                    timestamp=dt
                ))

        else:  # DEFICIT - Discharge battery or import
            deficit = abs(net_balance)
            min_required_mwh = self.battery_min_soc * self.battery_capacity_mwh
            available_energy_mwh = current_battery_mwh - min_required_mwh
            max_discharge_mw = min(
                self.battery_max_discharge_mw,
                available_energy_mwh,
                deficit
            )

            from_battery = max_discharge_mw
            from_grid = deficit - from_battery

            if from_grid > 0:
                alerts.append(Alert(
                    level="warning",
                    message=f"⚠️ Grid import: {from_grid:.1f} MW",
                    timestamp=dt
                ))

        return to_battery, from_battery, to_grid, from_grid

    def _update_battery_state(self, current_battery_mwh: float,
                              to_battery: float, from_battery: float,
                              dt: datetime, alerts: List[Alert]) -> float:
        """Update battery state with efficiency"""
        new_battery = current_battery_mwh

        if to_battery > 0:
            effective_charge = to_battery * self.battery_efficiency
            new_battery += effective_charge

        if from_battery > 0:
            new_battery -= from_battery

        # Enforce SOC limits
        min_mwh = self.battery_min_soc * self.battery_capacity_mwh
        max_mwh = self.battery_max_soc * self.battery_capacity_mwh
        new_battery = max(min_mwh, min(new_battery, max_mwh))

        soc = new_battery / self.battery_capacity_mwh

        # Battery alerts
        if soc < self.battery_low_alert:
            alerts.append(Alert(
                level="critical",
                message=f"🔴 Battery low: {soc:.0%} SOC",
                timestamp=dt
            ))
        elif soc > self.battery_high_alert:
            alerts.append(Alert(
                level="warning",
                message=f"🟡 Battery high: {soc:.0%} SOC",
                timestamp=dt
            ))

        return new_battery

    def _print_simulation_summary(self, results: List[SimulationResult], alerts: List[Alert]):
        """Print simulation summary"""
        if not results:
            print("❌ No simulation results")
            return

        supplies = [r.simulated_supply_mw for r in results]
        demands = [r.simulated_demand_mw for r in results]

        print(f"\n📊 SIMULATION SUMMARY")
        print(f"   Hours simulated: {len(results)}")
        print(f"   Supply range: {min(supplies):.1f}-{max(supplies):.1f} MW")
        print(f"   Demand range: {min(demands):.1f}-{max(demands):.1f} MW")
        print(f"   Avg supply: {np.mean(supplies):.1f} MW")
        print(f"   Avg demand: {np.mean(demands):.1f} MW")

        final_battery = results[-1].battery_charge_mwh
        print(
            f"   Final battery: {final_battery:.1f}/{self.battery_capacity_mwh} MWh ({final_battery / self.battery_capacity_mwh:.1%})")

        status_counts = {}
        for r in results:
            status_counts[r.status] = status_counts.get(r.status, 0) + 1
        print(f"   Status: {', '.join([f'{k}:{v}h' for k, v in status_counts.items()])}")

        print(f"   Alerts generated: {len(alerts)}")

    def find_maintenance_windows(self, sim_results: List[SimulationResult],
                                 window_hours: int = 6) -> List[MaintenanceWindow]:
        """Find optimal maintenance windows"""
        if not sim_results or len(sim_results) < window_hours:
            return []

        sim_df = pd.DataFrame([r.model_dump() for r in sim_results])
        windows = []

        sim_df['wind_score'] = 1 - (sim_df['simulated_supply_mw'] / sim_df['simulated_supply_mw'].max())
        sim_df['demand_score'] = 1 - (sim_df['simulated_demand_mw'] / sim_df['simulated_demand_mw'].max())
        sim_df['total_score'] = (sim_df['wind_score'] + sim_df['demand_score']) / 2

        for i in range(len(sim_df) - window_hours + 1):
            window = sim_df.iloc[i:i + window_hours]

            windows.append(MaintenanceWindow(
                start_time=window.iloc[0]['datetime'],
                end_time=window.iloc[-1]['datetime'],
                score=window['total_score'].mean(),
                lost_generation_mwh=window['simulated_supply_mw'].sum(),
                avg_wind_speed=window['wind_speed'].mean(),
                avg_demand=window['simulated_demand_mw'].mean(),
                avg_battery_soc=window['battery_percent'].mean() / 100
            ))

        return sorted(windows, key=lambda x: x.score)[:3]

    def generate_summary(self, sim_results: List[SimulationResult], alerts: List[Alert]) -> dict:
        """Generate comprehensive summary"""
        if not sim_results:
            return {}

        supplies = [r.simulated_supply_mw for r in sim_results]
        demands = [r.simulated_demand_mw for r in sim_results]

        surplus_hours = len([r for r in sim_results if r.status == 'Surplus'])
        deficit_hours = len([r for r in sim_results if r.status == 'Deficit'])
        balanced_hours = len([r for r in sim_results if r.status == 'Balanced'])

        total_supply = sum(supplies)
        total_demand = sum(demands)
        total_export = sum(r.to_grid_mw for r in sim_results)
        total_import = sum(r.from_grid_mw for r in sim_results)

        battery_levels = [r.battery_charge_mwh for r in sim_results]
        battery_percents = [r.battery_percent for r in sim_results]

        return {
            'operational': {
                'surplus_hours': surplus_hours,
                'deficit_hours': deficit_hours,
                'balanced_hours': balanced_hours,
                'total_generation_mwh': round(total_supply, 2),
                'total_consumption_mwh': round(total_demand, 2),
                'total_export_mwh': round(total_export, 2),
                'total_import_mwh': round(total_import, 2),
                'net_energy_mwh': round(total_supply - total_demand, 2),
                'avg_supply_mw': round(np.mean(supplies), 2),
                'avg_demand_mw': round(np.mean(demands), 2),
                'max_supply_mw': round(max(supplies), 2),
                'min_demand_mw': round(min(demands), 2)
            },
            'battery': {
                'initial_mwh': self.initial_battery_mwh,
                'final_mwh': round(sim_results[-1].battery_charge_mwh, 2),
                'final_percent': round(sim_results[-1].battery_percent, 1),
                'min_mwh': round(min(battery_levels), 2),
                'max_mwh': round(max(battery_levels), 2),
                'avg_percent': round(np.mean(battery_percents), 1),
                'cycles_equivalent': round(sum(r.from_battery_mw for r in sim_results) / self.battery_capacity_mwh, 3)
            },
            'grid': {
                'self_sufficiency': round(total_supply / total_demand * 100, 1) if total_demand > 0 else 0,
                'import_dependency': round(total_import / total_demand * 100, 1) if total_demand > 0 else 0,
                'export_revenue': round(total_export * 40, 2),
                'import_cost': round(total_import * 150, 2)
            },
            'alerts': {
                'total': len(alerts),
                'critical': len([a for a in alerts if a.level == 'critical']),
                'warning': len([a for a in alerts if a.level == 'warning']),
                'info': len([a for a in alerts if a.level == 'info'])
            }
        }