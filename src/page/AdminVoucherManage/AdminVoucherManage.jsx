import { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiSearch, FiPower, FiTrash2, FiX } from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './AdminVoucherManage.css';

const voucherTypeLabels = {
    Percent: 'Phần trăm',
    Amount: 'Số điểm',
    Compensation: 'Bồi thường',
};

const voucherTypeOptions = [
    { value: 'Percent', label: 'Phần trăm' },
    { value: 'Amount', label: 'Số điểm' },
    { value: 'Compensation', label: 'Bồi thường' },
];

const statusMeta = {
    true: {
        label: 'Đang hoạt động',
        className: 'admin-voucher__status--active',
    },
    false: {
        label: 'Đã ẩn',
        className: 'admin-voucher__status--inactive',
    },
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
};

const formatValue = (voucher) => {
    if (voucher.voucherType === 'Percent') return `${voucher.discountValue}%`;
    return `${Number(voucher.discountValue || 0).toLocaleString('vi-VN')} đ`;
};

const emptyForm = {
    code: '',
    voucherType: 'Percent',
    discountValue: '',
    maxDiscountPoint: '',
    minTripPricePoint: '',
    expiredAt: '',
    usageLimit: '',
};

const AdminVoucherManage = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(4);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [modalState, setModalState] = useState({ open: false, mode: 'create', voucher: null });
    const [form, setForm] = useState(emptyForm);
    const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
    const [confirmState, setConfirmState] = useState({ open: false, type: '', voucher: null });
    const [grantState, setGrantState] = useState({ open: false, voucher: null, reason: '' });
    const toastTimerRef = useRef(null);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/Admin/vouchers');
            setVouchers(response.data || []);
        } catch (err) {
            console.error(err);
            setError('Không thể tải danh sách voucher.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        Promise.resolve().then(fetchVouchers);

        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    useEffect(() => () => {
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ open: true, type, message });
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setToast({ open: false, type: 'success', message: '' });
        }, 3000);
    };

    const openCreateModal = () => {
        setForm(emptyForm);
        setModalState({ open: true, mode: 'create', voucher: null });
    };

    const openEditModal = (voucher) => {
        setForm({
            code: voucher.code || '',
            voucherType: voucher.voucherType || 'Percent',
            discountValue: voucher.discountValue ?? '',
            maxDiscountPoint: voucher.maxDiscountPoint ?? '',
            minTripPricePoint: voucher.minTripPricePoint ?? '',
            expiredAt: voucher.expiredAt ? new Date(voucher.expiredAt).toISOString().slice(0, 16) : '',
            usageLimit: voucher.usageLimit ?? '',
        });
        setModalState({ open: true, mode: 'edit', voucher });
    };

    const closeModal = () => {
        if (actionLoadingId) return;
        setModalState({ open: false, mode: 'create', voucher: null });
        setForm(emptyForm);
    };

    const handleFormChange = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const normalizePayload = () => ({
        code: form.code.trim(),
        voucherType: form.voucherType,
        discountValue: Number(form.discountValue),
        maxDiscountPoint: form.maxDiscountPoint === '' ? null : Number(form.maxDiscountPoint),
        minTripPricePoint: Number(form.minTripPricePoint),
        expiredAt: new Date(form.expiredAt).toISOString(),
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
    });

    const submitVoucher = async (event) => {
        event.preventDefault();

        try {
            setActionLoadingId('form');
            const payload = normalizePayload();

            if (modalState.mode === 'create') {
                const response = await AxiosSetup.post('/Admin/vouchers', payload);
                const createdVoucherId = response?.data?.voucherId || response?.data?.id || null;
                showToast('Tạo voucher thành công.');
                closeModal();
                await fetchVouchers();
                if (createdVoucherId) {
                    setGrantState({ open: true, voucher: { voucherId: createdVoucherId, code: payload.code }, reason: '' });
                }
            } else {
                await AxiosSetup.put(`/Admin/vouchers/${modalState.voucher.voucherId}`, payload);
                showToast('Cập nhật voucher thành công.');
                closeModal();
                await fetchVouchers();
            }

        } catch (err) {
            console.error(err);
            showToast('Thao tác voucher thất bại.', 'error');
            setError('Không thể lưu voucher.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const openConfirm = (type, voucher) => {
        setConfirmState({ open: true, type, voucher });
    };

    const closeConfirm = () => {
        if (actionLoadingId) return;
        setConfirmState({ open: false, type: '', voucher: null });
    };

    const confirmAction = async () => {
        const { voucher, type } = confirmState;
        if (!voucher) return;

        try {
            setActionLoadingId(voucher.voucherId);

            if (type === 'toggle') {
                const nextState = !voucher.isActive;
                await AxiosSetup.put(`/Admin/vouchers/${voucher.voucherId}/active`, null, {
                    params: { isActive: nextState, expiredAt: voucher.expiredAt },
                });

                setVouchers((current) => current.map((item) => (item.voucherId === voucher.voucherId ? { ...item, isActive: nextState } : item)));
                showToast(`${voucher.code} đã được ${nextState ? 'kích hoạt' : 'ẩn'} thành công.`);
            }

            if (type === 'delete') {
                await AxiosSetup.delete(`/Admin/vouchers/${voucher.voucherId}`);
                setVouchers((current) => current.filter((item) => item.voucherId !== voucher.voucherId));
                showToast('Xoá voucher thành công.');
            }

            closeConfirm();
        } catch (err) {
            console.error(err);
            showToast(type === 'toggle' ? 'Thay đổi trạng thái voucher thất bại.' : 'Xoá voucher thất bại.', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const confirmGrantVoucher = async () => {
        const { voucher, reason } = grantState;
        if (!voucher) return;

        try {
            setActionLoadingId(voucher.voucherId);
            await AxiosSetup.post(`/Admin/vouchers/${voucher.voucherId}/grant-all`, { reason: reason.trim() || 'Tặng voucher cho tất cả user' });
            showToast('Đã phát voucher cho tất cả user thành công.');
            setGrantState({ open: false, voucher: null, reason: '' });
        } catch (err) {
            console.error(err);
            showToast('Phát voucher thất bại.', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredVouchers = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return vouchers.filter((voucher) => {
            const matchesSearch =
                !keyword ||
                [voucher.code, voucher.voucherType].filter(Boolean).some((value) => value.toLowerCase().includes(keyword));
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && voucher.isActive) ||
                (statusFilter === 'inactive' && !voucher.isActive);
            const matchesType = typeFilter === 'all' || voucher.voucherType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [search, vouchers, statusFilter, typeFilter]);

    const total = filteredVouchers.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginatedVouchers = filteredVouchers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="admin-voucher">
            <header className="admin-voucher__header">
                <div>
                    <h2>Quản lý voucher</h2>
                    <p>Tạo, theo dõi và quản lý các voucher khuyến mãi trong hệ thống.</p>
                </div>

                <button type="button" className="admin-voucher__create-btn" onClick={openCreateModal}>
                    <FiPlus />
                    Tạo voucher mới
                </button>
            </header>

            <section className="admin-voucher__toolbar">
                <div className="admin-voucher__filters">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-voucher__select">
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Đã ẩn</option>
                    </select>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-voucher__select">
                        <option value="all">Tất cả loại giảm giá</option>
                        <option value="Percent">Phần trăm</option>
                        <option value="Amount">Số điểm</option>
                        <option value="Compensation">Bồi thường</option>
                    </select>
                </div>
                <div className="admin-voucher__search">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Tìm theo mã voucher hoặc loại..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </section>

            {error ? <p className="admin-voucher__error">{error}</p> : null}

            <section className="admin-voucher__panel">
                <div className="admin-voucher__table-wrap">
                    {loading ? (
                        <div className="admin-voucher__loading">Đang tải dữ liệu...</div>
                    ) : (
                        <table className="admin-voucher__table">
                            <thead>
                                <tr>
                                    <th>Mã</th>
                                    <th>Loại giảm giá</th>
                                    <th className="admin-voucher__text-right">Giá trị</th>
                                    <th className="admin-voucher__text-right">Giới hạn sử dụng</th>
                                    <th>Hết hạn</th>
                                    <th>Trạng thái</th>
                                    <th className="admin-voucher__text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedVouchers.map((voucher) => {
                                    const meta = statusMeta[`${voucher.isActive}`];

                                    return (
                                        <tr key={voucher.voucherId}>
                                            <td>
                                                <div className="admin-voucher__code-cell">
                                                    <strong>{voucher.code}</strong>
                                                    <span>Voucher #{voucher.voucherId}</span>
                                                </div>
                                            </td>
                                            <td>{voucherTypeLabels[voucher.voucherType] || voucher.voucherType}</td>
                                            <td className="admin-voucher__text-right">{formatValue(voucher)}</td>
                                            <td className="admin-voucher__text-right">
                                                {voucher.usageLimit === null ? 'Không giới hạn' : voucher.usageLimit}
                                            </td>
                                            <td>{formatDate(voucher.expiredAt)}</td>
                                            <td>
                                                <span className={`admin-voucher__status ${meta.className}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="admin-voucher__text-right">
                                                <div className="admin-voucher__row-actions">
                                                    <button type="button" className="admin-voucher__action-btn" onClick={() => openEditModal(voucher)} disabled={actionLoadingId === voucher.voucherId}>
                                                        <FiEdit2 />
                                                        Sửa
                                                    </button>
                                                    <button type="button" className="admin-voucher__action-btn admin-voucher__action-btn--secondary" onClick={() => openConfirm('toggle', voucher)} disabled={actionLoadingId === voucher.voucherId}>
                                                        <FiPower />
                                                        {voucher.isActive ? 'Ẩn' : 'Kích hoạt'}
                                                    </button>
                                                    <button type="button" className="admin-voucher__action-btn admin-voucher__action-btn--danger" onClick={() => openConfirm('delete', voucher)} disabled={actionLoadingId === voucher.voucherId}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="admin-voucher__footer">
                    <span>
                        Hiển thị {paginatedVouchers.length} / {total} voucher
                    </span>
                    <div className="admin-voucher__pagination">
                        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>
                            <FiChevronLeft />
                        </button>
                        <span>
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            </section>

            {modalState.open ? (
                <div className="admin-voucher__modal-backdrop" role="presentation" onClick={closeModal}>
                    <div className="admin-voucher__modal" role="dialog" aria-modal="true" aria-labelledby="voucher-modal-title" onClick={(event) => event.stopPropagation()}>
                        <div className="admin-voucher__modal-head">
                            <div>
                                <h3 id="voucher-modal-title">{modalState.mode === 'create' ? 'Tạo voucher mới' : 'Chỉnh sửa voucher'}</h3>
                                <p>Điền đầy đủ thông tin voucher bên dưới.</p>
                            </div>
                            <button type="button" className="admin-voucher__icon-btn" onClick={closeModal} aria-label="Đóng">
                                <FiX />
                            </button>
                        </div>

                        <form className="admin-voucher__form" onSubmit={submitVoucher}>
                            <label>
                                Mã voucher
                                <input value={form.code} onChange={(e) => handleFormChange('code', e.target.value)} required />
                            </label>

                            <label>
                                Loại voucher
                                <select value={form.voucherType} onChange={(e) => handleFormChange('voucherType', e.target.value)}>
                                    {voucherTypeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Giá trị giảm
                                <input type="number" value={form.discountValue} onChange={(e) => handleFormChange('discountValue', e.target.value)} required />
                            </label>

                            <label>
                                Mức giảm tối đa
                                <input
                                    type="number"
                                    value={form.maxDiscountPoint}
                                    onChange={(e) => handleFormChange('maxDiscountPoint', e.target.value)}
                                />
                            </label>

                            <label>
                                Giá chuyến tối thiểu để sử dụng
                                <input
                                    type="number"
                                    value={form.minTripPricePoint}
                                    onChange={(e) => handleFormChange('minTripPricePoint', e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Hết hạn
                                <input type="datetime-local" value={form.expiredAt} onChange={(e) => handleFormChange('expiredAt', e.target.value)} required />
                            </label>

                            <label>
                                Giới hạn sử dụng
                                <input type="number" value={form.usageLimit} onChange={(e) => handleFormChange('usageLimit', e.target.value)} />
                            </label>

                            <div className="admin-voucher__modal-actions">
                                <button type="button" className="admin-voucher__modal-btn admin-voucher__modal-btn--ghost" onClick={closeModal}>Hủy</button>
                                <button type="submit" className="admin-voucher__modal-btn admin-voucher__modal-btn--primary" disabled={actionLoadingId === 'form'}>
                                    {actionLoadingId === 'form' ? 'Đang lưu...' : 'Lưu voucher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {confirmState.open ? (
                <div className="admin-voucher__modal-backdrop" role="presentation" onClick={closeConfirm}>
                    <div className="admin-voucher__confirm-modal" role="dialog" aria-modal="true" aria-labelledby="voucher-confirm-title" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-voucher__modal-head">
                            <div>
                                <h3 id="voucher-confirm-title">
                                    {confirmState.type === 'toggle' ? (confirmState.voucher?.isActive ? 'Ẩn voucher' : 'Kích hoạt voucher') : 'Xoá voucher'}
                                </h3>
                                <p>
                                    {confirmState.type === 'toggle'
                                        ? `Bạn có chắc muốn ${confirmState.voucher?.isActive ? 'ẩn' : 'kích hoạt'} voucher ${confirmState.voucher?.code} không?`
                                        : `Bạn có chắc muốn xoá voucher ${confirmState.voucher?.code} không?`}
                                </p>
                            </div>
                            <button type="button" className="admin-voucher__icon-btn" onClick={closeConfirm} aria-label="Đóng">
                                <FiX />
                            </button>
                        </div>
                        <div className="admin-voucher__modal-actions">
                            <button type="button" className="admin-voucher__modal-btn admin-voucher__modal-btn--ghost" onClick={closeConfirm}>Hủy</button>
                            <button type="button" className="admin-voucher__modal-btn admin-voucher__modal-btn--primary" onClick={confirmAction}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {grantState.open ? (
                <div className="admin-voucher__modal-backdrop" role="presentation" onClick={() => setGrantState({ open: false, voucher: null, reason: '' })}>
                    <div className="admin-voucher__confirm-modal" role="dialog" aria-modal="true" aria-labelledby="voucher-grant-title" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-voucher__modal-head">
                            <div>
                                <h3 id="voucher-grant-title">Phát voucher cho tất cả user</h3>
                                <p>
                                    Voucher <strong>{grantState.voucher?.code}</strong> đã được tạo. Nhập lý do để tiếp tục phát voucher.
                                </p>
                            </div>
                            <button type="button" className="admin-voucher__icon-btn" onClick={() => setGrantState({ open: false, voucher: null, reason: '' })} aria-label="Đóng">
                                <FiX />
                            </button>
                        </div>
                        <label className="admin-voucher__grant-field">
                            Lý do phát voucher
                            <textarea
                                value={grantState.reason}
                                onChange={(e) => setGrantState((current) => ({ ...current, reason: e.target.value }))}
                                placeholder="Ví dụ: Chào mừng người dùng mới"
                                rows={4}
                            />
                        </label>
                        <div className="admin-voucher__modal-actions">
                            <button type="button" className="admin-voucher__modal-btn admin-voucher__modal-btn--ghost" onClick={() => setGrantState({ open: false, voucher: null, reason: '' })}>
                                Hủy
                            </button>
                            <button type="button" className="admin-voucher__modal-btn admin-voucher__modal-btn--primary" onClick={confirmGrantVoucher} disabled={actionLoadingId === grantState.voucher?.voucherId}>
                                {actionLoadingId === grantState.voucher?.voucherId ? 'Đang phát...' : 'Phát voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {toast.open ? <div className={`admin-voucher__toast admin-voucher__toast--${toast.type}`}>{toast.message}</div> : null}
        </div>
    );
};

export default AdminVoucherManage;
