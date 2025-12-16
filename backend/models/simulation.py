from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime


class SimulationRequest(BaseModel):
    api_key: Optional[str] = None
    use_live_data: bool = True
    latitude: str = "40.7128"
    longitude: str = "-74.0060"
    turbine_count: Optional[int] = 50
    turbine_availability: Optional[float] = 0.95
    battery_capacity_mwh: Optional[float] = 300.0
    initial_battery_mwh: Optional[float] = 150.0

    # REALISTIC DEMAND VALUES FOR 50 TURBINES
    community_demand_percent: Optional[float] = 0.01  # FIXED: Should be 0.01 to match
    community_base_load_mw: Optional[float] = 75.0    # Better baseline
    battery_max_charge_mw: Optional[float] = 50.0
    battery_max_discharge_mw: Optional[float] = 100.0
    low_wind_threshold: Optional[float] = 3.0
    high_wind_threshold: Optional[float] = 25.0
    battery_low_threshold: Optional[float] = 0.2
    battery_high_threshold: Optional[float] = 0.8


class Alert(BaseModel):
    level: Literal["critical", "warning", "info"]
    message: str
    timestamp: datetime
    details: Optional[str] = None


class SimulationResult(BaseModel):
    hour: int
    datetime: datetime
    simulated_supply_mw: float
    simulated_demand_mw: float
    net_balance_mw: float
    battery_charge_mwh: float
    battery_percent: float
    to_battery_mw: float
    from_battery_mw: float
    to_grid_mw: float
    from_grid_mw: float
    status: str
    wind_speed: float
    wind_direction: float


class MaintenanceWindow(BaseModel):
    start_time: datetime
    end_time: datetime
    score: float
    lost_generation_mwh: float
    avg_wind_speed: float
    avg_demand: float
    avg_battery_soc: float  # ADDED: Missing field used in SimulationService


class SimulationResponse(BaseModel):
    simulation_data: List[SimulationResult]
    alerts: List[Alert]
    maintenance_windows: List[MaintenanceWindow]
    summary: dict
    processing_time: float