import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiBell, FiChevronLeft, FiChevronRight, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './AdminNotificationManage.css';

const fixedTitle = 'SMC xin thông báo';
const fixedType = 'Other';

const emptyForm = {
    title: fixedTitle,
    message: '',
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

const AdminNotificationManage = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
    const toastTimerRef = useRef(null);

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/Admin/notifications/templates', {
                params: { page, size: pageSize },
            });

            const data = response.data;
            setTemplates(data.items || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error(err);
            setError('Không thể tải danh sách thông báo.');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => {
        Promise.resolve().then(fetchTemplates);
    }, [fetchTemplates]);

    useEffect(() => () => {
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ open: true, type, message });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToast({ open: false, type: 'success', message: '' });
        }, 3000);
    };

    const filteredTemplates = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return templates;
        return templates.filter((item) => [item.title, item.message].filter(Boolean).some((v) => v.toLowerCase().includes(keyword)));
    }, [search, templates]);

    const openCreateModal = () => {
        setForm(emptyForm);
        setModalOpen(true);
    };

    const closeModal = () => {
        if (actionLoading) return;
        setModalOpen(false);
        setForm(emptyForm);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setActionLoading(true);
            await AxiosSetup.post('/Admin/notifications/broadcast', {
                title: fixedTitle,
                message: form.message.trim(),
                type: fixedType,
            });
            showToast('Gửi thông báo thành công.');
            closeModal();
            await fetchTemplates();
        } catch (err) {
            console.error(err);
            showToast('Gửi thông báo thất bại.', 'error');
            setError('Không thể gửi thông báo.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="admin-notification">
            <header className="admin-notification__header">
                <div>
                    <span className="admin-notification__eyebrow">Quản lý hệ thống</span>
                    <h2>Trung tâm thông báo</h2>
                    <p>Quản lý broadcast, cảnh báo và thông báo hệ thống cho toàn bộ người dùng.</p>
                </div>
                <button type="button" className="admin-notification__create-btn" onClick={openCreateModal}>
                    <FiPlus />
                    Tạo thông báo mới
                </button>
            </header>

            <section className="admin-notification__layout">
                <div className="admin-notification__panel">
                    <div className="admin-notification__panel-head">
                        <div>
                            <span className="admin-notification__section-label">Danh sách gần đây</span>
                            <h3>Thông báo gần đây</h3>
                        </div>
                        <div className="admin-notification__search">
                            <FiSearch />
                            <input
                                type="text"
                                placeholder="Tìm theo tiêu đề hoặc nội dung..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {error ? <p className="admin-notification__error">{error}</p> : null}

                    <div className="admin-notification__table-wrap">
                        {loading ? (
                            <div className="admin-notification__loading">Đang tải dữ liệu...</div>
                        ) : (
                            <div className="admin-notification__list">
                                {filteredTemplates.length === 0 ? (
                                    <div className="admin-notification__empty">Chưa có thông báo nào.</div>
                                ) : (
                                    filteredTemplates.map((item) => (
                                        <article key={item.templateId || item.title} className="admin-notification__item">
                                            <div className="admin-notification__item-main">
                                                <div className="admin-notification__item-badge">
                                                    <FiBell />
                                                    <span>SMC</span>
                                                </div>
                                                <h4>{item.title}</h4>
                                                <p>{item.message}</p>
                                            </div>
                                            <div className="admin-notification__item-meta">
                                                <div>
                                                    <span className="admin-notification__meta-label">Lượt dùng</span>
                                                    <strong>{item.usedCount ?? 0}</strong>
                                                </div>
                                                <div>
                                                    <span className="admin-notification__meta-label">Dùng gần nhất</span>
                                                    <strong>{formatDate(item.lastUsedAt)}</strong>
                                                </div>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="admin-notification__footer">
                        <span>
                            Hiển thị {filteredTemplates.length} / {total} thông báo
                        </span>
                        <div className="admin-notification__pagination">
                            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                                <FiChevronLeft />
                            </button>
                            <span>
                                Trang {page} / {totalPages}
                            </span>
                            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {modalOpen ? (
                <div className="admin-notification__modal-backdrop" role="presentation" onClick={closeModal}>
                    <div className="admin-notification__modal" role="dialog" aria-modal="true" aria-labelledby="notification-modal-title" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-notification__modal-head">
                            <div>
                                <span className="admin-notification__section-label">Soạn thông báo</span>
                                <h3 id="notification-modal-title">Tạo mới thông báo</h3>
                                <p>Tiêu đề sẽ luôn cố định là “SMC xin thông báo”. Loại thông báo luôn là “Other”.</p>
                            </div>
                            <button type="button" className="admin-notification__icon-btn" onClick={closeModal} aria-label="Đóng">
                                <FiX />
                            </button>
                        </div>

                        <form className="admin-notification__form" onSubmit={handleSubmit}>
                            <label>
                                Tiêu đề
                                <input type="text" value={fixedTitle} disabled />
                            </label>

                            <label className="admin-notification__form-full">
                                Nội dung thông báo
                                <textarea
                                    rows={6}
                                    value={form.message}
                                    onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
                                    placeholder="Nhập nội dung thông báo..."
                                    required
                                />
                            </label>

                            <input type="hidden" value={fixedType} readOnly />

                            <div className="admin-notification__modal-actions">
                                <button type="button" className="admin-notification__btn admin-notification__btn--ghost" onClick={closeModal}>
                                    Hủy
                                </button>
                                <button type="submit" className="admin-notification__btn admin-notification__btn--primary" disabled={actionLoading}>
                                    {actionLoading ? 'Đang gửi...' : 'Gửi thông báo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {toast.open ? <div className={`admin-notification__toast admin-notification__toast--${toast.type}`}>{toast.message}</div> : null}
        </div>
    );
};

export default AdminNotificationManage;
