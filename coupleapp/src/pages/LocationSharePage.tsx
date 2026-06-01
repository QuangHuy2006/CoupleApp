import { useEffect, useRef, useState } from 'react';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { MobileLayout } from '../components/layout/MobileLayout';
import './LocationShare.css';

declare global {
    interface Window {
        L: any;
    }
}

export default function LocationSharePage() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const markersRef = useRef<any>({
        currentUser: null,
        partner: null,
    });

    const {
        currentLocation,
        partnerLocation,
        loading,
        error,
        hasPermission,
        updateLocationNow,
        fetchPartnerLocation,
    } = useLocationTracking({
        enabled: true,
        updateInterval: 5 * 60 * 1000, // 5 minutes
    });

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || map) return;
        if (!window.L) {
            console.error('Leaflet API not loaded');
            return;
        }
        
        // Prevent re-initialization on the same container in React Strict Mode
        const container = mapRef.current as any;
        if (container._leaflet_id) {
            container._leaflet_id = null;
            container.innerHTML = '';
        }

        // Create map centered at default location (Vietnam)
        const initialMap = window.L.map(mapRef.current).setView([21.0285, 105.8542], 15);

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(initialMap);

        setMap(initialMap);
        
        return () => {
            initialMap.remove();
            setMap(null);
        };
    }, []); // Empty dependency array to run only on mount

    // Update markers when locations change
    useEffect(() => {
        if (!map) return;

        // Remove old markers
        if (markersRef.current.currentUser) {
            map.removeLayer(markersRef.current.currentUser);
        }
        if (markersRef.current.partner) {
            map.removeLayer(markersRef.current.partner);
        }

        const newMarkers: any = { currentUser: null, partner: null };

        // Custom icons
        const blueIcon = window.L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        const redIcon = window.L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Add current user marker
        if (currentLocation && currentLocation.latitude != null && currentLocation.longitude != null) {
            const lat = Number(currentLocation.latitude);
            const lng = Number(currentLocation.longitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                newMarkers.currentUser = window.L.marker([lat, lng], { icon: blueIcon })
                    .addTo(map)
                    .bindPopup('Bạn');

                // Center map on current user
                map.setView([lat, lng]);
            }
        }

        // Add partner marker
        if (partnerLocation && partnerLocation.latitude != null && partnerLocation.longitude != null) {
            const pLat = Number(partnerLocation.latitude);
            const pLng = Number(partnerLocation.longitude);

            if (!isNaN(pLat) && !isNaN(pLng)) {
                newMarkers.partner = window.L.marker([pLat, pLng], { icon: redIcon })
                    .addTo(map)
                    .bindPopup('Người yêu');
            }
        }

        // Fit bounds if both markers exist
        if (newMarkers.currentUser && newMarkers.partner) {
            const bounds = window.L.latLngBounds(
                newMarkers.currentUser.getLatLng(),
                newMarkers.partner.getLatLng()
            );
            map.fitBounds(bounds, { padding: [50, 50] });
        }

        markersRef.current = newMarkers;
    }, [map, currentLocation, partnerLocation]);

    return (
        <MobileLayout>
            <div className="location-share-page">
            <div className="location-header">
                <h1>📍 Chia sẻ vị trí</h1>
                <p>Theo dõi vị trí người yêu của bạn</p>
            </div>

            {!hasPermission && (
                <div className="permission-prompt">
                    <p>Vui lòng cấp quyền truy cập vị trí để sử dụng tính năng này</p>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="location-container">
                <div className="map-container">
                    <div ref={mapRef} className="map"></div>
                </div>

                <div className="location-info">
                    <div className="info-section">
                        <h3>🧭 Vị trí của bạn</h3>
                        {currentLocation ? (
                            <div className="location-details">
                                <p>
                                    <strong>Tọa độ:</strong> {Number(currentLocation.latitude).toFixed(6)}, {Number(currentLocation.longitude).toFixed(6)}
                                </p>
                                <button
                                    className="btn-update"
                                    onClick={updateLocationNow}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang cập nhật...' : 'Cập nhật ngay'}
                                </button>
                            </div>
                        ) : (
                            <p className="loading">Đang lấy vị trí...</p>
                        )}
                    </div>

                    {partnerLocation ? (
                        <div className="info-section">
                            <h3>💑 Vị trí người yêu</h3>
                            <div className="location-details">
                                <p>
                                    <strong>Tọa độ:</strong> {Number(partnerLocation.latitude).toFixed(6)}, {Number(partnerLocation.longitude).toFixed(6)}
                                </p>
                                <p>
                                    <strong>Khoảng cách:</strong> {partnerLocation.distance || 'N/A'}
                                </p>
                                <p>
                                    <strong>Hướng:</strong> {partnerLocation.direction || 'N/A'}
                                </p>
                                {partnerLocation.lastUpdate && (
                                    <p className="last-update">
                                        <strong>Cập nhật lần cuối:</strong> {new Date(partnerLocation.lastUpdate).toLocaleTimeString('vi-VN')}
                                    </p>
                                )}
                                <button
                                    className="btn-refresh"
                                    onClick={fetchPartnerLocation}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang tải...' : 'Làm mới'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="info-section">
                            <h3>💑 Vị trí người yêu</h3>
                            <p className="no-data">Người yêu của bạn chưa chia sẻ vị trí</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="location-footer">
                <p>⏰ Vị trí được cập nhật tự động mỗi 5 phút</p>
            </div>
        </div>
        </MobileLayout>
    );
}
