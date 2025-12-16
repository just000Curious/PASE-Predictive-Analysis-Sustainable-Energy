import streamlit as st
import joblib
import numpy as np
import pandas as pd  # Added for data manipulation for the chart
import altair as alt  # Added for creating the new chart
from pathlib import Path

# --- 1. Page Configuration ---
st.set_page_config(
    page_title="Wind Power Predictor",
    page_icon="⚡",
    layout="wide"
)

# --- 2. Custom CSS for a Professional UI ---
st.markdown("""
<style>
/* Main app container */
[data-testid="stAppViewContainer"] {
    background: #0f172a; /* Dark slate background */
    color: #e2e8f0;
}

/* Sidebar styling */
[data-testid="stSidebar"] {
    background: #1e293b; /* Slightly lighter slate */
    border-right: 1px solid #334155;
    padding-top: 2rem;
}

/* Main title */
h1 {
    color: #ffffff;
    font-weight: 700;
}

/* Custom styled metric boxes */
.metric-box {
    background-color: #1e293b;
    border-radius: 12px;
    padding: 1.5rem 2rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    border: 1px solid #334155;
    margin-bottom: 1rem;
    height: 100%;
}

/* Metric label */
.metric-label {
    font-size: 1.2rem;
    color: #94a3b8; /* Muted gray for label */
    margin-bottom: 0.5rem;
    font-weight: 500;
}

/* Metric value */
.metric-value {
    font-size: 2.75rem;
    font-weight: 700;
    color: #ffffff;
}

/* Input text */
.input-text {
    font-size: 1.1rem;
    color: #e2e8f0;
    font-weight: 500;
}

/* Expander header */
.st-expander > summary {
    font-size: 1.1rem;
    font-weight: 600;
    color: #e2e8f0;
}

/* Expander content */
.st-expander-content {
    background-color: #1e293b; /* Match metric box bg */
    border-radius: 0 0 10px 10px;
}
</style>
""", unsafe_allow_html=True)

# --- 3. Load the Trained Model ---
MODEL_FILENAME = '/power_supply_model.joblib'


@st.cache_resource
def load_model(model_path):
    """Loads the saved model file, handling errors."""
    model_file = Path(model_path)
    if not model_file.exists():
        return None
    try:
        model = joblib.load(model_file)
        return model
    except Exception as e:
        st.error(f"Error loading model '{model_path}': {e}")
        return None


model = load_model(MODEL_FILENAME)

if model:
    # Placed in sidebar for a cleaner look
    st.sidebar.success(f"Model loaded! (95.9% accurate)")
else:
    st.error(f"Fatal Error: Model file '{MODEL_FILENAME}' not found.")
    st.info("Please make sure the model file is in the same folder as this 'app.py' script.")
    st.stop()

# --- 4. Sidebar (Inputs) ---
st.sidebar.header("⚙️ Live Weather Inputs")

wind_speed = st.sidebar.slider(
    "Wind Speed (m/s)",
    min_value=0.0,
    max_value=25.0,
    value=12.5,
    step=0.1
)

wind_direction = st.sidebar.slider(
    "Wind Direction (°)",
    min_value=0,
    max_value=360,
    value=180,
    step=1
)

# --- 5. Main Page (Title & Dashboard) ---
st.title("⚡ Wind Turbine Power Predictor ⚡")
st.info("This app uses the 95.9% accurate RandomForest model you trained.")

