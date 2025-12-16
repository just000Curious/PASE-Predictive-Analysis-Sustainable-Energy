# utils/config.py
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent


class Settings:
    # API Keys
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "dummy_key_for_testing")

    # Model Paths - Use absolute paths
    MODEL_SUPPLY_PATH = os.getenv("MODEL_SUPPLY_PATH", str(PROJECT_ROOT / "models" / "power_supply_model.joblib"))
    MODEL_DEMAND_PATH = os.getenv("MODEL_DEMAND_PATH", str(PROJECT_ROOT / "models" / "power_demand_model.joblib"))

    # Validate model paths exist
    @classmethod
    def validate_model_paths(cls):
        import os
        models_ok = True

        if not os.path.exists(cls.MODEL_SUPPLY_PATH):
            print(f"❌ ERROR: Supply model not found at {cls.MODEL_SUPPLY_PATH}")
            models_ok = False
        else:
            print(f"✅ Supply model found: {cls.MODEL_SUPPLY_PATH}")

        if not os.path.exists(cls.MODEL_DEMAND_PATH):
            print(f"❌ ERROR: Demand model not found at {cls.MODEL_DEMAND_PATH}")
            models_ok = False
        else:
            print(f"✅ Demand model found: {cls.MODEL_DEMAND_PATH}")

        return models_ok

    # Default configuration
    TURBINE_COUNT = 50
    TURBINE_AVAILABILITY = 0.95
    COMMUNITY_DEMAND_PERCENT = 0.01
    COMMUNITY_BASE_LOAD_MW = 75.0
    BATTERY_CAPACITY_MWH = 300.0
    BATTERY_MAX_CHARGE_MW = 50.0
    BATTERY_MAX_DISCHARGE_MW = 100.0
    INITIAL_BATTERY_MWH = 150.0
    LOW_WIND_THRESHOLD = 3.0
    HIGH_WIND_THRESHOLD = 25.0
    BATTERY_LOW_THRESHOLD = 0.2
    BATTERY_HIGH_THRESHOLD = 0.8

    # ML Model scaling factors (CRITICAL!)
    SUPPLY_SCALING_FACTOR = 0.001  # Convert KW to MW
    DEMAND_SCALING_FACTOR = 0.00001  # Adjust based on your training data


# Create settings instance
settings = Settings()
settings.validate_model_paths()