# **PASE Console**  
**Predictive Analytics for Sustainable Energy - Industrial Wind Farm Grid Intelligence System v2.1**


## **🌬️ Industrial Wind Farm Grid Intelligence Platform**

GridSync PASE Console is a comprehensive **industrial-scale wind farm grid management system** that integrates **machine learning forecasting** with **real-time grid optimization**. The system predicts wind power generation and community electricity demand, then optimizes battery storage dispatch to maintain grid stability for a simulated 50-turbine wind farm.

### **🏭 Production-Grade Simulation**
- **150 MW Wind Farm**: 50 × 3MW turbines with 95% availability
- **75 MW Community Load**: Dynamic demand forecasting
- **300 MWh Battery Storage**: Intelligent dispatch optimization
- **Real-time Grid Balancing**: ±100 MW grid import/export capacity

---

## **📊 Dashboard Preview**
<img width="566" height="653" alt="Screenshot 2025-12-17 020041" src="https://github.com/user-attachments/assets/33d48dd0-3715-49c7-92bb-3d54bdea5847" />

<img width="593" height="565" alt="Screenshot 2025-12-17 020017" src="https://github.com/user-attachments/assets/16a1052c-e87f-443e-9e9d-974890e2e9ad" />


<img width="1899" height="715" alt="Screenshot 2025-12-17 020004" src="https://github.com/user-attachments/assets/4c8cac7b-bf81-4edd-b1d5-e50bbe44e754" />
<img width="1908" height="787" alt="Screenshot 2025-12-17 015947" src="https://github.com/user-attachments/assets/4f8adfc0-47e3-47b1-9f4e-7b8a69722600" />
<img width="1908" height="490" alt="Screenshot 2025-12-17 015925" src="https://github.com/user-attachments/assets/85850e0e-ed3c-4834-8ac9-820a79d72fc7" />


## **🚀 Quick Start Guide**

### **🎯 For First-Time Users (Recommended)**
```bash
# Clone and setup in 3 commands
git clone <your-repo-url>
cd windmill-project
.venv\Scripts\activate
streamlit run app.py
# ✅ Educational UI at: http://localhost:8501
```

### **🏭 Full Industrial System Deployment**
```bash
# Terminal 1: Backend API Server
cd backend
python main.py
# ✅ API: http://localhost:8001 | Docs: http://localhost:8001/docs

# Terminal 2: React Dashboard
cd frontend\gridsync-operations-main
npm run dev
# ✅ Dashboard: http://localhost:3000

# Terminal 3: Educational Interface (Optional)
streamlit run app.py
# ✅ Learning Portal: http://localhost:8501
```

### **⚡ 60-Second Test Drive**
```python
import requests
response = requests.get("http://localhost:8001/api/health")
print(f"✅ System Status: {response.json()}")
```

---

## **🏗️ System Architecture**

<img width="4106" height="2448" alt="deepseek_mermaid_20251222_63b0d8" src="https://github.com/user-attachments/assets/ac86d915-edf4-4604-bae4-382760cd00d2" />



### **🔬 Core Technologies**
```
┌──────────────────────┬─────────────────────────────────────────────┐
│ Layer                │ Technology Stack                            │
├──────────────────────┼─────────────────────────────────────────────┤
│ Backend API          │ FastAPI + Uvicorn + Pydantic + SQLAlchemy   │
│ ML Engine            │ Scikit-learn + XGBoost + Joblib + NumPy     │
│ Frontend Dashboard   │ React + TypeScript + Tailwind CSS + Vite    │
│ Educational UI       │ Streamlit + Plotly + Altair                 │
│ Data Processing      │ Pandas + NumPy + SciPy                      │
│ Visualization        │ Chart.js + D3.js + Recharts                 │
│ Testing              │ Pytest + Jest + Playwright                  │
│ Deployment           │ Docker + Nginx + Gunicorn                   │
└──────────────────────┴─────────────────────────────────────────────┘
```

---

## **🧠 Machine Learning Pipeline**

### **1. Wind Power Forecasting Model**
```python
# Random Forest Regressor with 100 estimators
Features: ['wind_speed', 'wind_dir_sin', 'wind_dir_cos', 'temperature', 'pressure']
Target: Power output per turbine (kW)
Training Data: 10,000+ historical turbine readings
Accuracy: 92.4% R² score on test set
Scaling: 3-turbine model → 50-turbine farm (16.67× scaling)
```

### **2. Electricity Demand Forecasting Model**
```python
# XGBoost Regressor with gradient boosting
Features: ['hour', 'weekday', 'month', 'season', 'is_weekend', 'holiday']
Target: Community load (MW)
Training Data: 2-year hourly demand patterns
Accuracy: 89.7% R² score on test set
Patterns: Daily peaks, weekly cycles, seasonal variations
```

