import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiEdit2, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AxiosSetup from '../../services/AxiosSetup';
import './AdminPointPolicy.css';

const NAME_ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const emptyForm = {
    pointPerUnit: '',
    effectiveFrom: '',
    effectiveTo: '',
};

const AdminPointPolicy = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

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

    const fetchPolicies = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/PointPolicy');
            setPolicies(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách chính sách điểm.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadPolicies = async () => {
            await fetchPolicies();
        };

        void loadPolicies();
    }, [fetchPolicies]);

    const filteredPolicies = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return policies;
        return policies.filter((item) => [item.pointPolicyId, item.pointPerUnit, item.isActive, item.createdBySystemUserId].map((v) => String(v ?? '').toLowerCase()).some((v) => v.includes(keyword)));
    }, [policies, search]);

    const openCreate = () => {
        setEditingPolicy(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (policy) => {
        setEditingPolicy(policy);
        setForm({
            pointPerUnit: policy.pointPerUnit ?? '',
            effectiveFrom: policy.effectiveFrom ? new Date(policy.effectiveFrom).toISOString().slice(0, 16) : '',
            effectiveTo: policy.effectiveTo ? new Date(policy.effectiveTo).toISOString().slice(0, 16) : '',
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingPolicy(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                pointPerUnit: Number(form.pointPerUnit),
                effectiveFrom: new Date(form.effectiveFrom).toISOString(),
                effectiveTo: new Date(form.effectiveTo).toISOString(),
                createdBySystemUserId: systemUserId,
            };

            if (editingPolicy) {
                await AxiosSetup.put(`/PointPolicy/${editingPolicy.pointPolicyId}`, payload);
                toast.success('Cập nhật chính sách điểm thành công.', { position: 'bottom-right', autoClose: 3000, theme: 'colored' });
            } else {
                await AxiosSetup.post('/PointPolicy', payload);
                toast.success('Tạo chính sách điểm thành công.', { position: 'bottom-right', autoClose: 3000, theme: 'colored' });
            }

            await fetchPolicies();
            closeModal();
        } catch (e) {
            console.error(e);
            toast.error(editingPolicy ? 'Không thể cập nhật chính sách điểm.' : 'Không thể tạo chính sách điểm.', {
                position: 'bottom-right',
                autoClose: 3000,
                theme: 'colored',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (policyId) => {
        const ok = window.confirm('Bạn có chắc muốn xoá chính sách điểm này không?');
        if (!ok) return;

        try {
            setDeletingId(policyId);
            await AxiosSetup.delete(`/PointPolicy/${policyId}`);
            toast.success('Xoá chính sách điểm thành công.', { position: 'bottom-right', autoClose: 3000, theme: 'colored' });
            await fetchPolicies();
        } catch (e) {
            console.error(e);
            toast.error('Không thể xoá chính sách điểm.', { position: 'bottom-right', autoClose: 3000, theme: 'colored' });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="admin-point-policy">
            <div className="admin-point-policy__header">
                <div>
                    <p className="admin-point-policy__eyebrow">Khu vực quản trị</p>
                    <h2>Quản lý chính sách điểm</h2>
                    <p>Quản lý cấu hình quy đổi điểm theo từng giai đoạn hiệu lực.</p>
                </div>

                <div className="admin-point-policy__actions">
                    <div className="admin-point-policy__search">
                        <FiSearch />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm chính sách..." />
                    </div>
                    <button type="button" className="admin-point-policy__secondary-btn" onClick={fetchPolicies}>
                        <FiRefreshCw />
                        Làm mới
                    </button>
                    <button type="button" className="admin-point-policy__primary-btn" onClick={openCreate}>
                        <FiPlus />
                        Tạo chính sách
                    </button>
                </div>
            </div>

            <div className="admin-point-policy__table-card">
                {loading ? (
                    <div className="admin-point-policy__state">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="admin-point-policy__state admin-point-policy__state--error">{error}</div>
                ) : (
                    <div className="admin-point-policy__table-wrap">
                        <table className="admin-point-policy__table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Điểm / đơn vị</th>
                                    <th>Hiệu lực từ</th>
                                    <th>Hiệu lực đến</th>
                                    <th>Trạng thái</th>
                                    <th>Người tạo</th>
                                    <th>Ngày tạo</th>
                                    <th className="admin-point-policy__actions-head">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPolicies.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="admin-point-policy__empty-row">Không có dữ liệu phù hợp.</td>
                                    </tr>
                                ) : (
                                    filteredPolicies.map((policy) => (
                                        <tr key={policy.pointPolicyId}>
                                            <td><strong>#{policy.pointPolicyId}</strong></td>
                                            <td>{policy.pointPerUnit}</td>
                                            <td>{formatDateTime(policy.effectiveFrom)}</td>
                                            <td>{formatDateTime(policy.effectiveTo)}</td>
                                            <td>
                                                <span className={`admin-point-policy__status ${policy.isActive ? 'admin-point-policy__status--active' : 'admin-point-policy__status--inactive'}`}>
                                                    {policy.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                                </span>
                                            </td>
                                            <td>{policy.createdBySystemUserId || '-'}</td>
                                            <td>{formatDateTime(policy.createdAt)}</td>
                                            <td>
                                                <div className="admin-point-policy__row-actions">
                                                    <button type="button" className="admin-point-policy__icon-btn" onClick={() => openEdit(policy)}>
                                                        <FiEdit2 />
                                                        Sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-point-policy__icon-btn admin-point-policy__icon-btn--danger"
                                                        onClick={() => handleDelete(policy.pointPolicyId)}
                                                        disabled={deletingId === policy.pointPolicyId}
                                                    >
                                                        <FiTrash2 />
                                                        {deletingId === policy.pointPolicyId ? 'Đang xoá...' : 'Xoá'}
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

            {modalOpen ? (
                <div className="admin-point-policy__modal-backdrop" role="presentation" onClick={closeModal}>
                    <div className="admin-point-policy__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-point-policy__modal-head">
                            <div>
                                <p>{editingPolicy ? 'Chỉnh sửa chính sách' : 'Tạo chính sách mới'}</p>
                                <h3>{editingPolicy ? `#${editingPolicy.pointPolicyId}` : 'Chính sách mới'}</h3>
                            </div>
                            <button type="button" className="admin-point-policy__close" onClick={closeModal}>
                                <FiX />
                            </button>
                        </div>

                        <form className="admin-point-policy__form" onSubmit={handleSubmit}>
                            <label>
                                <span>Điểm / đơn vị</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.pointPerUnit}
                                    onChange={(e) => setForm((prev) => ({ ...prev, pointPerUnit: e.target.value }))}
                                    required
                                />
                            </label>
                            <label>
                                <span>Hiệu lực từ</span>
                                <input
                                    type="datetime-local"
                                    value={form.effectiveFrom}
                                    onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                                    required
                                />
                            </label>
                            <label>
                                <span>Hiệu lực đến</span>
                                <input
                                    type="datetime-local"
                                    value={form.effectiveTo}
                                    onChange={(e) => setForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
                                    required
                                />
                            </label>
                            <div className="admin-point-policy__modal-actions">
                                <button type="button" className="admin-point-policy__secondary-btn" onClick={closeModal}>
Hủy
                                </button>
                                <button type="submit" className="admin-point-policy__primary-btn" disabled={saving}>
                                    <FiCheckCircle />
                                    {saving ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            <ToastContainer />
        </div>
    );
};

export default AdminPointPolicy;
