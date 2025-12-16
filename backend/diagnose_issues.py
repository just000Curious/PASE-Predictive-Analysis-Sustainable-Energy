# diagnose_issues.py
import requests
import numpy as np
import json
import sys


def check_backend_connection():
    """Check if backend is running"""
    print("🔌 Checking Backend Connection...")

    try:
        response = requests.get("http://localhost:8001/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is running: {data}")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("   Make sure: python main.py is running")
        return False


def diagnose_demand_issue():
    """Diagnose why demand might be constant"""
    print("\n📊 DIAGNOSING DEMAND ISSUE")
    print("-" * 40)

    try:
        response = requests.post("http://localhost:8001/api/simulate", json={
            "use_live_data": False,
            "community_demand_percent": 0.4
        })

        data = response.json()
        demands = [h['simulated_demand_mw'] for h in data['simulation_data']]

        print(f"Demand Statistics:")
        print(f"  Min: {min(demands):.1f} MW")
        print(f"  Max: {max(demands):.1f} MW")
        print(f"  Avg: {np.mean(demands):.1f} MW")
        print(f"  Std Dev: {np.std(demands):.1f} MW")

        # Check variation
        unique_values = len(set(round(d, 1) for d in demands))
        print(f"\nVariation Analysis:")
        print(f"  Unique values: {unique_values}/24")

        if unique_values == 1:
            print("  ❌ CRITICAL: Demand is CONSTANT!")
            print("     Issue: scale_demand() method not working")
            print("     Fix: Check IndustrialScaler.scale_demand()")
        elif unique_values < 5:
            print("  ⚠️ Warning: Low variation in demand")
            print("     Possible: Weak time-of-day pattern")
        else:
            print("  ✅ Good: Demand is varying")

        # Check time pattern
        print(f"\nTime Pattern Check:")
        morning = data['simulation_data'][8]['simulated_demand_mw']
        afternoon = data['simulation_data'][14]['simulated_demand_mw']
        evening = data['simulation_data'][18]['simulated_demand_mw']
        night = data['simulation_data'][2]['simulated_demand_mw']

        print(f"  Morning (8am): {morning:.1f} MW")
        print(f"  Afternoon (2pm): {afternoon:.1f} MW")
        print(f"  Evening (6pm): {evening:.1f} MW")
        print(f"  Night (2am): {night:.1f} MW")

        # Evening should be highest, night lowest
        if evening > morning + 10 and evening > night + 15:
            print("  ✅ Strong time pattern detected")
        else:
            print("  ⚠️ Weak or reversed time pattern")

        return demands

    except Exception as e:
        print(f"❌ Diagnosis failed: {e}")
        return None


def diagnose_battery_issue():
    """Diagnose battery SOC issues"""
    print("\n🔋 DIAGNOSING BATTERY ISSUE")
    print("-" * 40)

    try:
        response = requests.post("http://localhost:8001/api/simulate", json={
            "use_live_data": False,
            "initial_battery_mwh": 150.0,
            "battery_capacity_mwh": 300.0
        })

        data = response.json()
        hours = data['simulation_data']

        batteries = [h['battery_charge_mwh'] for h in hours]
        soc_values = [b / 300 for b in batteries]

        print(f"Battery Statistics:")
        print(f"  Initial: {batteries[0]:.1f} MWh ({soc_values[0]:.1%})")
        print(f"  Final: {batteries[-1]:.1f} MWh ({soc_values[-1]:.1%})")
        print(f"  Min: {min(batteries):.1f} MWh ({min(soc_values):.1%})")
        print(f"  Max: {max(batteries):.1f} MWh ({max(soc_values):.1%})")

        # Check movement
        net_change = batteries[-1] - batteries[0]
        hourly_changes = [batteries[i] - batteries[i - 1] for i in range(1, len(batteries))]
        max_hourly_change = max(abs(ch) for ch in hourly_changes)

        print(f"\nMovement Analysis:")
        print(f"  Net change: {net_change:+.1f} MWh")
        print(f"  Max hourly change: {max_hourly_change:.1f} MWh")

        if abs(net_change) < 1.0:
            print("  ❌ CRITICAL: Battery not changing!")
            print("     Issue: Charge/discharge logic broken")
            print("     Fix: Check _calculate_energy_flows()")
        elif max_hourly_change < 1.0:
            print("  ⚠️ Warning: Small hourly changes")
            print("     Possible: Battery limits too restrictive")
        else:
            print("  ✅ Good: Battery is moving")

        # Check SOC limits
        print(f"\nSOC Health Check:")
        if min(soc_values) < 0.1:
            print(f"  ❌ Below 10% minimum: {min(soc_values):.1%}")
        else:
            print(f"  ✅ Above 10% minimum: {min(soc_values):.1%}")

        if max(soc_values) > 0.9:
            print(f"  ❌ Above 90% maximum: {max(soc_values):.1%}")
        else:
            print(f"  ✅ Below 90% maximum: {max(soc_values):.1%}")

        # Check charge/discharge events
        charging_hours = sum(1 for h in hours if h.get('to_battery_mw', 0) > 0)
        discharging_hours = sum(1 for h in hours if h.get('from_battery_mw', 0) > 0)

        print(f"\nBattery Usage:")
        print(f"  Charging hours: {charging_hours}")
        print(f"  Discharging hours: {discharging_hours}")
        print(f"  Idle hours: {24 - charging_hours - discharging_hours}")

        if charging_hours == 0 and discharging_hours == 0:
            print("  ❌ Battery never used!")
        elif charging_hours > 0 and discharging_hours > 0:
            print("  ✅ Battery both charges and discharges")
        else:
            print("  ⚠️ Battery only one-way")

        return batteries

    except Exception as e:
        print(f"❌ Diagnosis failed: {e}")
        return None


