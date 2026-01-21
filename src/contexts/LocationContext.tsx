import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Location {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
}

interface LocationContextType {
    location: Location | null;
    error: string | null;
    loading: boolean;
    permissionStatus: PermissionState | 'unknown';
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>('unknown');

    useEffect(() => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        // Check permission status if available (Permissions API)
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state);
                result.onchange = () => {
                    setPermissionStatus(result.state);
                };
            });
        }

        const successHandler = (position: GeolocationPosition) => {
            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
            });
            setLoading(false);
            setError(null);
        };

        const errorHandler = (err: GeolocationPositionError) => {
            setLoading(false);
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    setError('User denied the request for Geolocation.');
                    break;
                case err.POSITION_UNAVAILABLE:
                    setError('Location information is unavailable.');
                    break;
                case err.TIMEOUT:
                    setError('The request to get user location timed out.');
                    break;
                default:
                    setError('An unknown error occurred.');
                    break;
            }
        };

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };

        // Start watching position
        const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, options);

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    return (
        <LocationContext.Provider value={{ location, error, loading, permissionStatus }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
