# Predictive Analytics for Sustainable Energy (PASE)

Welcome to the PASE project! This system models and simulates an industrial-scale renewable energy microgrid. It pairs simulated wind power generation with a battery energy storage system to meet community power demands, tracking flows between the wind farm, community demand, the battery system, and the broader utility grid.

## How the System Works

The system simulates a 24-hour operational period for a wind farm using weather and demand data. The major components of the simulation include:

1. **Wind Farm Generation (Supply):**
   * The baseline assumption is an industrial setup of 50 turbines, each with a 3.0 MW rated capacity, totaling 150 MW of system capacity.
   * Generation is predicted using ML models (Random Forest regressors trained on real wind data) factoring in wind speed and direction, which is then scaled and corrected against realistic physical wind power limits (e.g., cut-in speeds, cut-out speeds, and rated limits).
   * If the ML models fail to load (e.g., scikit-learn version mismatch), the system falls back to a physics-only power curve.

2. **Community Demand:**
   * Calculated based on a base load (75 MW) with strong time-of-day variation producing realistic 55-120 MW demand patterns (morning peaks, daytime usage, and evening peaks).
   * Includes random noise to reflect real-life unpredictability.

3. **Battery Energy Storage & Grid Interactions:**
   * The system features a simulated 300 MWh battery with charge constraints (max 50 MW charge / 100 MW discharge limits).
   * **Charge & discharge efficiency:** 94% round-trip efficiency applied to both charge and discharge cycles.
   * **Surplus Generation:** If wind power exceeds community demand, the excess energy is prioritized to charge the battery. If the battery is fully charged (or charging at max capacity), any remaining surplus is exported to the grid.
   * **Deficit Generation:** If demand exceeds wind power, the system first draws from the battery to compensate. If the battery falls to its minimum state of charge (or discharges at max capacity), the remainder is imported from the grid.
   * The battery enforces health bounds maintaining operations largely between 10% and 90% State of Charge (SOC).

4. **Alerts & Diagnostics:**
   * Continuous checks emit alerts for critical system states. For example, extreme winds shutting down turbines, battery capacities getting dangerously low/high, or significant dependencies on grid imports.

5. **Financial KPIs:**
   * Configurable grid pricing: import cost (default £150/MWh) and export revenue (default £40/MWh).
   * Summary includes estimated revenue, import costs, and net revenue.

## How It Finds Maintenance Windows

Scheduling maintenance for wind turbines is critical and optimally requires identifying periods where shutting down parts of the system minimally impacts operations.

The system uses the `SimulationService.find_maintenance_windows` feature to scan through the 24-hour forecast data and identify the optimal time span (by default, a rolling 6-hour window). 

The calculation works individually on each hour using a scoring system:

1. **Wind Score:** Calculated as `1 - (simulated_supply_mw / max_simulated_supply_mw)`.
2. **Demand Score:** Calculated as `1 - (simulated_demand_mw / max_simulated_demand_mw)`.
3. **Total Score:** Calculated as the average of the wind and demand scores `(wind_score + demand_score) / 2`.

It groups these 1-hour intervals into rolling 6-hour windows and takes the average of their combined `Total Score`. The system then ranks all these sliding windows and selects the top 3 with the **highest scores** — targeting periods with the lowest expected supply and demand, minimizing the impact of taking turbines offline.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Root health check |
| `/api/simulate` | POST | Run 24-hour grid simulation |
| `/api/health` | GET | Basic health check |
| `/api/health/detailed` | GET | Detailed status: ML model state, weather source, config |
| `/docs` | GET | Interactive Swagger API documentation |

## Setup and Running

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm

### Environment Variables

Create `backend/.env` with:

```env
OPENWEATHER_API_KEY=your_api_key_here
MODEL_SUPPLY_PATH=models/power_supply_model.joblib
MODEL_DEMAND_PATH=models/power_demand_model.joblib
```

### 🐳 Running with Docker (Backend)

The easiest way to run the backend is via Docker. Make sure Docker Desktop is running on your machine.

```bash
# Build the Docker image
docker build -t pase-app .

# Run the container on port 8001
docker run -p 8001:8001 --name my-running-app pase-app
```

*The API documentation will instantly be available at [http://localhost:8001/docs](http://localhost:8001/docs)*

### Backend (Manual Setup)

```bash
# Navigate to the backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server (runs on http://localhost:8001)
python main.py
```

The backend will:
- Load ML models (`power_supply_model.joblib` and `power_demand_model.joblib`)
- Start the FastAPI server on port **8001**
- API docs available at http://localhost:8001/docs

### Frontend (React + Vite + TailwindCSS)

```bash
# Navigate to the frontend directory
cd frontend/gridsync-operations-main

# Install Node.js dependencies
npm install

# Start the development server (runs on http://localhost:5173)
npm run dev
```

### Running Both Together

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
python main.py

# Terminal 2 — Frontend
cd frontend/gridsync-operations-main
npm run dev
```

Then open http://localhost:5173 in your browser and click **RUN SIMULATION**.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| ML Models | scikit-learn (Random Forest), joblib |
| Data | pandas, NumPy |
| Weather | OpenWeatherMap API |
| Frontend | React 18, TypeScript, Vite |
| UI | TailwindCSS, shadcn/ui, Recharts |
| Reports | jsPDF |

---

Built with ⚡ by **Abhishek Bhosale**