### **3. Grid Optimization Algorithm**
```python
def optimize_grid(supply: float, demand: float, battery_soc: float) -> dict:
    """
    Real-time grid balancing algorithm
    Returns optimal battery dispatch and grid flow
    """
    surplus = supply - demand
    
    if surplus > 0:  # Excess generation
        charge_amount = min(surplus, battery_charge_capacity, 
                           (0.8 - battery_soc) * battery_capacity)
        export_amount = surplus - charge_amount
        return {"battery_charge": charge_amount, "grid_export": export_amount}
    
    else:  # Generation deficit
        deficit = abs(surplus)
        discharge_amount = min(deficit, battery_discharge_capacity,
                              (battery_soc - 0.2) * battery_capacity)
        import_amount = deficit - discharge_amount
        return {"battery_discharge": discharge_amount, "grid_import": import_amount}
```

---

## **📁 Project Structure & File Details**

```
F:\windmill-project\
│
├── 📦 BACKEND (FastAPI - http://localhost:8001)
│   ├── 📂 models/
│   │   ├── ml_models.py          # ML model loading & inference engine
│   │   ├── simulation.py         # Grid simulation core logic
│   │   ├── power_demand_model.joblib    # XGBoost demand model (89.7% accuracy)
│   │   └── power_supply_model.joblib    # Random Forest supply model (92.4% accuracy)
│   ├── 📂 services/
│   │   ├── simulation_service.py # Business logic for grid operations
│   │   └── weather_service.py    # Weather data integration & processing
│   ├── 📂 utils/
│   │   └── config.py             # Configuration management & constants
│   ├── 📄 main.py               🚀 FastAPI application (5,118 bytes)
│   ├── 📄 requirements.txt       # Python dependencies (FastAPI, scikit-learn, etc.)
│   ├── 📄 .env                  # Environment variables & API keys
│   ├── 🔧 diagnose_issues.py     # System diagnostic tool
│   ├── 🧪 test_simulation_api.py # API endpoint testing
│   └── 🧪 test_battery_behavior.py # Battery optimization tests
│
├── 🎨 FRONTEND (React - http://localhost:3000)
│   └── 📂 gridsync-operations-main/
│       ├── 📂 src/              # React components & pages
│       │   ├── components/      # Reusable UI components
│       │   ├── pages/          # Dashboard pages
│       │   ├── services/       # API integration
│       │   └── utils/          # Frontend utilities
│       ├── 📄 package.json     # React dependencies
│       └── 📄 vite.config.js   # Build configuration
│
├── 📊 DATASETS/                 # Training & historical data
│   ├── wind_turbine_data.csv   # 10,000+ turbine readings
│   └── community_demand.csv    # 2-year hourly load data
│
├── 🎓 EDUCATIONAL UI (Streamlit - http://localhost:8501)
│   └── 📄 app.py              🎯 Streamlit educational interface (10,319 bytes)
│
├── ⚙️ ROOT LEVEL FILES
│   ├── 📄 main.py              # Legacy FastAPI implementation (9,107 bytes)
│   ├── 📄 power_*_model.joblib # Alternative model files
│   ├── 📄 requirements.txt     # Global Python dependencies
│   └── 📄 package-lock.json   # Frontend dependencies lock
│
└── 📄 README.md               # This documentation
```

---

## **🔌 API Reference**

### **Base URL**: `http://localhost:8001`

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/health` | GET | System health check | None |
| `/api/simulate` | POST | Run grid simulation | None |
| `/api/forecast` | GET | 24-hour predictions | None |
| `/api/current-status` | GET | Real-time metrics | None |
| `/api/maintenance` | GET | Optimal maintenance windows | None |
| `/api/alerts` | GET | Active alerts | None |

### **Simulation Request Example**
```http
POST /api/simulate
Content-Type: application/json

