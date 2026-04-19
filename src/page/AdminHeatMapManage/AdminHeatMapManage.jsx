import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiActivity, FiArrowUpRight, FiTrendingUp } from 'react-icons/fi';
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import fallbackAvatar from '../../assets/avtkh.png';
import AxiosSetup from '../../services/AxiosSetup';
import './AdminHeatMapManage.css';

const cleanLocationName = (value) => {
    if (!value) return '-';
    return value.split('|@lat:')[0].trim();
};

const parseRouteLocation = (value) => {
    if (!value) return null;

    const match = value.match(/@lat:([\d.-]+),lng:([\d.-]+)/);
    if (!match) return null;

    return {
        lat: Number(match[1]),
        lng: Number(match[2]),
        name: cleanLocationName(value),
    };
};

const createMapIcon = (color = '#0053ce') =>
    L.divIcon({
        className: 'admin-heatmap-page__leaflet-icon',
        html: `
            <div class="admin-heatmap-page__leaflet-heat">
                <span class="admin-heatmap-page__leaflet-heat-glow admin-heatmap-page__leaflet-heat-glow--one" style="--pin-color:${color}"></span>
                <span class="admin-heatmap-page__leaflet-heat-glow admin-heatmap-page__leaflet-heat-glow--two" style="--pin-color:${color}"></span>
                <span class="admin-heatmap-page__leaflet-heat-glow admin-heatmap-page__leaflet-heat-glow--three" style="--pin-color:${color}"></span>
                <span class="admin-heatmap-page__leaflet-flame" style="--pin-color:${color}">
                    <span class="admin-heatmap-page__leaflet-flame-core"></span>
                    <span class="admin-heatmap-page__leaflet-flame-tail"></span>
                </span>
            </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 38],
        popupAnchor: [0, -34],
    });

const getDriverAvatar = (driver) => driver?.avatar || fallbackAvatar;

const getDriverStatusClass = (status) => {
    const normalized = String(status || 'inactive').toLowerCase();

    if (normalized.includes('approve')) return 'approved';
    if (normalized.includes('route')) return 'onroute';
    if (normalized.includes('schedule')) return 'scheduled';
    return 'inactive';
};

const AdminHeatMapManage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHeatmap = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/Admin/dashboard/heatmap');
            setData(response.data || null);
        } catch (err) {
            console.error(err);
            setError('Không thể tải dữ liệu heatmap.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        Promise.resolve().then(fetchHeatmap);
    }, [fetchHeatmap]);

    const completeTrips = data?.amountOfCompletedTrips ?? 0;
    const failedTrips = data?.amountOfFailedTrips ?? 0;
    const completeRate = data?.completeRatePercent ?? 0;
    const tripToday = data?.tripToday ?? 0;
    const topDrivers = data?.topDrivers || [];
    const topDriver = topDrivers[0] || data?.topDriver || null;
    const otherDrivers = topDrivers.slice(1);
    const topMonths = data?.topMonths || [];
    const popularRoutes = useMemo(() => data?.popularRoutes || [], [data?.popularRoutes]);
    const maxCompletedTrips = Math.max(...topMonths.map((item) => item.completedTrips), 1);

    const heatPoints = useMemo(() => {
        const points = [];

        popularRoutes.forEach((route, index) => {
            const pickup = parseRouteLocation(route.pickupLocation);
            const dropoff = parseRouteLocation(route.dropoffLocation);
            const intensity = Math.max(route.completedBookings ?? 1, 1);

            if (pickup) {
                points.push({
                    id: `pickup-${index}`,
                    type: 'pickup',
                    ...pickup,
                    intensity,
                });
            }

            if (dropoff) {
                points.push({
                    id: `dropoff-${index}`,
                    type: 'dropoff',
                    ...dropoff,
                    intensity,
                });
            }
        });

        return points;
    }, [popularRoutes]);

    const mapCenter = useMemo(() => {
        if (heatPoints.length === 0) return [10.8231, 106.6297];

        const total = heatPoints.reduce(
            (acc, point) => {
                acc.lat += point.lat;
                acc.lng += point.lng;
                return acc;
            },
            { lat: 0, lng: 0 },
        );

        return [total.lat / heatPoints.length, total.lng / heatPoints.length];
    }, [heatPoints]);

    const mapBounds = useMemo(() => {
        if (heatPoints.length === 0) return null;

        return L.latLngBounds(heatPoints.map((point) => [point.lat, point.lng]));
    }, [heatPoints]);

    return (
        <div className="admin-heatmap-page">
            <header className="admin-heatmap-page__header">
                <div>
                    <h2>Quản lý heatmap</h2>
                    <p>Theo dõi thống kê vận hành, tài xế và các tuyến đường nổi bật của hệ thống.</p>
                </div>
            </header>

            {error ? <p className="admin-heatmap-page__error">{error}</p> : null}

            <section className="admin-heatmap-page__kpis">
                <article className="admin-heatmap-page__kpi-card">
                    <div>
                        <p>Chuyến hoàn thành</p>
                        <h2>{loading ? '...' : completeTrips}</h2>
                        <span>
                            <FiTrendingUp /> Tổng số chuyến hoàn thành
                        </span>
                    </div>
                    <div className="admin-heatmap-page__kpi-icon admin-heatmap-page__kpi-icon--success">
                        <FiActivity />
                    </div>
                </article>

                <article className="admin-heatmap-page__kpi-card">
                    <div>
                        <p>Chuyến thất bại</p>
                        <h2>{loading ? '...' : failedTrips}</h2>
                        <span className="admin-heatmap-page__kpi-danger">
                            <FiTrendingUp /> Số chuyến bị lỗi
                        </span>
                    </div>
                    <div className="admin-heatmap-page__kpi-icon admin-heatmap-page__kpi-icon--danger">
                        <FiActivity />
                    </div>
                </article>

                <article className="admin-heatmap-page__kpi-card">
                    <div>
                        <p>Tỷ lệ hoàn thành</p>
                        <h2>{loading ? '...' : `${completeRate}%`}</h2>
                        <span>
                            <FiArrowUpRight /> Tỷ lệ hoàn thành tổng thể
                        </span>
                    </div>
                    <div className="admin-heatmap-page__progress-ring">
                        <svg viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" />
                            <circle
                                cx="40"
                                cy="40"
                                r="34"
                                style={{
                                    strokeDasharray: '213.6',
                                    strokeDashoffset: `${213.6 - (213.6 * completeRate) / 100}`,
                                }}
                            />
                        </svg>
                        <strong>{loading ? '...' : 'Active'}</strong>
                    </div>
                </article>
            </section>

            <section className="admin-heatmap-page__grid">
                <article className="admin-heatmap-page__panel admin-heatmap-page__drivers">
                    <div className="admin-heatmap-page__panel-head">
                        <h3>Tài xế nổi bật</h3>
                        <button type="button">Xem tất cả</button>
                    </div>

                    <div className="admin-heatmap-page__drivers-list">
                        {loading ? (
                            <div className="admin-heatmap-page__loading">Đang tải dữ liệu...</div>
                        ) : topDriver ? (
                            <div className="admin-heatmap-page__driver-item admin-heatmap-page__driver-item--featured">
                                <img className="admin-heatmap-page__driver-avatar-image" src={getDriverAvatar(topDriver)} alt={topDriver.fullName || 'Top driver'} />
                                <div className="admin-heatmap-page__driver-info">
                                    <strong>{topDriver.fullName}</strong>
                                    <span>{topDriver.email}</span>
                                    <span>Hoàn thành: {topDriver.completedTrips} chuyến</span>
                                </div>
                                <span className="admin-heatmap-page__status admin-heatmap-page__status--onroute">Top Driver</span>
                            </div>
                        ) : (
                            <div className="admin-heatmap-page__empty">Chưa có dữ liệu tài xế.</div>
                        )}

                        {otherDrivers.length > 0 ? (
                            otherDrivers.slice(0, 3).map((driver) => (
                                <div key={driver.driverProfileId} className="admin-heatmap-page__driver-item">
                                    <img className="admin-heatmap-page__driver-avatar-image" src={getDriverAvatar(driver)} alt={driver.fullName} />
                                    <div className="admin-heatmap-page__driver-info">
                                        <strong>{driver.fullName}</strong>
                                        <span>{driver.email}</span>
                                        <span>{driver.phoneNumber || `Mã tài xế: ${driver.driverProfileId}`}</span>
                                    </div>
                                    <span className={`admin-heatmap-page__status admin-heatmap-page__status--${getDriverStatusClass(driver.approvalStatus)}`}>
                                        {driver.approvalStatus || 'Inactive'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="admin-heatmap-page__empty"></div>
                        )}
                    </div>
                </article>

                <article className="admin-heatmap-page__panel admin-heatmap-page__heatmap">
                    <div className="admin-heatmap-page__panel-head">
                        <div>
                            <h3>Bản đồ điểm nóng</h3>
                        </div>
                    </div>

                    <div className="admin-heatmap-page__map">
                        <MapContainer center={mapCenter} zoom={12} className="admin-heatmap-page__leaflet-map" scrollWheelZoom bounds={mapBounds || undefined}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <div className="admin-heatmap-page__map-wave admin-heatmap-page__map-wave--one" />
                            <div className="admin-heatmap-page__map-wave admin-heatmap-page__map-wave--two" />
                            <div className="admin-heatmap-page__map-wave admin-heatmap-page__map-wave--three" />

                            {heatPoints.length === 0 ? (
                                <div className="admin-heatmap-page__empty admin-heatmap-page__map-empty">Chưa có dữ liệu tọa độ route.</div>
                            ) : (
                                heatPoints.map((point) => (
                                    <Marker
                                        key={point.id}
                                        position={[point.lat, point.lng]}
                                        icon={createMapIcon(point.type === 'pickup' ? '#ff4d4d' : '#ff7a18')}
                                    >
                                        <Tooltip direction="top" offset={[0, -26]} opacity={1} permanent className="admin-heatmap-page__map-tooltip">
                                            {point.name}
                                        </Tooltip>
                                        <Popup>
                                            <strong>{point.name}</strong>
                                            <br />
                                            {point.type === 'pickup' ? 'Điểm đón' : 'Điểm trả'}
                                            <br />
                                            {point.lat}, {point.lng}
                                            <br />
                                            Độ phổ biến: {point.intensity}
                                        </Popup>
                                    </Marker>
                                ))
                            )}
                        </MapContainer>

                        <div className="admin-heatmap-page__map-glow-overlay" />

                        <div className="admin-heatmap-page__map-legend">
                            <span><i className="admin-heatmap-page__legend-dot admin-heatmap-page__legend-dot--pickup" /> Điểm đón</span>
                            <span><i className="admin-heatmap-page__legend-dot admin-heatmap-page__legend-dot--dropoff" /> Điểm trả</span>
                        </div>
                    </div>
                </article>
            </section>

            <section className="admin-heatmap-page__bottom-grid">
                <article className="admin-heatmap-page__panel admin-heatmap-page__trips">
                    <h3>Chuyến đi hôm nay</h3>
                    <div className="admin-heatmap-page__trips-stack">
                        <div className="admin-heatmap-page__load-card">
                            <strong>{loading ? '...' : tripToday}</strong>
                            <span>Tổng chuyến hôm nay</span>
                        </div>
                    </div>
                </article>

                <article className="admin-heatmap-page__panel admin-heatmap-page__months">
                    <h3>Top tháng hoàn thành</h3>
                    <div className="admin-heatmap-page__bar-list">
                        {topMonths.length === 0 ? (
                            <div className="admin-heatmap-page__empty">Chưa có dữ liệu tháng.</div>
                        ) : (
                            topMonths.map((item) => {
                                const barWidth = `${Math.max((item.completedTrips / maxCompletedTrips) * 100, 12)}%`;

                                return (
                                    <div key={item.label} className="admin-heatmap-page__bar-item admin-heatmap-page__bar-item--row">
                                        <div className="admin-heatmap-page__bar-track admin-heatmap-page__bar-track--row">
                                            <div className="admin-heatmap-page__bar-fill" style={{ width: barWidth }} />
                                        </div>
                                        <div className="admin-heatmap-page__bar-meta">
                                            <span>{item.label}</span>
                                            <small>{item.completedTrips} chuyến</small>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </article>

                <article className="admin-heatmap-page__panel admin-heatmap-page__routes">
                    <h3>Tuyến phổ biến</h3>
                    <div className="admin-heatmap-page__route-list">
                        {popularRoutes.length === 0 ? (
                            <div className="admin-heatmap-page__empty">Chưa có dữ liệu tuyến đường.</div>
                        ) : (
                            popularRoutes.map((route, index) => {
                                const pickupName = cleanLocationName(route.pickupLocation);
                                const dropoffName = cleanLocationName(route.dropoffLocation);

                                return (
                                    <div key={`${route.route}-${index}`} className="admin-heatmap-page__route-chip" title={`${pickupName} → ${dropoffName}`}>
                                        <span className="admin-heatmap-page__route-chip-icon">+</span>
                                        <div className="admin-heatmap-page__route-chip-text admin-heatmap-page__route-chip-text--full">
                                            <span className="admin-heatmap-page__route-chip-line">{pickupName}</span>
                                            <span className="admin-heatmap-page__route-chip-arrow">→</span>
                                            <span className="admin-heatmap-page__route-chip-line">{dropoffName}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </article>
            </section>
        </div>
    );
};

export default AdminHeatMapManage;
