import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
from utils.config import settings


class WeatherService:
    def __init__(self, api_key: str):
        self.api_key = api_key or settings.OPENWEATHER_API_KEY
        self.default_lat = "16.99"
        self.default_lon = "73.30"

    def get_weather_forecast(self, lat: Optional[str] = None, lon: Optional[str] = None,
                             use_live_data: bool = True) -> pd.DataFrame:
        """Get 24-hour weather forecast from OpenWeatherMap API"""
        target_lat = lat if lat else self.default_lat
        target_lon = lon if lon else self.default_lon

        if not self.api_key or not use_live_data:
            return self._get_mock_weather_forecast()

        try:
            url = f"https://api.openweathermap.org/data/2.5/forecast?lat={target_lat}&lon={target_lon}&appid={self.api_key}&units=metric"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            return self._parse_weather_data(data)

        except Exception as e:
            print(f"🌤️ Weather API error: {e}. Using mock data.")
            return self._get_mock_weather_forecast()

    def _parse_weather_data(self, data: dict) -> pd.DataFrame:
        """Parse OpenWeatherMap API response"""
        datetimes, hours, speeds, dirs, temps, confidences = [], [], [], [], [], []

        forecast_items = data['list'][:8]

        for i, period_data in enumerate(forecast_items):
            dt = datetime.fromtimestamp(period_data['dt'])

            wind_data = period_data.get('wind', {})
            wind_speed = wind_data.get('speed', 0)
            wind_direction = wind_data.get('deg', 0)
            temperature = period_data['main']['temp']
            confidence = self._calculate_confidence(period_data)

            for hour_offset in [0, 1, 2]:
                hour_dt = dt + timedelta(hours=hour_offset)
                datetimes.append(hour_dt)
                hours.append(hour_dt.hour)
                # SMOOTHER WEATHER DATA - reduced variation
                speeds.append(wind_speed + np.random.normal(0, 0.3))
                dirs.append(wind_direction + np.random.normal(0, 5))
                temps.append(temperature + np.random.normal(0, 0.5))
                confidences.append(confidence)

        df = pd.DataFrame({
            'Datetime': datetimes[:24],
            'Hour': hours[:24],
            'WindSpeed_Forecast': speeds[:24],
            'WindDir_Forecast': dirs[:24],
            'Temperature': temps[:24],
            'Forecast_Confidence': confidences[:24]
        })

        print(f"🌤️ Weather forecast loaded: {len(df)} hours")
        return df

    def _calculate_confidence(self, period_data: dict) -> float:
        """Calculate forecast confidence"""
        base_confidence = 0.75
        weather_main = period_data['weather'][0]['main'].lower()

        confidence_factors = {
            'clear': 0.85,
            'clouds': 0.75,
            'rain': 0.65,
            'snow': 0.60,
            'thunderstorm': 0.50,
        }

        for condition, factor in confidence_factors.items():
            if condition in weather_main:
                base_confidence = factor
                break

        wind_speed = period_data.get('wind', {}).get('speed', 0)
        if 5 <= wind_speed <= 15:
            base_confidence += 0.05
        elif wind_speed > 20:
            base_confidence -= 0.10

        return max(0.5, min(0.95, base_confidence))

    def _get_mock_weather_forecast(self) -> pd.DataFrame:
        """Generate realistic mock weather data with less variation"""
        start_date = datetime.now()
        hours = np.arange(0, 24)
        datetimes = [start_date + timedelta(hours=int(h)) for h in hours]

        # SMOOTHER WIND PATTERN - reduced amplitude and variation
        wind_speeds = 10 + 4 * np.sin(np.pi * (hours - 8) / 16) + np.random.normal(0, 1.0, 24)
        wind_speeds = np.clip(wind_speeds, 2, 25)  # Tighter bounds
        wind_directions = 250 + 30 * np.sin(np.pi * hours / 24) + np.random.normal(0, 10, 24)

        confidences = 0.7 + 0.15 * np.cos(np.pi * (hours - 12) / 24) + np.random.normal(0, 0.03, 24)
        confidences = np.clip(confidences, 0.6, 0.9)

        df = pd.DataFrame({
            'Datetime': datetimes,
            'Hour': hours,
            'WindSpeed_Forecast': wind_speeds,
            'WindDir_Forecast': wind_directions,
            'Temperature': 25 + 3 * np.sin(np.pi * (hours - 10) / 24),  # Less variation
            'Forecast_Confidence': confidences
        })

        print(f"🌤️ Using SMOOTH mock weather data - Avg wind: {np.mean(wind_speeds):.1f} m/s")
        return df

    def get_forecast_summary(self, weather_df: pd.DataFrame) -> dict:
        """Get summary of weather forecast"""
        avg_confidence = weather_df['Forecast_Confidence'].mean()
        avg_wind_speed = weather_df['WindSpeed_Forecast'].mean()

        return {
            'forecast_confidence': f"{avg_confidence:.1%}",
            'average_wind_speed': f"{avg_wind_speed:.1f} m/s",
            'wind_range': f"{weather_df['WindSpeed_Forecast'].min():.1f}-{weather_df['WindSpeed_Forecast'].max():.1f} m/s",
            'optimal_hours': len(weather_df[weather_df['WindSpeed_Forecast'].between(6, 12)]),
            'low_wind_hours': len(weather_df[weather_df['WindSpeed_Forecast'] < 4]),
            'high_wind_hours': len(weather_df[weather_df['WindSpeed_Forecast'] > 20])
        }