import { useState, useEffect, useCallback, useRef } from 'react';
import { locationApi } from '../api/locationApi';
import geolocationService from '../services/geolocationService';

interface LocationData {
    latitude: number;
    longitude: number;
    distance?: string;
    direction?: string;
    lastUpdate?: string;
}

interface UseLocationTrackingOptions {
    enabled?: boolean;
    updateInterval?: number; // in milliseconds, default 5 minutes (300000)
}

export const useLocationTracking = (options: UseLocationTrackingOptions = {}) => {
    const { enabled = true, updateInterval = 5 * 60 * 1000 } = options;

    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
    const [partnerLocation, setPartnerLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Initialize location tracking
    useEffect(() => {
        if (!enabled) return;

        const initLocationTracking = async () => {
            try {
                setLoading(true);

                // Request permission
                const permission = await geolocationService.requestPermission();
                setHasPermission(permission);

                if (!permission) {
                    setError('Permission to access location was denied');
                    setLoading(false);
                    return;
                }

                // Get current position immediately
                const coords = await geolocationService.getCurrentPosition();
                if (coords) {
                    setCurrentLocation({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    });

                    // Send to server
                    try {
                        const response = await locationApi.updateLocation(
                            coords.latitude,
                            coords.longitude
                        );
                        if (response.data.success) {
                            setPartnerLocation(response.data.partnerLocation || null);
                        }
                    } catch (err: any) {
                        console.error('Error updating location on server:', err);
                    }
                }

                setLoading(false);

                // Setup periodic updates
                setupPeriodicUpdates();
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        initLocationTracking();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled]);

    const setupPeriodicUpdates = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(async () => {
            const coords = await geolocationService.getCurrentPosition();
            if (coords) {
                setCurrentLocation({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });

                try {
                    const response = await locationApi.updateLocation(
                        coords.latitude,
                        coords.longitude
                    );
                    if (response.data.success) {
                        setPartnerLocation(response.data.partnerLocation || null);
                    }
                } catch (err: any) {
                    console.error('Error updating location:', err);
                }
            }
        }, updateInterval);
    }, [updateInterval]);

    const updateLocationNow = useCallback(async () => {
        try {
            setLoading(true);
            const coords = await geolocationService.getCurrentPosition();

            if (!coords) {
                setError('Unable to get current position');
                setLoading(false);
                return;
            }

            setCurrentLocation({
                latitude: coords.latitude,
                longitude: coords.longitude,
            });

            const response = await locationApi.updateLocation(
                coords.latitude,
                coords.longitude
            );

            if (response.data.success) {
                setPartnerLocation(response.data.partnerLocation || null);
                setError(null);
            } else {
                setError(response.data.message || 'Failed to update location');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const stopTracking = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (watchIdRef.current !== null) {
            geolocationService.stopWatching();
            watchIdRef.current = null;
        }
    }, []);

    const fetchPartnerLocation = useCallback(async () => {
        try {
            setLoading(true);
            const response = await locationApi.getPartnerLocation();
            if (response.data.success) {
                setPartnerLocation(response.data.partnerLocation || null);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        currentLocation,
        partnerLocation,
        loading,
        error,
        hasPermission,
        updateLocationNow,
        stopTracking,
        fetchPartnerLocation,
    };
};
