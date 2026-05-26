import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiFileText, FiSearch, FiTruck, FiX } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import AxiosSetup from '../../services/AxiosSetup';
import 'react-toastify/dist/ReactToastify.css';
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

const STATUS_LABELS = {
    pending: 'Đang chờ',
    approved: 'Đã duyệt',
    rejected: 'Đã từ chối',
    suspended: 'Đã tạm khóa',
};

const getStatusClass = (status) => String(status || 'Pending').toLowerCase();
const getStatusLabel = (status) => STATUS_LABELS[String(status || 'Pending').toLowerCase()] || status || '-';

const STATUS_FILTERS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Đang chờ' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Đã từ chối' },
    { value: 'suspended', label: 'Đã tạm khóa' },
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
            console.error('Không thể giải mã token', e);
            return 0;
        }
    }, []);

    const showToast = useCallback((message, type = 'success') => {
        toast[type](message, {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'colored',
        });
    }, []);

    const fetchDrivers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/DriverProfile');
            setDrivers(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách tài xế.');
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
            setModalError('Không thể tải chi tiết tài xế.');
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
            setModalError('Không thể tải danh sách phương tiện.');
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
        if (!selectedDriver) return false;

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
            showToast(isApproved ? 'Duyệt tài xế thành công.' : 'Từ chối tài xế thành công.');
            return true;
        } catch (e) {
            console.error(e);
            setModalError(isApproved ? 'Không thể duyệt tài xế.' : 'Không thể từ chối tài xế.');
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        const success = await handleApproval(true, '');
        if (success) closeDetail();
    };
    const handleReject = () => {
        setModalError('');
        setConfirmRejectOpen(true);
    };
    const confirmReject = async () => {
        setConfirmRejectOpen(false);
        const success = await handleApproval(false, rejectReason);
        if (success) {
            setRejectReason('');
            closeDetail();
        }
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

            showToast(isApproved ? 'Duyệt phương tiện thành công.' : 'Từ chối phương tiện thành công.');
            return true;
        } catch (e) {
            console.error(e);
            setModalError(isApproved ? 'Không thể duyệt phương tiện.' : 'Không thể từ chối phương tiện.');
            return false;
        } finally {
            setVehicleActionLoading(false);
        }
    };

    const handleVehicleApprove = async (vehicleId) => {
        const success = await handleVehicleApproval(vehicleId, true, '');
        if (success) closeVehicle();
    };
    const handleVehicleReject = () => {
        setModalError('');
        setVehicleRejectOpen(true);
    };
    const confirmVehicleReject = async (vehicleId) => {
        setVehicleRejectOpen(false);
        const success = await handleVehicleApproval(vehicleId, false, vehicleRejectReason);
        if (success) {
            setVehicleRejectReason('');
            closeVehicle();
        }
    };

    return (
        <div className="staff-driver-approval">
            <div className="staff-driver-approval__header">
                <div>
                    <p className="staff-driver-approval__eyebrow">Khu vực nhân viên</p>
                    <h2>Duyệt tài xế</h2>
                    <p>Quản lý danh sách tài xế đăng ký và xem chi tiết hồ sơ để phê duyệt.</p>
                </div>

                <div className="staff-driver-approval__filters">
                    <div className="staff-driver-approval__search">
                        <FiSearch />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo mã, giấy phép, trạng thái..."
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
                                    <th>Mã hồ sơ</th>
                                    <th>Họ và tên</th>
                                    <th>Số giấy phép</th>
                                    <th>Thời gian yêu cầu</th>
                                    <th>Trạng thái</th>
                                    <th className="staff-driver-approval__actions-head">Thao tác</th>
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
                                            <td>{driver.studentFullName || '-'}</td>
                                            <td>{driver.driverLicenseNumber || '-'}</td>
                                            <td>{formatDateTime(driver.studentRequestedAt)}</td>
                                            <td>
                                                <span className={`staff-driver-approval__status staff-driver-approval__status--${getStatusClass(driver.approvalStatus)}`}>
                                                    {getStatusLabel(driver.approvalStatus)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="staff-driver-approval__actions">
                                                    <button type="button" className="staff-driver-approval__icon-btn" onClick={() => openDetail(driver.driverProfileId)}>
                                                        <FiFileText />
                                                        Xem chi tiết
                                                    </button>
                                                    <button type="button" className="staff-driver-approval__icon-btn staff-driver-approval__icon-btn--secondary" onClick={() => openVehicle(driver.driverProfileId)}>
                                                        <FiTruck />
                                                        Xem phương tiện
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
                                        <span>Họ và tên sinh viên</span>
                                        <strong>{driverDetail.studentFullName || '-'}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Họ và tên</span>
                                        <strong>{driverDetail.fullName || '-'}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Email</span>
                                        <strong>{driverDetail.email || '-'}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Giới tính</span>
                                        <strong>{driverDetail.gender || '-'}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Mã sinh viên</span>
                                        <strong>{driverDetail.studentCode || '-'}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Trạng thái</span>
                                        <strong>{getStatusLabel(driverDetail.approvalStatus)}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Số giấy phép lái xe</span>
                                        <strong>{driverDetail.driverLicenseNumber || '-'}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Thời gian yêu cầu</span>
                                        <strong>{formatDateTime(driverDetail.studentRequestedAt)}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Thời gian duyệt</span>
                                        <strong>{formatDateTime(driverDetail.approvedAt)}</strong>
                                    </div>
                                    <div className="staff-driver-approval__detail-item">
                                        <span>Số lần từ chối liên tiếp</span>
                                        <strong>{driverDetail.consecutiveRejectCount ?? 0}</strong>
                                    </div>
                                </div>

                                <div className="staff-driver-approval__detail-images">
                                    <div>
                                        <span>Ảnh căn cước công dân</span>
                                        {driverDetail.citizenIdImage ? (
                                            <a href={driverDetail.citizenIdImage} target="_blank" rel="noreferrer">
                                                <img src={driverDetail.citizenIdImage} alt="Ảnh căn cước công dân" />
                                            </a>
                                        ) : (
                                            <div className="staff-driver-approval__image-empty">Không có ảnh</div>
                                        )}
                                    </div>
                                    <div>
                                        <span>Ảnh thẻ sinh viên</span>
                                        {driverDetail.studentCardImage ? (
                                            <a href={driverDetail.studentCardImage} target="_blank" rel="noreferrer">
                                                <img src={driverDetail.studentCardImage} alt="Ảnh thẻ sinh viên" />
                                            </a>
                                        ) : (
                                            <div className="staff-driver-approval__image-empty">Không có ảnh</div>
                                        )}
                                    </div>
                                    <div>
                                        <span>Ảnh giấy phép lái xe</span>
                                        {driverDetail.driverLicenseImage ? (
                                            <a href={driverDetail.driverLicenseImage} target="_blank" rel="noreferrer">
                                                <img src={driverDetail.driverLicenseImage} alt="Ảnh giấy phép lái xe" />
                                            </a>
                                        ) : (
                                            <div className="staff-driver-approval__image-empty">Không có ảnh</div>
                                        )}
                                    </div>
                                    <div>
                                        <span>Ảnh đăng ký phương tiện</span>
                                        {driverDetail.vehicleRegistrationImage ? (
                                            <a href={driverDetail.vehicleRegistrationImage} target="_blank" rel="noreferrer">
                                                <img src={driverDetail.vehicleRegistrationImage} alt="Ảnh đăng ký phương tiện" />
                                            </a>
                                        ) : (
                                            <div className="staff-driver-approval__image-empty">Không có ảnh</div>
                                        )}
                                    </div>
                                </div>

                                <div className="staff-driver-approval__detail-meta">
                                   
                                    <div>
                                        <FiCheckCircle />
                                        <span>Chế độ tài xế: {driverDetail.isDriverModeEnabled ? 'Đã bật' : 'Đã tắt'}</span>
                                    </div>
                                    <div>
                                        <FiCheckCircle />
                                        <span>Được duyệt bởi: {driverDetail.approvedBySystemUserId ?? '-'}</span>
                                    </div>
                                    <div>
                                        <FiCheckCircle />
                                        <span>Lý do từ chối: {driverDetail.rejectionReason || '-'}</span>
                                    </div>
                                </div>

                                <div className="staff-driver-approval__reject-section">
                                    <input
                                        className="staff-driver-approval__reject-input"
                                        type="text"
                                        placeholder="Nhập lý do từ chối tài xế..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                </div>

                                

                                <div className="staff-driver-approval__modal-actions">
                                    <button type="button" className="staff-driver-approval__reject-btn" onClick={handleReject} disabled={actionLoading || ['approved', 'rejected', 'suspended'].includes(String(driverDetail.approvalStatus || '').toLowerCase())}>
                                        <FiX />
                                        Từ chối
                                    </button>
                                    <button
                                        type="button"
                                        className="staff-driver-approval__approve-btn"
                                        onClick={handleApprove}
                                        disabled={actionLoading || ['approved', 'rejected', 'suspended'].includes(String(driverDetail.approvalStatus || '').toLowerCase())}
                                    >
                                        <FiCheckCircle />
                                        {['approved', 'rejected', 'suspended'].includes(String(driverDetail.approvalStatus || '').toLowerCase()) ? 'Đã duyệt' : 'Duyệt'}
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
                                <p>Chi tiết phương tiện</p>
                                <h3>Tài xế #{selectedVehicle}</h3>
                            </div>
                            <button type="button" className="staff-driver-approval__close" onClick={closeVehicle}>
                                <FiX />
                            </button>
                        </div>

                        {vehicleLoading ? (
                            <div className="staff-driver-approval__state">Đang tải phương tiện...</div>
                        ) : modalError ? (
                            <div className="staff-driver-approval__state staff-driver-approval__state--error">{modalError}</div>
                        ) : vehicleItems.length === 0 ? (
                            <div className="staff-driver-approval__state">Không có phương tiện nào.</div>
                        ) : (
                            <div className="staff-driver-approval__vehicle-list">
                                {vehicleItems.map((vehicle) => (
                                    <div key={vehicle.vehicleId} className="staff-driver-approval__vehicle-card">
                                        <div className="staff-driver-approval__vehicle-grid">
                                            <div><span>Loại phương tiện</span><strong>{vehicle.vehicleType || '-'}</strong></div>
                                            <div><span>Hãng</span><strong>{vehicle.brand || '-'}</strong></div>
                                            <div><span>Model</span><strong>{vehicle.model || '-'}</strong></div>
                                            <div><span>Màu sắc</span><strong>{vehicle.color || '-'}</strong></div>
                                            <div><span>Biển số</span><strong>{vehicle.licensePlate || '-'}</strong></div>
                                            <div><span>Trạng thái</span><strong>{vehicle.status || '-'}</strong></div>
                                            <div><span>Ảnh đăng ký phương tiện</span>
                                                {vehicle.vehicleRegistrationImage ? (
                                                    <a href={vehicle.vehicleRegistrationImage} target="_blank" rel="noreferrer">
                                                        <img src={vehicle.vehicleRegistrationImage} alt="Ảnh đăng ký phương tiện" />
                                                    </a>
                                                ) : (
                                                    <div className="staff-driver-approval__image-empty">Không có ảnh</div>
                                                )}
                                            </div>
                                        </div>

                                       

                                        <div className="staff-driver-approval__reject-section">
                                            <input
                                                className="staff-driver-approval__reject-input"
                                                type="text"
                                                placeholder="Nhập lý do từ chối phương tiện..."
                                                value={vehicleRejectReason}
                                                onChange={(e) => setVehicleRejectReason(e.target.value)}
                                            />
                                        </div>

                                        <div className="staff-driver-approval__modal-actions">
                                            <button type="button" className="staff-driver-approval__reject-btn" onClick={handleVehicleReject} disabled={vehicleActionLoading || String(vehicle.status || '').toLowerCase() === 'approved'}>
                                                <FiX />
                                                Từ chối
                                            </button>
                                            <button
                                                type="button"
                                                className="staff-driver-approval__approve-btn"
                                                onClick={() => handleVehicleApprove(vehicle.vehicleId)}
                                                disabled={vehicleActionLoading || String(vehicle.status || '').toLowerCase() === 'approved'}
                                            >
                                                {String(vehicle.status || '').toLowerCase() === 'approved' ? 'Đã duyệt' : (vehicleActionLoading ? 'Đang duyệt...' : 'Duyệt phương tiện')}
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
                        <h3>Xác nhận từ chối tài xế</h3>
                        <p>Bạn có chắc chắn muốn từ chối tài xế này không?</p>
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
                        <h3>Xác nhận từ chối phương tiện</h3>
                        <p>Bạn có chắc chắn muốn từ chối phương tiện này không?</p>
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

            <ToastContainer />
        </div>
    );
};

export default StaffDriverApprovalManage;