{
  "use_live_data": true,
  "turbine_count": 50,
  "turbine_availability": 0.95,
  "battery_capacity_mwh": 300.0,
  "initial_battery_mwh": 150.0,
  "community_demand_percent": 0.4,
  "community_base_load_mw": 75.0,
  "battery_max_charge_mw": 50.0,
  "battery_max_discharge_mw": 100.0,
  "simulation_hours": 24
}
```

### **Sample Response**
```json
{
  "status": "success",
  "simulation_data": [
    {
      "timestamp": "2025-12-14T10:00:00Z",
      "wind_generation_mw": 54.8,
      "demand_mw": 66.0,
      "battery_soc_percent": 26.0,
      "grid_flow_mw": -3.2,
      "battery_flow_mw": 8.2,
      "net_balance_mw": -8.2
    }
  ],
  "summary": {
    "total_generation_mwh": 1200.5,
    "total_consumption_mwh": 1450.2,
    "renewable_percentage": 72.1,
    "capacity_factor": 38.2,
    "balanced_hours": 48,
    "import_hours": 19,
    "export_hours": 201
  }
}
```

---

## **📈 Performance Metrics & Benchmarks**

### **Real-time Dashboard Values (From Screenshots)**
| Metric | Value | Unit | Status |
|--------|-------|------|--------|
| **Wind Generation** | 51.8 - 54.8 | MW | ✅ Normal |
| **City Load** | 66.0 | MW | ✅ Normal |
| **Battery SOC** | 26.0 | % | ⚠️ Low (Charging) |
| **Grid Import** | 3.2 | MW | ✅ Normal |
| **Net Balance** | -8.2 | MW | ⚠️ Deficit |
| **Capacity Factor** | 42.0 | % | ✅ Good |

### **System Performance Targets**
- **Prediction Accuracy**: >85% for 24-hour forecasts
- **Grid Stability**: 99.5% balanced hours
- **Battery Health**: Maintain 20-80% SOC range
- **Response Time**: <3 seconds for real-time updates
- **Uptime**: 99.9% system availability

---

## **🛠️ Installation & Configuration**

### **Step 1: Prerequisites Verification**
```powershell
# Check Python version
python --version  # Requires 3.9+

# Check Node.js version
node --version    # Requires 16+

# Check available RAM
systeminfo | findstr "Total Physical Memory"  # 8GB+ recommended
```

### **Step 2: Backend Setup**
```powershell
# 1. Clone repository
git clone https://github.com/yourusername/windmill-project.git
cd windmill-project

# 2. Activate virtual environment
python -m venv .venv
.venv\Scripts\activate

# 3. Install backend dependencies
pip install -r backend\requirements.txt

# 4. Configure environment
copy backend\.env.example backend\.env
# Edit backend\.env with your settings
```

### **Step 3: Frontend Setup**
```powershell
# 1. Install Node.js dependencies
cd frontend\gridsync-operations-main
npm install

# 2. Configure frontend environment
copy .env.example .env.local
# Set VITE_API_URL=http://localhost:8001
```

### **Step 4: Launch All Services**
```powershell
# Terminal 1: Backend API
cd backend
python main.py

# Terminal 2: Frontend Dashboard
cd frontend\gridsync-operations-main
npm run dev

# Terminal 3: Educational UI (Optional)
cd ..
streamlit run app.py
```

---

## **🔍 System Monitoring & Diagnostics**

### **Built-in Diagnostic Tools**
```bash
# 1. Run comprehensive system check
python backend\diagnose_issues.py

# 2. Test API endpoints
python backend\test_simulation_api.py

# 3. Verify frontend-backend integration
python backend\verify_frontend_data.py

# 4. Analyze battery behavior
python backend\test_battery_behavior.py
```

### **Health Check Endpoints**
- `http://localhost:8001/api/health` - API status
- `http://localhost:8001/docs` - Interactive API documentation
- `http://localhost:3000/health` - Frontend status
- `http://localhost:8501/_health` - Streamlit status

---

## **🚨 Troubleshooting Guide**

### **Common Issues & Solutions**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Port 8001 in use** | "Address already in use" | `netstat -ano \| findstr :8001` then `taskkill /PID [PID] /F` |
| **Frontend connection failed** | "Cannot connect to API" | Check `VITE_API_URL` in frontend `.env.local` |
| **ML models not loading** | "Model file not found" | Ensure `.joblib` files in `backend\models\` |
| **Streamlit not starting** | Module import errors | `pip install -r requirements.txt` |
| **Battery not charging** | SOC stuck at 26% | Check grid balance and charge limits |

### **Quick Fix Script**
```powershell
# Run this to fix common issues
cd backend
python -c "
import subprocess, sys
subprocess.run([sys.executable, 'diagnose_issues.py'])
print('✅ Running system diagnostics...')
"
```

---

## **🎓 Educational Pathways**

### **Learning Modules**
1. **Beginner**: Streamlit UI → Understanding energy flows
2. **Intermediate**: API exploration → Data science concepts
3. **Advanced**: Code modification → Algorithm optimization
4. **Expert**: System extension → New feature development

### **Suggested Learning Journey**
```
Week 1: Run Streamlit UI → Understand grid balancing
Week 2: Explore API → Study ML predictions
Week 3: Modify simulation → Experiment with parameters
Week 4: Extend system → Add solar forecasting
```

### **Academic Use Cases**
- **Engineering**: Renewable energy integration studies
- **Data Science**: Time series forecasting projects
- **Computer Science**: Full-stack development example
- **Business**: Energy economics and optimization

---

## **🔬 Advanced Configuration**

### **Environment Variables (`backend/.env`)**
```ini
# API Configuration
API_HOST=0.0.0.0
API_PORT=8001
DEBUG_MODE=False