# --- 6. Process Inputs & Make Prediction ---
if model:
    # --- This is the *exact* feature engineering from your training script ---
    # 1. Apply sin/cos transformation
    wind_dir_sin = np.sin(np.radians(wind_direction))
    wind_dir_cos = np.cos(np.radians(wind_direction))

    # 2. Format data for the *current* prediction
    live_data = [[wind_speed, wind_dir_sin, wind_dir_cos]]

    # 3. Make the *current* prediction
    predicted_power_raw = model.predict(live_data)

    # 4. Clean the output
    predicted_power_kw = max(0, predicted_power_raw[0])


    # --- 7. NEW: Generate Data for the Power Curve Chart ---
    @st.cache_data(ttl=3600)  # Cache this for an hour
    def generate_power_curve(_model, direction):
        """Runs the model 100 times to create a full power curve."""

        # 1. Apply sin/cos for the *selected direction*
        direction_rad = np.radians(direction)
        sin_val = np.sin(direction_rad)
        cos_val = np.cos(direction_rad)

        # 2. Create an array of wind speeds from 0-25
        wind_speeds_array = np.linspace(0, 25, 100)

        # 3. Create the feature array for all 100 predictions
        sin_array = np.full(100, sin_val)
        cos_array = np.full(100, cos_val)

        prediction_data = np.stack([
            wind_speeds_array, sin_array, cos_array
        ], axis=1)

        # 4. Get all 100 predictions at once
        power_predictions = _model.predict(prediction_data)

        # 5. Clean predictions (set floor at 0)
        power_predictions[power_predictions < 0] = 0

        # 6. Create a DataFrame
        curve_df = pd.DataFrame({
            'wind_speed': wind_speeds_array,
            'predicted_power': power_predictions
        })
        return curve_df


    # Generate the curve data
    curve_df = generate_power_curve(model, wind_direction)

    # --- 8. NEW: Create the Interactive Altair Chart ---

    # Base chart (the S-curve)
    base_chart = alt.Chart(curve_df).mark_line(color='#4ade80').encode(
        x=alt.X('wind_speed', title='Wind Speed (m/s)', axis=alt.Axis(titleColor='#94a3b8', labelColor='#94a3b8')),
        y=alt.Y('predicted_power', title='Predicted Power (kW)',
                axis=alt.Axis(titleColor='#94a3b8', labelColor='#94a3b8')),
        tooltip=[
            alt.Tooltip('wind_speed', title='Wind Speed', format='.1f'),
            alt.Tooltip('predicted_power', title='Power', format='.1f')
        ]
    ).properties(
        title=f"Predicted Power Curve for {wind_direction}° Direction"
    ).interactive()  # Make it zoomable/pannable

    # Current prediction point
    current_point_df = pd.DataFrame({
        'wind_speed': [wind_speed],
        'predicted_power': [predicted_power_kw]
    })

    point_chart = alt.Chart(current_point_df).mark_circle(color='red', size=100, opacity=1).encode(
        x='wind_speed',
        y='predicted_power',
        tooltip=[
            alt.Tooltip('wind_speed', title='Current Speed', format='.1f'),
            alt.Tooltip('predicted_power', title='Current Power', format='.1f')
        ]
    )

    # Combine the curve and the point
    final_chart = (base_chart + point_chart).configure_view(
        stroke='transparent'  # Transparent chart background
    ).configure_title(
        color='#e2e8f0'  # Title color
    )

    st.altair_chart(final_chart, use_container_width=True, theme="streamlit")

    # --- 9. Display Dashboard in Columns (Same as before) ---
    col1, col2 = st.columns(2)

    with col1:
        # Custom HTML metric for Prediction
        st.markdown(f"""
        <div class="metric-box">
            <div class="metric-label">💡 Predicted Power Output</div>
            <div class="metric-value">{predicted_power_kw:.2f} kW</div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        # Custom HTML metric for Inputs
        st.markdown(f"""
        <div class="metric-box">
            <div class="metric-label">Inputs Provided</div>
            <p class="input-text">Wind Speed: {wind_speed:.1f} m/s</p>
            <p class="input-text">Wind Direction: {wind_direction}°</p>
        </div>
        """, unsafe_allow_html=True)

    st.write("")  # Add some space

    # --- 10. Explanations (Full Width) ---
    st.subheader("About This Wind Farm Model")
    st.markdown("""
    This model was trained on data from a **3.62 Megawatt (MW)** wind farm. 
    Based on this capacity, the farm likely consists of **2-3 large wind turbines**. 
    The model predicts the *total combined power output* for the entire facility.
    """)

    with st.expander("How does this model actually work?"):
        st.write("""
        The model is a **Random Forest Regressor** that was trained on over 35,000 real-world data points from this farm.

        It learned the complex, non-linear relationship (the "S-curve") between wind speed and power.

        #### The "Clock Trick" for Wind Direction
        A model doesn't understand that 359° (North) is "close" to 1° (North). To fix this, we treat the direction like a compass or a clock.

        We convert the single "direction" feature into two "smart" features:

        - **`wind_dir_sin`**: The "Vertical" position (North/South).
        - **`wind_dir_cos`**: The "Horizontal" position (East/West).

        This way, the model correctly understands that 359° and 1° have almost identical positions.

        ---

        **Your Current Inputs (Processed):**
        - **Feature 1 (`Wind Speed`):** `{speed:.1f} m/s`
        - **Feature 2 (`wind_dir_sin`):** `{wind_dir_sin:.4f}`
        - **Feature 3 (`wind_dir_cos`):** `{wind_dir_cos:.4f}`

        The model uses these three features to make its prediction.
        """.format(
            speed=wind_speed,
            wind_dir_sin=wind_dir_sin,
            wind_dir_cos=wind_dir_cos
        ))

