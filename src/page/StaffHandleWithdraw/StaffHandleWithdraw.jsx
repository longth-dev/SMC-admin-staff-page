import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClock, FiFileText, FiSearch, FiX } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import AxiosSetup from '../../services/AxiosSetup';
import 'react-toastify/dist/ReactToastify.css';
import './StaffHandleWithdraw.css';

const NAME_ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

const STATUS_FILTERS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Đang chờ' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Đã từ chối' },
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

const formatMoney = (value) => {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2,
    }).format(amount) + ' point';
};

const getStatusClass = (status) => String(status || 'pending').toLowerCase();

const StaffHandleWithdraw = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedWithdrawId, setSelectedWithdrawId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
    const [transferProofImage, setTransferProofImage] = useState(null);
    const [transferProofPreview, setTransferProofPreview] = useState('');

    const systemUserId = useMemo(() => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return 0;

            const decoded = jwtDecode(token);
            const rawId = decoded[NAME_ID_CLAIM] || decoded.nameid || decoded.systemUserId || decoded.userId;
            return Number(rawId) || 0;
        } catch (e) {
            console.error('Không thể giải mã token', e);
            return 0;
        }
    }, []);

    const fetchWithdrawals = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/Withdraw');
            setWithdrawals(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách rút tiền.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await fetchWithdrawals();
        })();
    }, [fetchWithdrawals]);

    const filteredWithdrawals = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        const normalizedStatusFilter = statusFilter.toLowerCase();

        return withdrawals.filter((item) => {
            const status = String(item.status || 'pending').toLowerCase();
            const matchesStatus = normalizedStatusFilter === 'all' || status === normalizedStatusFilter;
            if (!matchesStatus) return false;
            if (!keyword) return true;

            return [item.withdrawRequestId, item.walletId, item.amount, item.status]
                .map((value) => String(value ?? '').toLowerCase())
                .some((value) => value.includes(keyword));
        });
    }, [search, statusFilter, withdrawals]);

    const openDetail = async (withdrawRequestId) => {
        try {
            setModalError('');
            setDetailLoading(true);
            setSelectedWithdrawId(withdrawRequestId);
            const response = await AxiosSetup.get(`/Withdraw/${withdrawRequestId}`);
            setDetail(response.data || null);
        } catch (e) {
            console.error(e);
            setModalError('Không thể tải chi tiết withdrawal.');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedWithdrawId(null);
        setDetail(null);
        setModalError('');
        setConfirmRejectOpen(false);
        setTransferProofImage(null);
        setTransferProofPreview('');
    };

    const handleApproval = async (isApproved) => {
        if (!selectedWithdrawId || !detail) return false;

        try {
            setActionLoading(true);
            const formData = new FormData();
            formData.append('WalletId', String(detail.walletId ?? 0));
            formData.append('Point', String(detail.amount ?? 0));
            formData.append('SystemUserId', String(systemUserId));
            formData.append('Approval', String(Boolean(isApproved)));
            if (transferProofImage) {
                formData.append('TransferProofImage', transferProofImage);
            }

            await AxiosSetup.put(`/Withdraw/Approval/${selectedWithdrawId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await fetchWithdrawals();
            const response = await AxiosSetup.get(`/Withdraw/${selectedWithdrawId}`);
            setDetail(response.data || null);
            toast.success(isApproved ? 'Duyệt withdrawal thành công.' : 'Từ chối withdrawal thành công.', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: 'colored',
            });
            return true;
        } catch (e) {
            console.error(e);
            setModalError(isApproved ? 'Không thể duyệt withdrawal.' : 'Không thể từ chối withdrawal.');
            toast.error(isApproved ? 'Không thể duyệt withdrawal.' : 'Không thể từ chối withdrawal.', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: 'colored',
            });
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        const success = await handleApproval(true);
        if (success) closeDetail();
    };
    const handleReject = () => {
        setModalError('');
        setConfirmRejectOpen(true);
    };

    const confirmReject = async () => {
        setConfirmRejectOpen(false);
        const success = await handleApproval(false);
        if (success) closeDetail();
    };

    const handleProofImageChange = (file) => {
        if (transferProofPreview) {
            URL.revokeObjectURL(transferProofPreview);
        }

        if (!file) {
            setTransferProofImage(null);
            setTransferProofPreview('');
            return;
        }

        setTransferProofImage(file);
        setTransferProofPreview(URL.createObjectURL(file));
    };

    const clearProofImage = () => {
        if (transferProofPreview) {
            URL.revokeObjectURL(transferProofPreview);
        }

        setTransferProofImage(null);
        setTransferProofPreview('');
    };

    return (
        <div className="staff-withdraw-page">
            <div className="staff-withdraw-page__header">
                <div>
                    <p className="staff-withdraw-page__eyebrow">Khu vực nhân viên</p>
                    <h2>Xử lý yêu cầu rút tiền</h2>
                    <p>Quản lý các yêu cầu rút tiền của tài xế và xem các giao dịch được đánh dấu cần kiểm tra.</p>
                </div>

                <div className="staff-withdraw-page__filters">
                    <div className="staff-withdraw-page__search">
                        <FiSearch />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo mã, ví, số tiền, trạng thái..."
                        />
                    </div>

                    <div className="staff-withdraw-page__status-filters">
                        {STATUS_FILTERS.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                className={`staff-withdraw-page__status-filter${statusFilter === item.value ? ' staff-withdraw-page__status-filter--active' : ''}`}
                                onClick={() => setStatusFilter(item.value)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="staff-withdraw-page__summary-grid">
                <div className="staff-withdraw-page__summary-card">
                    <span>Yêu cầu đang chờ</span>
                    <strong>{withdrawals.filter((item) => String(item.status || '').toLowerCase() === 'pending').length}</strong>
                </div>
                <div className="staff-withdraw-page__summary-card">
                    <span>Tổng đã xử lý hôm nay</span>
                    <strong>{formatMoney(withdrawals.filter((item) => String(item.status || '').toLowerCase() === 'approved').reduce((sum, item) => sum + Number(item.amount || 0), 0))}</strong>
                </div>
                <div className="staff-withdraw-page__summary-card">
                    <span>Đánh dấu cần xem xét</span>
                    <strong>{withdrawals.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length}</strong>
                </div>
            </div>

            <div className="staff-withdraw-page__table-card">
                {loading ? (
                    <div className="staff-withdraw-page__state">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="staff-withdraw-page__state staff-withdraw-page__state--error">{error}</div>
                ) : (
                    <div className="staff-withdraw-page__table-wrap">
                        <table className="staff-withdraw-page__table">
                            <thead>
                                <tr>
                                    <th>Mã rút tiền</th>
                                    <th>Mã ví</th>
                                    <th className="staff-withdraw-page__align-right">Số tiền</th>
                                    <th>Ngày tạo</th>
                                    <th>Trạng thái</th>
                                    <th className="staff-withdraw-page__actions-head">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWithdrawals.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="staff-withdraw-page__empty-row">Không có dữ liệu phù hợp.</td>
                                    </tr>
                                ) : (
                                    filteredWithdrawals.map((item) => (
                                        <tr key={item.withdrawRequestId}>
                                            <td><strong>#{item.withdrawRequestId}</strong></td>
                                            <td>{item.walletId}</td>
                                            <td className="staff-withdraw-page__align-right">{formatMoney(item.amount)}</td>
                                            <td>{formatDateTime(item.createdAt)}</td>
                                            <td>
                                                <span className={`staff-withdraw-page__status staff-withdraw-page__status--${getStatusClass(item.status)}`}>
                                                    {item.status || 'Đang chờ'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="staff-withdraw-page__actions">
                                                    <button type="button" className="staff-withdraw-page__icon-btn" onClick={() => openDetail(item.withdrawRequestId)}>
                                                        <FiFileText />
                                                        Chi tiết
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

            {selectedWithdrawId ? (
                <div className="staff-withdraw-page__modal-backdrop" role="presentation" onClick={closeDetail}>
                    <div className="staff-withdraw-page__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="staff-withdraw-page__modal-head">
                            <div>
                                <p>Chi tiết yêu cầu rút tiền</p>
                                <h3>#{selectedWithdrawId}</h3>
                            </div>
                            <button type="button" className="staff-withdraw-page__close" onClick={closeDetail}>
                                <FiX />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="staff-withdraw-page__state">Đang tải chi tiết...</div>
                        ) : modalError ? (
                            <div className="staff-withdraw-page__state staff-withdraw-page__state--error">{modalError}</div>
                        ) : detail ? (
                            <>
                                <div className="staff-withdraw-page__detail-grid">
                                    <div className="staff-withdraw-page__detail-item">
                                        <span>Mã ví</span>
                                        <strong>{detail.walletId}</strong>
                                    </div>
                                    <div className="staff-withdraw-page__detail-item">
                                        <span>Số tiền</span>
                                        <strong>{formatMoney(detail.amount)}</strong>
                                    </div>
                                    <div className="staff-withdraw-page__detail-item">
                                        <span>Trạng thái</span>
                                        <strong>{detail.status || '-'}</strong>
                                    </div>
                                    <div className="staff-withdraw-page__detail-item">
                                        <span>Ngày tạo</span>
                                        <strong>{formatDateTime(detail.createdAt)}</strong>
                                    </div>
                                    <div className="staff-withdraw-page__detail-item">
                                        <span>Tên ngân hàng</span>
                                        <strong>{detail.bankName || '-'}</strong>
                                    </div>
                                    <div className="staff-withdraw-page__detail-item">
                                        <span>Số tài khoản ngân hàng</span>
                                        <strong>{detail.bankAccount || '-'}</strong>
                                    </div>
                                </div>

                                <div className="staff-withdraw-page__detail-meta">
                                    <div>
                                        <FiClock />
                                        <span>Ngày duyệt: {formatDateTime(detail.approvedAt)}</span>
                                    </div>
                                    <div>
                                        <FiCheckCircle />
                                        <span>Người duyệt: {detail.approvedBySystemUserId || '-'}</span>
                                    </div>
                                </div>

                                <div className="staff-withdraw-page__upload-section">
                                    <span>Ảnh chứng minh chuyển khoản</span>
                                    <input
                                        className="staff-withdraw-page__file-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleProofImageChange(e.target.files?.[0] || null)}
                                    />

                                    {transferProofPreview ? (
                                        <div className="staff-withdraw-page__file-preview">
                                            <img src={transferProofPreview} alt="Ảnh xem trước chứng từ" />
                                            <div className="staff-withdraw-page__file-preview-actions">
                                                <p className="staff-withdraw-page__file-name">{transferProofImage?.name}</p>
                                                <button type="button" className="staff-withdraw-page__file-remove" onClick={clearProofImage}>
                                                    Xóa ảnh
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="staff-withdraw-page__modal-actions">
                                    <button type="button" className="staff-withdraw-page__reject-btn" onClick={handleReject} disabled={actionLoading}>
                                        <FiX />
Từ chối
                                    </button>
                                    <button type="button" className="staff-withdraw-page__approve-btn" onClick={handleApprove} disabled={actionLoading}>
                                        <FiCheckCircle />
Duyệt
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {confirmRejectOpen ? (
                <div className="staff-withdraw-page__confirm-backdrop" role="presentation" onClick={() => setConfirmRejectOpen(false)}>
                    <div className="staff-withdraw-page__confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>Xác nhận từ chối</h3>
                        <p>Bạn có chắc chắn muốn từ chối yêu cầu rút tiền này không?</p>
                        <div className="staff-withdraw-page__confirm-actions">
                            <button type="button" className="staff-withdraw-page__confirm-cancel" onClick={() => setConfirmRejectOpen(false)}>
                                Hủy
                            </button>
                            <button type="button" className="staff-withdraw-page__reject-btn" onClick={confirmReject} disabled={actionLoading}>
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
        </div>
    );
};

export default StaffHandleWithdraw;
