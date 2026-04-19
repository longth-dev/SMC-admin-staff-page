import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClock, FiFileText, FiSearch, FiTruck, FiX } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import AxiosSetup from '../../services/AxiosSetup';
import './StaffDriverApprovalManage.css';

const ROLE_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

const formatDateTime = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const getStatusClass = (status) => String(status || 'Pending').toLowerCase();

const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

const StaffDriverApprovalManage = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [driverDetail, setDriverDetail] = useState(null);
    const [vehicleItems, setVehicleItems] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [vehicleLoading, setVehicleLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [vehicleActionLoading, setVehicleActionLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [vehicleRejectOpen, setVehicleRejectOpen] = useState(false);
    const [vehicleRejectReason, setVehicleRejectReason] = useState('');

    const systemUserId = useMemo(() => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return 0;

            const decoded = jwtDecode(token);
            const rawId = decoded[ROLE_CLAIM] || decoded.nameid || decoded.systemUserId || decoded.userId;
            return Number(rawId) || 0;
        } catch (e) {
            console.error('Cannot decode token', e);
            return 0;
        }
    }, []);

    const fetchDrivers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/DriverProfile');
            setDrivers(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách driver.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await fetchDrivers();
        })();
    }, [fetchDrivers]);

    const filteredDrivers = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        const normalizedStatusFilter = statusFilter.toLowerCase();

        return drivers.filter((driver) => {
            const status = String(driver.approvalStatus || 'pending').toLowerCase();
            const matchesStatus = normalizedStatusFilter === 'all' || status === normalizedStatusFilter;

            if (!matchesStatus) return false;

            if (!keyword) return true;

            return [driver.driverProfileId, driver.studentId, driver.driverLicenseNumber, driver.approvalStatus]
                .map((item) => String(item ?? '').toLowerCase())
                .some((item) => item.includes(keyword));
        });
    }, [drivers, search, statusFilter]);

    const openDetail = async (driverProfileId) => {
        try {
            setModalError('');
            setDetailLoading(true);
            setSelectedDriver(driverProfileId);
            setSelectedVehicle(null);
            setVehicleItems([]);
            const response = await AxiosSetup.get(`/DriverProfile/${driverProfileId}`);
            setDriverDetail(response.data || null);
        } catch (e) {
            console.error(e);
            setModalError('Không thể tải chi tiết driver.');
        } finally {
            setDetailLoading(false);
        }
    };

    const openVehicle = async (driverProfileId) => {
        try {
            setModalError('');
            setVehicleLoading(true);
            setSelectedVehicle(driverProfileId);
            setVehicleRejectOpen(false);
            setVehicleRejectReason('');
            const response = await AxiosSetup.get(`/Vehicle/getByDriverId/${driverProfileId}`);
            setVehicleItems(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error(e);
            setModalError('Không thể tải danh sách vehicle.');
        } finally {
            setVehicleLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedDriver(null);
        setDriverDetail(null);
        setSelectedVehicle(null);
        setVehicleItems([]);
        setModalError('');
        setConfirmRejectOpen(false);
        setRejectReason('');
        setVehicleRejectOpen(false);
        setVehicleRejectReason('');
    };

    const closeVehicle = () => {
        setSelectedVehicle(null);
        setVehicleItems([]);
        setModalError('');
        setVehicleRejectOpen(false);
        setVehicleRejectReason('');
    };

    const handleApproval = async (isApproved, rejectionReason = '') => {
        if (!selectedDriver) return;

        try {
            setActionLoading(true);
            await AxiosSetup.put(`/DriverProfile/Approval/${selectedDriver}`, {
                systemUserId,
                rejectionReason,
                isApproved,
            });

            await fetchDrivers();
            const response = await AxiosSetup.get(`/DriverProfile/${selectedDriver}`);
            setDriverDetail(response.data || null);
        } catch (e) {
            console.error(e);
            setModalError(isApproved ? 'Không thể duyệt driver.' : 'Không thể từ chối driver.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => handleApproval(true, '');
    const handleReject = () => {
        setModalError('');
        setConfirmRejectOpen(true);
    };
    const confirmReject = async () => {
        setConfirmRejectOpen(false);
        await handleApproval(false, rejectReason);
        setRejectReason('');
    };

    const handleVehicleApproval = async (vehicleId, isApproved, rejectReason = '') => {
        try {
            setVehicleActionLoading(true);
            await AxiosSetup.put('/Vehicle/approve', {
                vehicleId,
                isApproved,
                rejectReason,
            });

            if (selectedVehicle) {
                const response = await AxiosSetup.get(`/Vehicle/getByDriverId/${selectedVehicle}`);
                setVehicleItems(Array.isArray(response.data) ? response.data : []);
            }
        } catch (e) {
            console.error(e);
            setModalError(isApproved ? 'Không thể duyệt vehicle.' : 'Không thể từ chối vehicle.');
        } finally {
            setVehicleActionLoading(false);
        }
    };

    const handleVehicleApprove = async (vehicleId) => handleVehicleApproval(vehicleId, true, '');
    const handleVehicleReject = () => {
        setModalError('');
        setVehicleRejectOpen(true);
    };
    const confirmVehicleReject = async (vehicleId) => {
        setVehicleRejectOpen(false);
        await handleVehicleApproval(vehicleId, false, vehicleRejectReason);
        setVehicleRejectReason('');
    };

    return (
        <div className="staff-driver-approval">
            <div className="staff-driver-approval__header">
                <div>
                    <p className="staff-driver-approval__eyebrow">Staff workspace</p>
                    <h2>Duyệt Driver</h2>
                    <p>Quản lý danh sách driver đăng ký và xem chi tiết hồ sơ để phê duyệt.</p>
                </div>

                <div className="staff-driver-approval__filters">
                    <div className="staff-driver-approval__search">
                        <FiSearch />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo ID, giấy phép, trạng thái..."
                        />
                    </div>

                    <div className="staff-driver-approval__status-filters">
                        {STATUS_FILTERS.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                className={`staff-driver-approval__status-filter${statusFilter === item.value ? ' staff-driver-approval__status-filter--active' : ''}`}
                                onClick={() => setStatusFilter(item.value)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="staff-driver-approval__summary-grid">
                <div className="staff-driver-approval__summary-card">
                    <span>Đang chờ</span>
                    <strong>{drivers.filter((d) => String(d.approvalStatus || '').toLowerCase() === 'pending').length}</strong>
                </div>
                <div className="staff-driver-approval__summary-card">
                    <span>Đã duyệt</span>
                    <strong>{drivers.filter((d) => String(d.approvalStatus || '').toLowerCase() === 'approved').length}</strong>
                </div>
                <div className="staff-driver-approval__summary-card">
                    <span>Từ chối</span>
                    <strong>{drivers.filter((d) => String(d.approvalStatus || '').toLowerCase() === 'rejected').length}</strong>
                </div>
            </div>

            <div className="staff-driver-approval__table-card">
                {loading ? (
                    <div className="staff-driver-approval__state">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="staff-driver-approval__state staff-driver-approval__state--error">{error}</div>
                ) : (
                    <div className="staff-driver-approval__table-wrap">
                        <table className="staff-driver-approval__table">
                            <thead>
                                <tr>
                                    <th>Driver Profile</th>
                                    <th>Student ID</th>
                                    <th>Driver License</th>
                                    <th>Requested At</th>
                                    <th>Status</th>
                                    <th className="staff-driver-approval__actions-head">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrivers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="staff-driver-approval__empty-row">
                                            Không có dữ liệu phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDrivers.map((driver) => (
                                        <tr key={driver.driverProfileId}>
                                            <td>
                                                <strong>#{driver.driverProfileId}</strong>
                                            </td>
                                            <td>{driver.studentId}</td>
                                            <td>{driver.driverLicenseNumber || '-'}</td>
                                            <td>{formatDateTime(driver.studentRequestedAt)}</td>
                                            <td>
                                                <span className={`staff-driver-approval__status staff-driver-approval__status--${getStatusClass(driver.approvalStatus)}`}>
                                                    {driver.approvalStatus || 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="staff-driver-approval__actions">
                                                    <button type="button" className="staff-driver-approval__icon-btn" onClick={() => openDetail(driver.driverProfileId)}>
                                                        <FiFileText />
                                                        View Detail
                                                    </button>
                                                    <button type="button" className="staff-driver-approval__icon-btn staff-driver-approval__icon-btn--secondary" onClick={() => openVehicle(driver.driverProfileId)}>
                                                        <FiTruck />
                                                        View Vehicle
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedDriver ? (
                <div className="staff-driver-approval__modal-backdrop" role="presentation" onClick={closeDetail}>
                    <div className="staff-driver-approval__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="staff-driver-approval__modal-head">
                            <div>
                                <p>Driver profile detail</p>
                                <h3>#{selectedDriver}</h3>
                            </div>
                            <button type="button" className="staff-driver-approval__close" onClick={closeDetail}>
                                <FiX />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="staff-driver-approval__state">Đang tải chi tiết...</div>
                        ) : modalError ? (
                            <div className="staff-driver-approval__state staff-driver-approval__state--error">{modalError}</div>
                        ) : driverDetail ? (
                            <>
                                <div className="staff-driver-approval__detail-grid">
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Student ID</span>
                                        <strong>{driverDetail.studentId}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Status</span>
                                        <strong>{driverDetail.approvalStatus || '-'}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Requested At</span>
                                        <strong>{formatDateTime(driverDetail.studentRequestedAt)}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Approved At</span>
                                        <strong>{formatDateTime(driverDetail.approvedAt)}</strong>
                                    </div>
                                </div>

                                <div className="staff-driver-approval__detail-images">
                                    <div>
                                        <span>Driver license image</span>
                                        {driverDetail.driverLicenseImage ? (
                                            <a href={driverDetail.driverLicenseImage} target="_blank" rel="noreferrer">
                                                <img src={driverDetail.driverLicenseImage} alt="Driver license" />
                                            </a>
                                        ) : (
                                            <div className="staff-driver-approval__image-empty">No image</div>
                                        )}
                                    </div>
                                    <div>
                                        <span>Vehicle registration image</span>
                                        {driverDetail.vehicleRegistrationImage ? (
                                            <a href={driverDetail.vehicleRegistrationImage} target="_blank" rel="noreferrer">
                                                <img src={driverDetail.vehicleRegistrationImage} alt="Vehicle registration" />
                                            </a>
                                        ) : (
                                            <div className="staff-driver-approval__image-empty">No image</div>
                                        )}
                                    </div>
                                </div>

                                <div className="staff-driver-approval__detail-meta">
                                    <div>
                                        <FiClock />
                                        <span>System User ID: {systemUserId}</span>
                                    </div>
                                    <div>
                                        <FiCheckCircle />
                                        <span>Driver Mode: {driverDetail.isDriverModeEnabled ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                </div>

                                <div className="staff-driver-approval__reject-section">
                                    <input
                                        className="staff-driver-approval__reject-input"
                                        type="text"
                                        placeholder="Nhập lý do từ chối driver..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                </div>

                                <div className="staff-driver-approval__modal-actions">
                                    <button type="button" className="staff-driver-approval__reject-btn" onClick={handleReject} disabled={actionLoading}>
                                        <FiX />
                                        Reject
                                    </button>
                                    <button type="button" className="staff-driver-approval__approve-btn" onClick={handleApprove} disabled={actionLoading}>
                                        <FiCheckCircle />
                                        Approve
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {selectedVehicle ? (
                <div className="staff-driver-approval__modal-backdrop" role="presentation" onClick={closeVehicle}>
                    <div className="staff-driver-approval__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="staff-driver-approval__modal-head">
                            <div>
                                <p>Vehicle detail</p>
                                <h3>Driver #{selectedVehicle}</h3>
                            </div>
                            <button type="button" className="staff-driver-approval__close" onClick={closeVehicle}>
                                <FiX />
                            </button>
                        </div>

                        {vehicleLoading ? (
                            <div className="staff-driver-approval__state">Đang tải vehicle...</div>
                        ) : modalError ? (
                            <div className="staff-driver-approval__state staff-driver-approval__state--error">{modalError}</div>
                        ) : vehicleItems.length === 0 ? (
                            <div className="staff-driver-approval__state">Không có vehicle nào.</div>
                        ) : (
                            <div className="staff-driver-approval__vehicle-list">
                                {vehicleItems.map((vehicle) => (
                                    <div key={vehicle.vehicleId} className="staff-driver-approval__vehicle-card">
                                        <div className="staff-driver-approval__vehicle-grid">
                                            <div><span>Vehicle Type</span><strong>{vehicle.vehicleType || '-'}</strong></div>
                                            <div><span>Brand</span><strong>{vehicle.brand || '-'}</strong></div>
                                            <div><span>Model</span><strong>{vehicle.model || '-'}</strong></div>
                                            <div><span>Color</span><strong>{vehicle.color || '-'}</strong></div>
                                            <div><span>License Plate</span><strong>{vehicle.licensePlate || '-'}</strong></div>
                                            <div><span>Status</span><strong>{vehicle.status || '-'}</strong></div>
                                        </div>

                                        <div className="staff-driver-approval__reject-section">
                                            <input
                                                className="staff-driver-approval__reject-input"
                                                type="text"
                                                placeholder="Nhập lý do từ chối vehicle..."
                                                value={vehicleRejectReason}
                                                onChange={(e) => setVehicleRejectReason(e.target.value)}
                                            />
                                        </div>

                                        <div className="staff-driver-approval__modal-actions">
                                            <button type="button" className="staff-driver-approval__reject-btn" onClick={handleVehicleReject} disabled={vehicleActionLoading}>
                                                <FiX />
                                                Reject Vehicle
                                            </button>
                                            <button type="button" className="staff-driver-approval__approve-btn" onClick={() => handleVehicleApprove(vehicle.vehicleId)} disabled={vehicleActionLoading}>
                                                {vehicleActionLoading ? 'Đang duyệt...' : 'Approve Vehicle'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {confirmRejectOpen ? (
                <div className="staff-driver-approval__confirm-backdrop" role="presentation" onClick={() => setConfirmRejectOpen(false)}>
                    <div className="staff-driver-approval__confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>Xác nhận từ chối driver</h3>
                        <p>Bạn có chắc chắn muốn từ chối driver này không?</p>
                        <input
                            className="staff-driver-approval__confirm-input"
                            type="text"
                            placeholder="Nhập lý do từ chối..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="staff-driver-approval__confirm-actions">
                            <button type="button" className="staff-driver-approval__confirm-cancel" onClick={() => setConfirmRejectOpen(false)}>
                                Hủy
                            </button>
                            <button type="button" className="staff-driver-approval__reject-btn" onClick={confirmReject} disabled={actionLoading}>
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {vehicleRejectOpen ? (
                <div className="staff-driver-approval__confirm-backdrop" role="presentation" onClick={() => setVehicleRejectOpen(false)}>
                    <div className="staff-driver-approval__confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>Xác nhận từ chối vehicle</h3>
                        <p>Bạn có chắc chắn muốn từ chối vehicle này không?</p>
                        <input
                            className="staff-driver-approval__confirm-input"
                            type="text"
                            placeholder="Nhập lý do từ chối vehicle..."
                            value={vehicleRejectReason}
                            onChange={(e) => setVehicleRejectReason(e.target.value)}
                        />
                        <div className="staff-driver-approval__confirm-actions">
                            <button type="button" className="staff-driver-approval__confirm-cancel" onClick={() => setVehicleRejectOpen(false)}>
                                Hủy
                            </button>
                            <button type="button" className="staff-driver-approval__reject-btn" onClick={() => confirmVehicleReject(vehicleItems[0]?.vehicleId)} disabled={vehicleActionLoading || !vehicleItems[0]}>
                                {vehicleActionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default StaffDriverApprovalManage;
