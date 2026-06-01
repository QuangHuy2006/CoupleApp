// Geolocation Service for tracking user location
interface CoordinatesType {
    latitude: number;
    longitude: number;
    timestamp: number;
}

class GeolocationService {
    private watchId: number | null = null;
    private listeners: ((coords: CoordinatesType) => void)[] = [];
    private errorListeners: ((error: any) => void)[] = [];

    /**
     * Request user permission and start tracking location
     */
    async requestPermission(): Promise<boolean> {
        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by this browser');
            }

            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        resolve(true);
                    },
                    (error) => {
                        console.error('Geolocation permission denied:', error);
                        resolve(false);
                    }
                );
            });
        } catch (error) {
            console.error('Geolocation request error:', error);
            return false;
        }
    }

    /**
     * Get current position once
     */
    async getCurrentPosition(): Promise<CoordinatesType | null> {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    resolve(null);
                }
            );
        });
    }

    /**
     * Start watching location continuously
     * @param callback Function to call when location changes
     * @param interval Update interval in milliseconds
     */
    startWatching(
        callback: (coords: CoordinatesType) => void,
        _interval: number = 10000 // Default 10 seconds
    ): void {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported');
            return;
        }

        const listener = callback;
        this.listeners.push(listener);

        // First, get current position immediately
        this.getCurrentPosition().then((coords) => {
            if (coords) {
                callback(coords);
            }
        });

        // Then watch for changes
        if (this.watchId === null) {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        timestamp: position.timestamp
                    };

                    // Notify all listeners
                    this.listeners.forEach((cb) => cb(coords));
                },
                (error) => {
                    console.error('Watch error:', error);
                    this.errorListeners.forEach((cb) => cb(error));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        }
    }

    /**
     * Stop watching location
     */
    stopWatching(): void {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.listeners = [];
    }

    /**
     * Add error listener
     */
    onError(callback: (error: any) => void): void {
        this.errorListeners.push(callback);
    }

    /**
     * Calculate distance between two coordinates
     */
    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Get direction from one coordinate to another
     */
    static getDirection(lat1: number, lon1: number, lat2: number, lon2: number): string {
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const angle = Math.atan2(dLat, dLon) * (180 / Math.PI);

        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round((angle + 180) / 45) % 8;
        return directions[index];
    }
}

export default new GeolocationService();
