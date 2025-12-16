# models/__init__.py
"""
PASE Console Models Package
"""

from .ml_models import model_manager, MLModelManager
from .simulation import (
    SimulationRequest,
    Alert,
    SimulationResult,
    MaintenanceWindow,
    SimulationResponse
)

__all__ = [
    'model_manager',
    'MLModelManager',
    'SimulationRequest',
    'Alert',
    'SimulationResult',
    'MaintenanceWindow',
    'SimulationResponse'
]

print("✅ Models package initialized")