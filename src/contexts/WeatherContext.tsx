import { City, cities } from '@/data/cities';
import { getWeatherAdvice } from '@/data/weatherAdvice';
import { useAppConfig } from '@contexts/AppConfigContext';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
    visibility: number;
    precipitation: number;
    cloudCover: number;
    dewPoint: number;
    isDay: number;
    weatherCode?: number;
}

interface WeatherAdviceCache {
    advice: string;
    temp: number;
    weatherCode: number;
    timeOfDay: string;
    timestamp: number;
}

interface WeatherContextType {
    weather: WeatherData | null;
    detailedWeather: DetailedWeatherData | null;
    weatherLoading: boolean;
    weatherError: string | null;
    selectedCity: City;
    showWeatherModal: boolean;
    recommendation: string | null;
    fetchWeather: (city?: City) => Promise<void>;
    setSelectedCity: (city: City) => void;
    setShowWeatherModal: (show: boolean) => void;
    toggleWeatherModal: () => void;
    cities: City[];
}

// --- Constants & Helpers ---

const DEFAULT_CITY: City = {
    name: 'Visakhapatnam',
    state: 'AP',
    lat: 17.6868,
    lon: 83.2185,
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    const normalizedIndex = (index + 8) % 8;
    return directions[normalizedIndex] ?? 'N';
};

export const getWeatherInfoFromCode = (code: number, isDay: number): { desc: string; icon: string } => {
    const is_day = isDay === 1;
    switch (code) {
        case 0:
            return { desc: 'Clear sky', icon: is_day ? '☀️' : '🌙' };
        case 1:
            return { desc: 'Mainly clear', icon: is_day ? '🌤️' : '☁️' };
        case 2:
            return { desc: 'Partly cloudy', icon: is_day ? '⛅' : '☁️' };
        case 3:
            return { desc: 'Overcast', icon: '☁️' };
        case 45:
        case 48:
            return { desc: 'Fog', icon: '🌫️' };
        case 51:
        case 53:
        case 55:
            return { desc: 'Drizzle', icon: '🌦️' };
        case 56:
        case 57:
            return { desc: 'Freezing Drizzle', icon: '🌨️' };
        case 61:
        case 63:
        case 65:
            return { desc: 'Rain', icon: '🌧️' };
        case 66:
        case 67:
            return { desc: 'Freezing Rain', icon: '🌨️' };
        case 71:
        case 73:
        case 75:
            return { desc: 'Snow fall', icon: '❄️' };
        case 77:
            return { desc: 'Snow grains', icon: '❄️' };
        case 80:
        case 81:
        case 82:
            return { desc: 'Rain showers', icon: '🌧️' };
        case 85:
        case 86:
            return { desc: 'Snow showers', icon: '🌨️' };
        case 95:
            return { desc: 'Thunderstorm', icon: '⛈️' };
        case 96:
        case 99:
            return { desc: 'Thunderstorm with hail', icon: '⛈️' };
        default:
            return { desc: 'Unknown', icon: '🌡️' };
    }
};

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
};

// --- Context & Provider ---

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { config: appConfig } = useAppConfig();
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [detailedWeather, setDetailedWeather] = useState<DetailedWeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [showWeatherModal, setShowWeatherModal] = useState(false);
    const [recommendation, setRecommendation] = useState<string | null>(null);

    const [selectedCity, setSelectedCity] = useState<City>(DEFAULT_CITY);

    const getCachedAdvice = (temp: number, weatherCode: number): string | null => {
        try {
            const cached = localStorage.getItem('weatherAdviceCache');
            if (!cached) return null;

            const cacheData: WeatherAdviceCache = JSON.parse(cached);
            const now = Date.now();

            if (
                now - cacheData.timestamp < CACHE_DURATION &&
                Math.abs(cacheData.temp - temp) < 2 &&
                cacheData.weatherCode === weatherCode
            ) {
                return cacheData.advice;
            }

            return null;
        } catch (err) {
            console.error('Cache read error:', err);
            return null;
        }
    };

    const cacheAdvice = (advice: string, temp: number, weatherCode: number) => {
        try {
            const cacheData: WeatherAdviceCache = {
                advice,
                temp,
                weatherCode,
                timeOfDay: getTimeOfDay(),
                timestamp: Date.now(),
            };
            localStorage.setItem('weatherAdviceCache', JSON.stringify(cacheData));
        } catch (err) {
            console.error('Cache write error:', err);
        }
    };

    const fetchWeatherRecommendation = async (weatherData: WeatherData, weatherCode: number) => {
        setRecommendation(null);

        try {
            const temp = parseFloat(weatherData.temp);

            // Check cache first
            const cachedAdvice = getCachedAdvice(temp, weatherCode);
            if (cachedAdvice) {
                setRecommendation(cachedAdvice);
                return;
            }

            // Get advice from pre-stored data
            const advice = getWeatherAdvice(weatherCode, temp);
            setRecommendation(advice);

            // Cache the new advice
            cacheAdvice(advice, temp, weatherCode);
        } catch (err) {
            console.error('Weather advice error:', err);
        }
    };

    const fetchWeather = useCallback(async (city: City = selectedCity) => {
        setWeatherError(null);
        setWeatherLoading(true);
        setRecommendation(null);

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
                visibility: 10,
                precipitation: precipitation || 0,
                cloudCover: cloud_cover || 0,
                dewPoint: dew_point_2m || 0,
                isDay: is_day || 0,
                weatherCode: weather_code,
            };
            setDetailedWeather(detailedData);

            await fetchWeatherRecommendation(weatherData, weather_code);
        } catch (err) {
            setWeatherError('Could not load weather.');
            console.error('Weather fetch error:', err);
        } finally {
            setWeatherLoading(false);
        }
    }, [selectedCity]);

    // Initial fetch and periodic update
    useEffect(() => {
        fetchWeather();
        const weatherRefreshInterval = setInterval(() => {
            fetchWeather();
        }, 60 * 60 * 1000); // 1 hour

        return () => clearInterval(weatherRefreshInterval);
    }, [fetchWeather]);

    // Sync with Admin Config
    useEffect(() => {
        if (appConfig?.collegeInfo?.location?.city) {
            const adminCityName = appConfig.collegeInfo.location.city.toLowerCase();
            const adminState = appConfig.collegeInfo.location.state?.toLowerCase();

            const adminCity = cities.find(c =>
                c.name.toLowerCase() === adminCityName &&
                (!adminState || c.state.toLowerCase() === adminState)
            );

            if (adminCity && (adminCity.name !== selectedCity.name)) {
                setSelectedCity(adminCity);
            }
        }
    }, [appConfig, selectedCity]);

    // Handle city change (in-memory only, not persistent)
    const handleSetSelectedCity = (city: City) => {
        setSelectedCity(city);
        fetchWeather(city);
    };

    const toggleWeatherModal = () => setShowWeatherModal((prev) => !prev);

    const value = {
        weather,
        detailedWeather,
        weatherLoading,
        weatherError,
        selectedCity,
        showWeatherModal,
        recommendation,
        fetchWeather,
        setSelectedCity: handleSetSelectedCity,
        setShowWeatherModal,
        toggleWeatherModal,
        cities,
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