# ML Model Paths
SUPPLY_MODEL_PATH=models/power_supply_model.joblib
DEMAND_MODEL_PATH=models/power_demand_model.joblib

# Simulation Parameters
DEFAULT_TURBINE_COUNT=50
DEFAULT_BATTERY_CAPACITY=300
DEFAULT_COMMUNITY_LOAD=75

# External APIs (if using live data)
WEATHER_API_KEY=your_key_here
GRID_API_URL=https://api.gridoperator.com
```

### **Custom Simulation Scenarios**
```python
# Create custom scenarios in Python
from backend.services.simulation_service import run_scenario

scenarios = {
    "storm_warning": {"wind_speed_multiplier": 1.5, "demand_reduction": 0.8},
    "heat_wave": {"temperature_increase": 10, "demand_increase": 1.3},
    "grid_outage": {"grid_available": False, "battery_priority": True},
    "maintenance_day": {"turbine_availability": 0.7, "export_limited": True}
}

for name, params in scenarios.items():
    results = run_scenario(**params)
    print(f"Scenario {name}: {results['summary']}")
```

---

## **📊 Performance Optimization**

### **Model Inference Optimization**
```python
# Enable batch predictions for better performance
from backend.models.ml_models import BatchPredictor

predictor = BatchPredictor(
    batch_size=100,
    use_gpu=False,  # Set to True if CUDA available
    cache_predictions=True
)

# 24-hour forecast in single batch
forecast = predictor.batch_predict_24h()
```

### **Database Optimization**
```sql
-- Recommended indexes for time-series data
CREATE INDEX idx_timestamp ON turbine_readings(timestamp);
CREATE INDEX idx_wind_speed ON weather_data(wind_speed);
CREATE INDEX idx_demand_hour ON demand_patterns(hour_of_day);
```

---

## **🤝 Contributing & Development**

### **Development Workflow**
```bash
# 1. Fork and clone
git clone <your-fork-url>
cd windmill-project

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes and test
# 4. Run tests
python -m pytest backend/tests/
cd frontend/gridsync-operations-main && npm test

# 5. Commit and push
git add .
git commit -m "Add: your feature description"
git push origin feature/your-feature

# 6. Create Pull Request
```

### **Code Standards**
- **Python**: PEP 8, type hints, docstrings
- **JavaScript**: ESLint, Prettier configuration
- **Tests**: >80% coverage for new features
- **Documentation**: Update README for user-facing changes

### **Project Roadmap**
- [ ] **v2.2**: Add solar forecasting integration
- [ ] **v2.3**: Real-time weather radar integration
- [ ] **v2.4**: Advanced battery degradation models
- [ ] **v3.0**: Multi-farm coordination system

---

## **📚 References & Resources**

### **Technical Documentation**
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

### **Energy References**
- [Wind Power Forecasting Techniques](https://www.nrel.gov/wind/)
- [Grid-Scale Battery Storage](https://www.energy.gov/eere/electricity/grid-scale-storage)
- [Renewable Integration Studies](https://www.iea.org/topics/renewables)


## **⚠️ Disclaimer & Acknowledgments**

### **AI Assistance Disclosure**
This project utilized AI tools (GitHub Copilot, ChatGPT) to accelerate development in the following areas:
- Code structuring and boilerplate generation
- Documentation and comment writing
- Debugging assistance and error analysis
- UI/UX design suggestions

**However**, all core algorithms, business logic, architecture decisions, and final implementations were manually developed, reviewed, and validated by the engineering team.

### **Acknowledgments**
- **Data Sources**: National Renewable Energy Laboratory (NREL)
- **Icons**: Font Awesome, Heroicons
- **UI Inspiration**: Modern dashboard design patterns
- **Testing**: Open source community tools and frameworks

### **License**
This project is licensed under the MIT License - see the LICENSE file for details.

---

## **🎯 Final Checklist Before Deployment**

- [ ] Backend API running on port 8001
- [ ] Frontend dashboard running on port 3000
- [ ] ML models loaded successfully
- [ ] Database connections established
- [ ] Environment variables configured
- [ ] Health checks passing
- [ ] Documentation updated
- [ ] Tests passing

---

**⚡ Ready to optimize renewable energy grids? Start with `streamlit run app.py` to learn, then deploy the full system for production-grade wind farm management!**

**🌬️ Harness the wind. Balance the grid. Power the future.**
