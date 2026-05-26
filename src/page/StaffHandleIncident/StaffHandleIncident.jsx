import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClock, FiFileText, FiSearch, FiUser, FiUsers, FiX } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AxiosSetup from '../../services/AxiosSetup';
import './StaffHandleIncident.css';

const STATUS_FILTERS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Đang chờ' },
    { value: 'investigating', label: 'Đang điều tra' },
    { value: 'resolved', label: 'Đã xử lý' },
    { value: 'rejected', label: 'Đã từ chối' },
];

const STATUS_LABELS = {
    pending: 'Đang chờ',
    investigating: 'Đang điều tra',
    resolved: 'Đã xử lý',
    rejected: 'Đã từ chối',
};

const formatDateTime = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const getStatusClass = (status) => String(status || 'pending').toLowerCase();
const getStatusLabel = (status) => STATUS_LABELS[String(status || 'pending').toLowerCase()] || status || '-';

const StaffHandleIncident = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [incidentDetail, setIncidentDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [resolutionNote, setResolutionNote] = useState('');
    const [confirmAction, setConfirmAction] = useState('');

    const isFinalStatus = String(incidentDetail?.status || '').toLowerCase() === 'resolved' || String(incidentDetail?.status || '').toLowerCase() === 'rejected';

    const fetchIncidents = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/Incident/all');
            setIncidents(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách sự cố.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await fetchIncidents();
        })();
    }, [fetchIncidents]);

    const filteredIncidents = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        const normalizedStatusFilter = statusFilter.toLowerCase();

        return incidents.filter((incident) => {
            const status = String(incident.status || 'pending').toLowerCase();
            const matchesStatus = normalizedStatusFilter === 'all' || status === normalizedStatusFilter;
            if (!matchesStatus) return false;
            if (!keyword) return true;

            return [incident.incidentId, incident.tripId, incident.reportedByStudentName, incident.incidentType, incident.status]
                .map((item) => String(item ?? '').toLowerCase())
                .some((item) => item.includes(keyword));
        });
    }, [incidents, search, statusFilter]);

    const openDetail = async (incidentId) => {
        try {
            setSelectedIncidentId(incidentId);
            setDetailLoading(true);
            setModalError('');
            setConfirmAction('');
            setResolutionNote('');

            const incident = incidents.find((item) => item.incidentId === incidentId) || null;
            setIncidentDetail(incident);
        } catch (e) {
            console.error(e);
            setModalError('Không thể tải chi tiết sự cố.');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedIncidentId(null);
        setIncidentDetail(null);
        setDetailLoading(false);
        setActionLoading(false);
        setModalError('');
        setResolutionNote('');
        setConfirmAction('');
    };

    const handleResolve = async (status) => {
        if (!selectedIncidentId) return false;

        try {
            setActionLoading(true);
            await AxiosSetup.put(`/Incident/${selectedIncidentId}/resolve`, {
                status,
                resolutionNote,
            });

            await fetchIncidents();
            setIncidentDetail((prev) => (prev ? { ...prev, status, resolutionNote } : prev));
            toast.success(status === 'Resolved' ? 'Đã xử lý sự cố thành công.' : 'Đã từ chối sự cố thành công.');
            return true;
        } catch (e) {
            console.error(e);
            setModalError(status === 'Resolved' ? 'Không thể xử lý sự cố.' : 'Không thể từ chối sự cố.');
            toast.error(status === 'Resolved' ? 'Xử lý sự cố thất bại.' : 'Từ chối sự cố thất bại.');
            return false;
        } finally {
            setActionLoading(false);
            setConfirmAction('');
        }
    };

    const askResolve = () => {
        setModalError('');
        setConfirmAction('resolve');
    };

    const askReject = () => {
        setModalError('');
        setConfirmAction('reject');
    };

    const confirmActionSubmit = async () => {
        const status = confirmAction === 'resolve' ? 'Resolved' : 'Rejected';
        const success = await handleResolve(status);
        if (success) closeDetail();
    };

    return (
        <div className="staff-incident-page">
            <div className="staff-incident-page__header">
                <div>
                    <p className="staff-incident-page__eyebrow">Khu vực nhân viên</p>
                    <h2>Quản lý sự cố</h2>
                    <p>Theo dõi và xử lý các sự cố bất thường của phương tiện theo thời gian thực.</p>
                </div>

                <div className="staff-incident-page__filters">
                    <div className="staff-incident-page__search">
                        <FiSearch />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo mã, loại, sinh viên, trạng thái..."
                        />
                    </div>

                    <div className="staff-incident-page__status-filters">
                        {STATUS_FILTERS.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                className={`staff-incident-page__status-filter${statusFilter === item.value ? ' staff-incident-page__status-filter--active' : ''}`}
                                onClick={() => setStatusFilter(item.value)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="staff-incident-page__summary-grid">
                <div className="staff-incident-page__summary-card">
                    <span>Sự cố đang chờ</span>
                    <strong>{incidents.filter((item) => String(item.status || '').toLowerCase() === 'pending').length}</strong>
                </div>
                <div className="staff-incident-page__summary-card">
                    <span>Đã xử lý</span>
                    <strong>{incidents.filter((item) => String(item.status || '').toLowerCase() === 'resolved').length}</strong>
                </div>
                <div className="staff-incident-page__summary-card">
                    <span>Đã từ chối</span>
                    <strong>{incidents.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length}</strong>
                </div>
            </div>

            <div className="staff-incident-page__table-card">
                {loading ? (
                    <div className="staff-incident-page__state">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="staff-incident-page__state staff-incident-page__state--error">{error}</div>
                ) : (
                    <div className="staff-incident-page__table-wrap">
                        <table className="staff-incident-page__table">
                            <thead>
                                <tr>
                                    <th>Mã sự cố</th>
                                    <th>Loại &amp; sinh viên</th>
                                    <th>Mô tả</th>
                                    <th>Ngày tạo</th>
                                    <th>Trạng thái</th>
                                    <th className="staff-incident-page__actions-head">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIncidents.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="staff-incident-page__empty-row">Không có dữ liệu phù hợp.</td>
                                    </tr>
                                ) : (
                                    filteredIncidents.map((item) => (
                                        <tr key={item.incidentId}>
                                            <td><strong>#{item.incidentId}</strong></td>
                                            <td>
                                                <div className="staff-incident-page__type-block">
                                                    <strong>{item.incidentType || '-'}</strong>
                                                    <span>{item.reportedByStudentName || '-'}</span>
                                                </div>
                                            </td>
                                            <td>{item.description || '-'}</td>
                                            <td>{formatDateTime(item.createdAt)}</td>
                                            <td>
                                                <span className={`staff-incident-page__status staff-incident-page__status--${getStatusClass(item.status)}`}>
                                                    {getStatusLabel(item.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="staff-incident-page__actions">
                                                    <button type="button" className="staff-incident-page__icon-btn" onClick={() => openDetail(item.incidentId)}>
                                                        <FiFileText />
                                                        Xem chi tiết
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

            {selectedIncidentId ? (
                <div className="staff-incident-page__modal-backdrop" role="presentation" onClick={closeDetail}>
                    <div className="staff-incident-page__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="staff-incident-page__modal-head">
                            <div>
                                <p>Chi tiết sự cố</p>
                                <h3>#{selectedIncidentId}</h3>
                            </div>
                            <button type="button" className="staff-incident-page__close" onClick={closeDetail}>
                                <FiX />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="staff-incident-page__state">Đang tải chi tiết...</div>
                        ) : modalError ? (
                            <div className="staff-incident-page__state staff-incident-page__state--error">{modalError}</div>
                        ) : incidentDetail ? (
                            <>
                                <div className="staff-incident-page__detail-grid">
                                    <div className="staff-incident-page__detail-item">
                                        <span>Loại sự cố</span>
                                        <strong>{incidentDetail.incidentType || '-'}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Trạng thái</span>
                                        <strong>{getStatusLabel(incidentDetail.status)}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Mã chuyến</span>
                                        <strong>{incidentDetail.tripId || '-'}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Trạng thái chuyến</span>
                                        <strong>{incidentDetail.tripStatus || '-'}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Người báo cáo</span>
                                        <strong>{incidentDetail.reportedByStudentName || '-'}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Ngày tạo</span>
                                        <strong>{formatDateTime(incidentDetail.createdAt)}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Ngày xử lý</span>
                                        <strong>{formatDateTime(incidentDetail.resolvedAt)}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Người xử lý</span>
                                        <strong>{incidentDetail.resolvedBySystemUserId || '-'}</strong>
                                    </div>
                                </div>

                                <div className="staff-incident-page__detail-description">
                                    <span>Mô tả</span>
                                    <p>{incidentDetail.description || 'Không có mô tả.'}</p>
                                </div>

                                <div className="staff-incident-page__person-panels">
                                    <div className="staff-incident-page__person-panel">
                                        <div className="staff-incident-page__person-panel-head">
                                            <FiUser />
                                            <span>Tài xế</span>
                                        </div>
                                        {incidentDetail.driver ? (
                                            <div className="staff-incident-page__person-card">
                                                <strong>{incidentDetail.driver.fullName || '-'}</strong>
                                                <span>Mã hồ sơ: {incidentDetail.driver.driverProfileId || '-'}</span>
                                                <span>Mã sinh viên: {incidentDetail.driver.studentId || '-'}</span>
                                                <span>Email: {incidentDetail.driver.email || '-'}</span>
                                                <span>Số điện thoại: {incidentDetail.driver.phoneNumber || '-'}</span>
                                            </div>
                                        ) : (
                                            <div className="staff-incident-page__image-empty">Không có thông tin tài xế</div>
                                        )}
                                    </div>

                                    <div className="staff-incident-page__person-panel">
                                        <div className="staff-incident-page__person-panel-head">
                                            <FiUsers />
                                            <span>Hành khách</span>
                                        </div>
                                        {Array.isArray(incidentDetail.passengers) && incidentDetail.passengers.length > 0 ? (
                                            <div className="staff-incident-page__passenger-list">
                                                {incidentDetail.passengers.map((passenger) => (
                                                    <div key={passenger.bookingId} className="staff-incident-page__passenger-card">
                                                        <strong>{passenger.fullName || '-'}</strong>
                                                        <span>Mã booking: {passenger.bookingId || '-'}</span>
                                                        <span>Mã sinh viên: {passenger.studentId || '-'}</span>
                                                        <span>Trạng thái: {passenger.bookingStatus || '-'}</span>
                                                        <span>Giá cuối: {passenger.finalPricePoint ?? '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="staff-incident-page__image-empty">Không có hành khách</div>
                                        )}
                                    </div>
                                </div>

                                <div className="staff-incident-page__media-grid">
                                    <div>
                                        <span>Ảnh bằng chứng</span>
                                        {incidentDetail.photoEvidenceUrl ? (
                                            <a href={incidentDetail.photoEvidenceUrl} target="_blank" rel="noreferrer">
                                                <img src={incidentDetail.photoEvidenceUrl} alt="Bằng chứng sự cố" />
                                            </a>
                                        ) : (
                                            <div className="staff-incident-page__image-empty">Không có ảnh</div>
                                        )}
                                    </div>
                                    <div>
                                        <span>Video bằng chứng</span>
                                        {incidentDetail.videoEvidenceUrl ? (
                                            <video className="staff-incident-page__video" controls preload="metadata">
                                                <source src={incidentDetail.videoEvidenceUrl} />
                                                Trình duyệt của bạn không hỗ trợ video.
                                            </video>
                                        ) : (
                                            <div className="staff-incident-page__image-empty">Không có video</div>
                                        )}
                                    </div>
                                </div>

                                <div className="staff-incident-page__detail-meta">
                                    <div>
                                        <FiClock />
                                        <span>Ghi chú xử lý: {incidentDetail.resolutionNote || '-'}</span>
                                    </div>
                                </div>

                                <div className="staff-incident-page__note-box">
                                    <label htmlFor="incident-resolution-note">Ghi chú xử lý</label>
                                    <textarea
                                        id="incident-resolution-note"
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                        placeholder="Nhập ghi chú xử lý..."
                                        rows={3}
                                    />
                                </div>

                                <div className="staff-incident-page__modal-actions">
                                    <button type="button" className="staff-incident-page__reject-btn" onClick={askReject} disabled={actionLoading || isFinalStatus}>
                                        <FiX />
                                        Từ chối
                                    </button>
                                    <button type="button" className="staff-incident-page__resolve-btn" onClick={askResolve} disabled={actionLoading || isFinalStatus}>
                                        <FiCheckCircle />
                                        Đã xử lý
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {confirmAction ? (
                <div className="staff-incident-page__confirm-backdrop" role="presentation" onClick={() => setConfirmAction('')}>
                    <div className="staff-incident-page__confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>{confirmAction === 'resolve' ? 'Xác nhận xử lý sự cố' : 'Xác nhận từ chối sự cố'}</h3>
                        <p>
                            {confirmAction === 'resolve'
                                ? 'Bạn có chắc chắn muốn đánh dấu sự cố này là đã xử lý không?'
                                : 'Bạn có chắc chắn muốn đánh dấu sự cố này là đã từ chối không?'}
                        </p>
                        <div className="staff-incident-page__confirm-actions">
                            <button type="button" className="staff-incident-page__confirm-cancel" onClick={() => setConfirmAction('')}>
                                Hủy
                            </button>
                            <button type="button" className="staff-incident-page__confirm-submit" onClick={confirmActionSubmit} disabled={actionLoading}>
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <ToastContainer position="top-right" autoClose={2500} hideProgressBar newestOnTop closeOnClick pauseOnHover theme="colored" />
        </div>
    );
};

export default StaffHandleIncident;