def diagnose_scaling_issue():
    """Check if ML scaling is working"""
    print("\n⚖️ DIAGNOSING SCALING ISSUE")
    print("-" * 40)

    try:
        response = requests.post("http://localhost:8001/api/simulate", json={
            "use_live_data": False,
            "turbine_count": 50
        })

        data = response.json()
        supplies = [h['simulated_supply_mw'] for h in data['simulation_data']]

        print(f"Supply Scaling Analysis:")
        print(f"  Range: {min(supplies):.1f} - {max(supplies):.1f} MW")
        print(f"  Avg: {np.mean(supplies):.1f} MW")

        # For 50 turbines × 3MW = 150MW capacity
        capacity_factor = np.mean(supplies) / 150.0

        print(f"\nCapacity Factor: {capacity_factor:.1%}")

        if capacity_factor < 0.2:
            print("  ❌ Too low: Supply scaling issue")
            print("     ML model output too small")
            print("     Fix: Adjust ML_TO_PHYSICAL_RATIO")
        elif capacity_factor > 0.8:
            print("  ⚠️ Very high: Possibly unrealistic")
        else:
            print("  ✅ Realistic capacity factor")

        # Check if supply varies with time
        morning_supply = data['simulation_data'][8]['simulated_supply_mw']
        afternoon_supply = data['simulation_data'][14]['simulated_supply_mw']

        print(f"\nTime Variation:")
        print(f"  Morning (8am): {morning_supply:.1f} MW")
        print(f"  Afternoon (2pm): {afternoon_supply:.1f} MW")

        if abs(morning_supply - afternoon_supply) > 10:
            print("  ✅ Supply varies with time")
        else:
            print("  ⚠️ Little time variation in supply")

    except Exception as e:
        print(f"❌ Diagnosis failed: {e}")


def generate_fix_report(demands, batteries):
    """Generate comprehensive fix report"""
    print("\n" + "=" * 60)
    print("🔧 COMPREHENSIVE FIX REPORT")
    print("=" * 60)

    issues = []
    fixes = []

    # Demand issues
    if demands:
        unique_demands = len(set(round(d, 1) for d in demands))
        if unique_demands == 1:
            issues.append("Demand constant at 55 MW")
            fixes.append("""
            FIX demand scaling:
            1. Update IndustrialScaler.scale_demand() in simulation_service.py
            2. Add strong time-of-day multipliers
            3. Add ML variation pattern
            4. Ensure community_demand_percent = 0.4 (not 0.01)
            """)

    # Battery issues
    if batteries:
        net_change = batteries[-1] - batteries[0]
        if abs(net_change) < 1.0:
            issues.append("Battery SOC not changing")
            fixes.append("""
            FIX battery logic:
            1. Check _calculate_energy_flows() in simulation_service.py
            2. Ensure proper charge/discharge limits
            3. Verify battery efficiency (94%) is applied
            4. Check SOC limits (10-90%)
            """)

    # Scaling issues
    issues.append("ML scaling needs verification")
    fixes.append("""
    VERIFY scaling:
    1. Supply should be 0-150 MW for 50 turbines
    2. Demand should be 55-120 MW for community
    3. Check IndustrialScaler ML_TO_PHYSICAL_RATIO
    """)

    if issues:
        print("\n❌ DETECTED ISSUES:")
        for i, issue in enumerate(issues):
            print(f"{i + 1}. {issue}")

        print("\n🔧 REQUIRED FIXES:")
        for i, fix in enumerate(fixes):
            print(f"\nFix {i + 1}:")
            print(fix)
    else:
        print("✅ No critical issues detected!")

    print("\n📋 NEXT STEPS:")
    print("1. Apply fixes above")
    print("2. Restart backend: python main.py")
    print("3. Run: python diagnose_issues.py")
    print("4. Test frontend: http://localhost:3000")


def main():
    """Run comprehensive diagnosis"""
    print("🔍 COMPREHENSIVE SYSTEM DIAGNOSIS")
    print("=" * 60)

    # Check connection first
    if not check_backend_connection():
        print("\n❌ Cannot proceed - backend not running")
        sys.exit(1)

    # Run diagnostics
    demands = diagnose_demand_issue()
    batteries = diagnose_battery_issue()
    diagnose_scaling_issue()

    # Generate report
    generate_fix_report(demands, batteries)

    print("\n" + "=" * 60)
    print("✅ DIAGNOSIS COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()