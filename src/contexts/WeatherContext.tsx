import { useAppConfig } from '@contexts/AppConfigContext';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { City, cities } from '@/data/cities';
import { getWeatherAdvice } from '@/data/weatherAdvice';

// --- Types ---

export interface WeatherData {
  temp: string;
  desc: string;
  icon: string;
}

export interface DetailedWeatherData extends WeatherData {
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  feelsLike: number;
  uvIndex: number;
  precipitation: number;
  cloudCover: number;
  dewPoint: number;
  isDay: number;
  weatherCode?: number;
}

interface WeatherContextType {
  weather: WeatherData | null;
  detailedWeather: DetailedWeatherData | null;
  weatherLoading: boolean;
  selectedCity: City;
  showWeatherModal: boolean;
  recommendation: string | null;
  fetchWeather: (city?: City) => Promise<void>;
  setShowWeatherModal: (show: boolean) => void;
}

// --- Constants & Helpers ---

const DEFAULT_CITY: City = {
  name: 'Visakhapatnam',
  state: 'AP',
  lat: 17.6868,
  lon: 83.2185,
};

export const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  const normalizedIndex = (index + 8) % 8;
  return directions[normalizedIndex] ?? 'N';
};

// Open-Meteo WMO weather codes: [description, icon, night icon if different]
const WEATHER_CODES: Record<number, [desc: string, icon: string, nightIcon?: string]> = {
  0: ['Clear sky', '☀️', '🌙'],
  1: ['Mainly clear', '🌤️', '☁️'],
  2: ['Partly cloudy', '⛅', '☁️'],
  3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Fog', '🌫️'],
  51: ['Drizzle', '🌦️'],
  53: ['Drizzle', '🌦️'],
  55: ['Drizzle', '🌦️'],
  56: ['Freezing Drizzle', '🌨️'],
  57: ['Freezing Drizzle', '🌨️'],
  61: ['Rain', '🌧️'],
  63: ['Rain', '🌧️'],
  65: ['Rain', '🌧️'],
  66: ['Freezing Rain', '🌨️'],
  67: ['Freezing Rain', '🌨️'],
  71: ['Snow fall', '❄️'],
  73: ['Snow fall', '❄️'],
  75: ['Snow fall', '❄️'],
  77: ['Snow grains', '❄️'],
  80: ['Rain showers', '🌧️'],
  81: ['Rain showers', '🌧️'],
  82: ['Rain showers', '🌧️'],
  85: ['Snow showers', '🌨️'],
  86: ['Snow showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm with hail', '⛈️'],
  99: ['Thunderstorm with hail', '⛈️'],
};

const getWeatherInfoFromCode = (code: number, isDay: number): { desc: string; icon: string } => {
  const [desc, icon, nightIcon] = WEATHER_CODES[code] ?? ['Unknown', '🌡️'];
  return { desc, icon: isDay !== 1 && nightIcon ? nightIcon : icon };
};

// --- Context & Provider ---

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config: appConfig } = useAppConfig();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [detailedWeather, setDetailedWeather] = useState<DetailedWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const [selectedCity, setSelectedCity] = useState<City>(DEFAULT_CITY);

  const fetchWeather = useCallback(
    async (city: City = selectedCity) => {
      setWeatherLoading(true);

      try {
        const lat = city.lat;
        const lon = city.lon;
        // Using Open-Meteo API
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,apparent_temperature,precipitation,uv_index,cloud_cover,dew_point_2m&timezone=Asia/Kolkata`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Weather API failed with status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.current) {
          throw new Error('Invalid weather data received.');
        }

        const {
          temperature_2m,
          weather_code,
          is_day,
          relative_humidity_2m,
          wind_speed_10m,
          wind_direction_10m,
          surface_pressure,
          apparent_temperature,
          precipitation,
          uv_index,
          cloud_cover,
          dew_point_2m,
        } = data.current;
        const { desc, icon } = getWeatherInfoFromCode(weather_code, is_day);

        const weatherData: WeatherData = {
          temp: temperature_2m.toFixed(0),
          desc: desc,
          icon: icon,
        };
        setWeather(weatherData);

        const detailedData: DetailedWeatherData = {
          ...weatherData,
          humidity: relative_humidity_2m || 0,
          windSpeed: wind_speed_10m || 0,
          windDirection: wind_direction_10m || 0,
          pressure: surface_pressure || 0,
          feelsLike: apparent_temperature || parseFloat(weatherData.temp),
          uvIndex: uv_index || 0,
          precipitation: precipitation || 0,
          cloudCover: cloud_cover || 0,
          dewPoint: dew_point_2m || 0,
          isDay: is_day || 0,
          weatherCode: weather_code,
        };
        setDetailedWeather(detailedData);
      } catch (err) {
        console.error('Weather fetch error:', err);
      } finally {
        setWeatherLoading(false);
      }
    },
    [selectedCity]
  );

  // Initial fetch and periodic update
  useEffect(() => {
    fetchWeather();
    const weatherRefreshInterval = setInterval(
      () => {
        fetchWeather();
      },
      60 * 60 * 1000
    ); // 1 hour

    return () => clearInterval(weatherRefreshInterval);
  }, [fetchWeather]);

  // Sync with Admin Config
  useEffect(() => {
    if (appConfig?.collegeInfo?.location?.city) {
      const adminCityName = appConfig.collegeInfo.location.city.toLowerCase();
      const adminState = appConfig.collegeInfo.location.state?.toLowerCase();

      const adminCity = cities.find(
        (c) =>
          c.name.toLowerCase() === adminCityName &&
          (!adminState || c.state.toLowerCase() === adminState)
      );

      if (adminCity && adminCity.name !== selectedCity.name) {
        setSelectedCity(adminCity);
      }
    }
  }, [appConfig, selectedCity]);

  // Advice is a local lookup with a random pick; memoise it so it only changes with the weather
  const temp = weather ? parseFloat(weather.temp) : null;
  const weatherCode = detailedWeather?.weatherCode;
  const recommendation = useMemo(
    () => (temp !== null && weatherCode !== undefined ? getWeatherAdvice(weatherCode, temp) : null),
    [temp, weatherCode]
  );

  const value = {
    weather,
    detailedWeather,
    weatherLoading,
    selectedCity,
    showWeatherModal,
    recommendation,
    fetchWeather,
    setShowWeatherModal,
  };

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
