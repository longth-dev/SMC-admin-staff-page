import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClock, FiFileText, FiSearch, FiX } from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './StaffHandleIncident.css';

const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

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
        if (!selectedIncidentId) return;

        try {
            setActionLoading(true);
            await AxiosSetup.put(`/Incident/${selectedIncidentId}/resolve`, {
                status,
                resolutionNote,
            });

            await fetchIncidents();
            setIncidentDetail((prev) => (prev ? { ...prev, status, resolutionNote } : prev));
        } catch (e) {
            console.error(e);
            setModalError(status === 'Resolved' ? 'Không thể xử lý sự cố.' : 'Không thể từ chối sự cố.');
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
        if (confirmAction === 'resolve') {
            await handleResolve('Resolved');
            return;
        }

        if (confirmAction === 'reject') {
            await handleResolve('Rejected');
            return;
        }
    };

    return (
        <div className="staff-incident-page">
            <div className="staff-incident-page__header">
                <div>
                    <p className="staff-incident-page__eyebrow">Staff workspace</p>
                    <h2>Incident Control</h2>
                    <p>Real-time monitoring and resolution tracking for fleet anomalies and vehicular accidents.</p>
                </div>

                <div className="staff-incident-page__filters">
                    <div className="staff-incident-page__search">
                        <FiSearch />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo ID, type, student, status..."
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
                    <span>Pending Investigations</span>
                    <strong>{incidents.filter((item) => String(item.status || '').toLowerCase() === 'pending').length}</strong>
                </div>
                <div className="staff-incident-page__summary-card">
                    <span>Resolved</span>
                    <strong>{incidents.filter((item) => String(item.status || '').toLowerCase() === 'resolved').length}</strong>
                </div>
                <div className="staff-incident-page__summary-card">
                    <span>Rejected</span>
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
                                    <th>Incident ID</th>
                                    <th>Type &amp; Student</th>
                                    <th>Description</th>
                                    <th>Created At</th>
                                    <th>Status</th>
                                    <th className="staff-incident-page__actions-head">Actions</th>
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
                                                    <span>{item.reportedByStudentName || '-'} • Student #{item.reportedByStudentId}</span>
                                                </div>
                                            </td>
                                            <td>{item.description || '-'}</td>
                                            <td>{formatDateTime(item.createdAt)}</td>
                                            <td>
                                                <span className={`staff-incident-page__status staff-incident-page__status--${getStatusClass(item.status)}`}>
                                                    {item.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="staff-incident-page__actions">
                                                    <button type="button" className="staff-incident-page__icon-btn" onClick={() => openDetail(item.incidentId)}>
                                                        <FiFileText />
                                                        View Detail
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
                                <p>Incident detail</p>
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
                                        <span>Incident Type</span>
                                        <strong>{incidentDetail.incidentType || '-'}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Status</span>
                                        <strong>{incidentDetail.status || '-'}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Trip ID</span>
                                        <strong>{incidentDetail.tripId || '-'}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Reported By</span>
                                        <strong>{incidentDetail.reportedByStudentName || '-'}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Created At</span>
                                        <strong>{formatDateTime(incidentDetail.createdAt)}</strong>
                                    </div>
                                    <div className="staff-incident-page__detail-item">
                                        <span>Resolved At</span>
                                        <strong>{formatDateTime(incidentDetail.resolvedAt)}</strong>
                                    </div>
                                </div>

                                <div className="staff-incident-page__detail-description">
                                    <span>Description</span>
                                    <p>{incidentDetail.description || 'No description provided.'}</p>
                                </div>

                                <div className="staff-incident-page__media-grid">
                                    <div>
                                        <span>Photo Evidence</span>
                                        {incidentDetail.photoEvidenceUrl ? (
                                            <a href={incidentDetail.photoEvidenceUrl} target="_blank" rel="noreferrer">
                                                <img src={incidentDetail.photoEvidenceUrl} alt="Incident evidence" />
                                            </a>
                                        ) : (
                                            <div className="staff-incident-page__image-empty">No image</div>
                                        )}
                                    </div>
                                    <div>
                                        <span>Video Evidence</span>
                                        {incidentDetail.videoEvidenceUrl ? (
                                            <a href={incidentDetail.videoEvidenceUrl} target="_blank" rel="noreferrer">
                                                <img src={incidentDetail.videoEvidenceUrl} alt="Incident video evidence" />
                                            </a>
                                        ) : (
                                            <div className="staff-incident-page__image-empty">No video</div>
                                        )}
                                    </div>
                                </div>

                                <div className="staff-incident-page__detail-meta">
                                    <div>
                                        <FiClock />
                                        <span>Resolved By: {incidentDetail.resolvedBySystemUserId || '-'}</span>
                                    </div>
                                    <div>
                                        <FiCheckCircle />
                                        <span>Resolution Note: {incidentDetail.resolutionNote || '-'}</span>
                                    </div>
                                </div>

                                <div className="staff-incident-page__note-box">
                                    <label htmlFor="incident-resolution-note">Resolution note</label>
                                    <textarea
                                        id="incident-resolution-note"
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                        placeholder="Nhập ghi chú xử lý..."
                                        rows={3}
                                    />
                                </div>

                                <div className="staff-incident-page__modal-actions">
                                    <button type="button" className="staff-incident-page__reject-btn" onClick={askReject} disabled={actionLoading}>
                                        <FiX />
                                        Reject
                                    </button>
                                    <button type="button" className="staff-incident-page__resolve-btn" onClick={askResolve} disabled={actionLoading}>
                                        <FiCheckCircle />
                                        Resolved
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
                                ? 'Bạn có chắc chắn muốn đánh dấu sự cố này là Resolved không?'
                                : 'Bạn có chắc chắn muốn đánh dấu sự cố này là Rejected không?'}
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
        </div>
    );
};

export default StaffHandleIncident;
