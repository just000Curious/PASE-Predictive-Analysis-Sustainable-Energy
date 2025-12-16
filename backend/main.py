from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from datetime import datetime

from models.simulation import SimulationRequest, SimulationResponse
from services.weather_service import WeatherService
from services.simulation_service import SimulationService

app = FastAPI(
    title="Grid Balance Dashboard API",
    description="Backend API for grid simulation and ML predictions",
    version="2.0.0"
)

# CORS middleware - ALLOW EVERYTHING for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)


# Handle OPTIONS requests explicitly
@app.options("/api/simulate")
async def options_simulate():
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )


@app.get("/")
async def root():
    return {"message": "Grid Balance Dashboard API", "status": "healthy", "version": "2.0.0"}


@app.post("/api/simulate")
async def run_simulation(request: SimulationRequest):
    """Run 24-hour grid balance simulation with REAL data only"""
    start_time = time.time()

    try:
        print(f"Received simulation request: {request.model_dump()}")

        # EMERGENCY FIX: Use hardcoded defaults for ALL parameters
        config = {
            'turbine_count': 50,
            'turbine_availability': 0.95,
            'battery_capacity_mwh': 300.0,
            'initial_battery_mwh': 150.0,
            'buy_price_per_mwh': 150.0,
            'sell_price_per_mwh': 40.0,
            # HARDCODE the missing parameters to avoid attribute errors
            'community_demand_percent': 0.01,
            'community_base_load_mw': 75.0,
            'battery_max_charge_mw': 50.0,
            'battery_max_discharge_mw': 100.0,
            'low_wind_threshold': 3.0,
            'high_wind_threshold': 25.0,
            'battery_low_threshold': 0.2,
            'battery_high_threshold': 0.8
        }

        # Override with any provided values from request (using safe method)
        request_dict = request.model_dump()
        for key in ['turbine_count', 'turbine_availability', 'battery_capacity_mwh',
                    'initial_battery_mwh', 'buy_price_per_mwh', 'sell_price_per_mwh']:
            if key in request_dict and request_dict[key] is not None:
                config[key] = request_dict[key]

        # Initialize services
        weather_service = WeatherService(request.api_key)
        simulation_service = SimulationService(config)

        # Get weather data
        weather_df = weather_service.get_weather_forecast(
            request.latitude,
            request.longitude,
            request.use_live_data
        )

        print(f"Weather data retrieved: {len(weather_df)} records")

        # Run simulation
        simulation_data, alerts = simulation_service.run_simulation(weather_df)

        # Debug: Check what alerts are being generated
        alert_messages = [alert.message for alert in alerts]
        print(f"Generated alerts: {alert_messages}")

        # Find maintenance windows
        maintenance_windows = simulation_service.find_maintenance_windows(simulation_data)

        # Generate summary
        summary = simulation_service.generate_summary(simulation_data, alerts)

        processing_time = time.time() - start_time

        print(f"Simulation completed in {processing_time:.2f}s")

        response = SimulationResponse(
            simulation_data=simulation_data,
            alerts=alerts,
            maintenance_windows=maintenance_windows,
            summary=summary,
            processing_time=processing_time
        )

        return response

    except Exception as e:
        print(f"Simulation error: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": True,
        "version": "2.0.0"
    }


# Add exception handler for CORS
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")