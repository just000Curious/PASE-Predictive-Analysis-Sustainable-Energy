import datetime
import time

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from plotly.subplots import make_subplots
from scipy import signal

# ============================================
# 🎨 SIMPLIFIED VISUALIZATION UI
# ============================================

# --- Page Configuration ---
st.set_page_config(
    page_title="Wind Energy Dashboard",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Clean CSS ---
st.markdown("""
<style>
    .main-header {
        text-align: center;
        padding: 2rem 0;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
    }

    .metric-card {
        background: white;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
    }

    .metric-value {
        font-size: 2rem;
        font-weight: bold;
        color: #2c3e50;
    }

    .metric-label {
        font-size: 0.9rem;
        color: #7f8c8d;
    }

    .section-header {
        border-bottom: 2px solid #3498db;
        padding-bottom: 0.5rem;
        margin: 1.5rem 0 1rem 0;
        color: #2c3e50;
    }
</style>
""", unsafe_allow_html=True)

# --- Initialize Session State ---
if 'simulation_data' not in st.session_state:
    st.session_state.simulation_data = None

# --- Clean Header ---
st.markdown("""
<div class="main-header">
    <h1>🌬️ Wind Energy Dashboard</h1>
    <p>Monitor and analyze wind power generation with grid storage</p>
</div>
""", unsafe_allow_html=True)

# --- Sidebar: Simple Configuration ---
with st.sidebar:
    st.markdown("## ⚙️ Settings")

    # Wind Farm Settings
    st.markdown("### Wind Farm")
    turbine_count = st.slider("Number of Turbines", 1, 100, 50)
    wind_speed = st.slider("Wind Speed (m/s)", 0.0, 25.0, 10.0, 0.5)

    # Battery Settings
    st.markdown("### Battery Storage")
    battery_capacity = st.slider("Battery Capacity (MWh)", 50, 500, 200)
    initial_soc = st.slider("Initial Charge (%)", 0, 100, 50)

    # Load Settings
    st.markdown("### Load Profile")
    load_profile = st.selectbox(
        "Load Pattern",
        ["Residential", "Industrial", "Mixed", "Flat"],
        index=0
    )

    # Simulation Control
    st.markdown("### Simulation")
    if st.button("▶️ Run Simulation", type="primary", use_container_width=True):
        with st.spinner("Running simulation..."):
            time.sleep(1)
            st.session_state.simulation_run = True
            st.success("Simulation complete!")


# Generate simulation data
def generate_simulation_data():
    """Generate simulation data with realistic patterns"""
    hours = 24
    time_index = pd.date_range(start=datetime.datetime.now(), periods=hours, freq='H')

    # Wind power generation
    base_wind = wind_speed * turbine_count * 0.3
    wind_power = base_wind * (0.7 + 0.3 * np.sin(2 * np.pi * np.arange(hours) / 24))
    wind_power = np.maximum(wind_power, 0)

    # Demand profile
    base_load = 75
    if load_profile == "Residential":
        demand = base_load * (0.8 + 0.5 * np.sin(2 * np.pi * (np.arange(hours) - 9) / 24))
    elif load_profile == "Industrial":
        demand = base_load * (0.9 + 0.1 * np.sin(2 * np.pi * np.arange(hours) / 24))
    elif load_profile == "Mixed":
        demand = base_load * (0.7 + 0.6 * np.sin(2 * np.pi * (np.arange(hours) - 18) / 24))
    else:
        demand = base_load * np.ones(hours)

    # Battery simulation
    battery_level = np.zeros(hours)
    battery_level[0] = battery_capacity * (initial_soc / 100)
    grid_import = np.zeros(hours)
    grid_export = np.zeros(hours)

    for i in range(hours):
        balance = wind_power[i] - demand[i]

        if balance > 0:  # Excess power
            # Charge battery first
            charge_amount = min(balance,
                                battery_capacity - battery_level[i - 1] if i > 0 else battery_capacity - battery_level[
                                    0])
            if i > 0:
                battery_level[i] = battery_level[i - 1] + charge_amount
            else:
                battery_level[i] = battery_level[0] + charge_amount
            grid_export[i] = balance - charge_amount
        else:  # Power deficit
            # Discharge battery first
            deficit = abs(balance)
            discharge_amount = min(deficit, battery_level[i - 1] if i > 0 else battery_level[0])
            if i > 0:
                battery_level[i] = battery_level[i - 1] - discharge_amount
            else:
                battery_level[i] = battery_level[0] - discharge_amount
            grid_import[i] = deficit - discharge_amount

    return pd.DataFrame({
        'Time': time_index,
        'Wind Power (MW)': wind_power,
        'Demand (MW)': demand,
        'Battery SOC (%)': (battery_level / battery_capacity) * 100,
        'Grid Import (MW)': grid_import,
        'Grid Export (MW)': grid_export,
        'Net Balance (MW)': wind_power - demand
    })


# Generate data
df = generate_simulation_data()

# --- Dashboard Layout ---
st.markdown('<div class="section-header"><h2>📊 Key Metrics</h2></div>', unsafe_allow_html=True)

# Key Metrics in Columns
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-value">{df['Wind Power (MW)'].mean():.1f}</div>
        <div class="metric-label">Avg Wind Power (MW)</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-value">{df['Demand (MW)'].mean():.1f}</div>
        <div class="metric-label">Avg Demand (MW)</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-value">{df['Battery SOC (%)'].mean():.1f}%</div>
        <div class="metric-label">Avg Battery SOC</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    self_sufficiency = max(0, min(100, (df['Wind Power (MW)'].sum() / df['Demand (MW)'].sum()) * 100))
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-value">{self_sufficiency:.1f}%</div>
        <div class="metric-label">Self-Sufficiency</div>
    </div>
    """, unsafe_allow_html=True)

# --- Main Charts ---
st.markdown('<div class="section-header"><h2>📈 Power Flow</h2></div>', unsafe_allow_html=True)

# Power Flow Chart
fig = go.Figure()
fig.add_trace(go.Scatter(x=df['Time'], y=df['Wind Power (MW)'],
                         name='Wind Generation', line=dict(color='green', width=3)))
fig.add_trace(go.Scatter(x=df['Time'], y=df['Demand (MW)'],
                         name='Demand', line=dict(color='blue', width=3)))
fig.add_trace(go.Scatter(x=df['Time'], y=df['Net Balance (MW)'],
                         name='Net Balance', line=dict(color='orange', width=2, dash='dash')))

fig.update_layout(
    title='Power Generation vs Demand',
    xaxis_title='Time',
    yaxis_title='Power (MW)',
    height=400,
    hovermode='x unified'
)

st.plotly_chart(fig, use_container_width=True)

# --- Battery Status ---
st.markdown('<div class="section-header"><h2>🔋 Battery Status</h2></div>', unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    # Battery SOC Chart
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df['Time'], y=df['Battery SOC (%)'],
                             name='Battery SOC', line=dict(color='purple', width=3)))
    fig.update_layout(
        title='Battery State of Charge',
        xaxis_title='Time',
        yaxis_title='SOC (%)',
        height=300,
        yaxis_range=[0, 100]
    )
    st.plotly_chart(fig, use_container_width=True)

with col2:
    # Grid Exchange Chart
    fig = go.Figure()
    fig.add_trace(go.Bar(x=df['Time'], y=df['Grid Import (MW)'],
                         name='Grid Import', marker_color='red'))
    fig.add_trace(go.Bar(x=df['Time'], y=df['Grid Export (MW)'],
                         name='Grid Export', marker_color='green'))
    fig.update_layout(
        title='Grid Power Exchange',
        xaxis_title='Time',
        yaxis_title='Power (MW)',
        height=300,
        barmode='group'
    )
    st.plotly_chart(fig, use_container_width=True)

# --- Summary Statistics ---
st.markdown('<div class="section-header"><h2>📋 Summary</h2></div>', unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    st.markdown("**Energy Totals (MWh):**")
    total_wind = df['Wind Power (MW)'].sum()
    total_demand = df['Demand (MW)'].sum()
    total_import = df['Grid Import (MW)'].sum()
    total_export = df['Grid Export (MW)'].sum()

    stats_data = {
        'Metric': ['Total Wind Energy', 'Total Demand', 'Grid Import', 'Grid Export'],
        'Value (MWh)': [f"{total_wind:.1f}", f"{total_demand:.1f}",
                        f"{total_import:.1f}", f"{total_export:.1f}"]
    }
    stats_df = pd.DataFrame(stats_data)
    st.dataframe(stats_df, use_container_width=True, hide_index=True)

with col2:
    st.markdown("**Performance Indicators:**")

    # Calculate metrics
    wind_utilization = (df['Wind Power (MW)'].mean() / (turbine_count * 3)) * 100
    battery_utilization = df['Battery SOC (%)'].std()
    load_coverage = (len(df[df['Net Balance (MW)'] >= 0]) / 24) * 100

    perf_data = {
        'Indicator': ['Wind Utilization', 'Battery Usage', 'Load Coverage'],
        'Value': [f"{wind_utilization:.1f}%", f"{battery_utilization:.1f}%", f"{load_coverage:.1f}%"]
    }
    perf_df = pd.DataFrame(perf_data)
    st.dataframe(perf_df, use_container_width=True, hide_index=True)

# --- Simple Footer ---
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; padding: 1rem;">
    <p>Wind Energy Dashboard • Simple monitoring tool for renewable energy systems</p>
</div>
""", unsafe_allow_html=True)