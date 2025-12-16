import joblib
import numpy as np
from utils.config import settings


class MLModelManager:
    def __init__(self):
        self.model_supply = None
        self.model_demand = None
        self.load_models()

    def load_models(self):
        """Load the joblib models"""
        try:
            self.model_supply = joblib.load(settings.MODEL_SUPPLY_PATH)
            print(f"✓ Supply model loaded: {settings.MODEL_SUPPLY_PATH}")
        except Exception as e:
            print(f"✗ Failed to load supply model: {e}")
            raise

        try:
            self.model_demand = joblib.load(settings.MODEL_DEMAND_PATH)
            print(f"✓ Demand model loaded: {settings.MODEL_DEMAND_PATH}")
        except Exception as e:
            print(f"✗ Failed to load demand model: {e}")
            raise

    def predict_supply(self, wind_speed: float, wind_dir_sin: float, wind_dir_cos: float) -> float:
        """FIXED: Predict power supply based on wind conditions - accepts sin/cos"""
        if self.model_supply is None:
            raise ValueError("Supply model not loaded")

        features = [[wind_speed, wind_dir_sin, wind_dir_cos]]

        try:
            prediction = float(self.model_supply.predict(features)[0])
        except Exception as e:
            print(f"Supply prediction warning: {e}")
            prediction = 0.0

        return max(0, prediction)

    def predict_demand(self, hour: int, weekday: int, month: int, yearday: int) -> float:
        """Predict power demand based on time features"""
        if self.model_demand is None:
            raise ValueError("Demand model not loaded")

        features = [[hour, weekday, month, yearday]]

        try:
            prediction = float(self.model_demand.predict(features)[0])
        except Exception as e:
            print(f"Demand prediction warning: {e}")
            prediction = 1000.0  # Fallback to reasonable value

        return max(0, prediction)


# Global model manager instance
model_manager = MLModelManager()