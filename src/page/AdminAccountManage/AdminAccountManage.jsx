import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiMoreHorizontal, FiBarChart2, FiPower } from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './AdminAccountManage.css';

const roleLabels = {
    Driver: 'Tài xế',
    Student: 'Sinh viên',
    Staff: 'Nhân viên',
    Admin: 'Quản trị viên',
};

const statusMeta = {
    true: {
        label: 'Đang hoạt động',
        className: 'admin-account__status--active',
    },
    false: {
        label: 'Đã khóa',
        className: 'admin-account__status--locked',
    },
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

const AdminAccountManage = () => {
    const [accounts, setAccounts] = useState([]);
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [systemUsers, setSystemUsers] = useState([]);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [confirmState, setConfirmState] = useState({ open: false, studentId: null, fullName: '', nextState: null });
    const [toast, setToast] = useState({ open: false, type: 'success', message: '' });

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await AxiosSetup.get('/Admin/accounts/students', {
                    params: { page, size },
                });

                const data = response.data;
                setAccounts(data.items || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            } catch (err) {
                console.error(err);
                setError('Không thể tải danh sách tài khoản.');
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, [page, size]);

    useEffect(() => {
        const fetchSystemUsers = async () => {
            try {
                const response = await AxiosSetup.get('/Admin/accounts/system-users', {
                    params: { page: 1, size: 20 },
                });

                const data = response.data;
                setSystemUsers(data.items || []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchSystemUsers();
    }, []);

    const filteredAccounts = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return accounts;

        return accounts.filter((account) =>
            [account.fullName, account.email, account.phoneNumber, account.studentCode, account.university, account.role]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(keyword))
        );
    }, [accounts, search]);

    const openConfirm = (studentId, currentIsActive, fullName) => {
        setConfirmState({
            open: true,
            studentId,
            fullName,
            nextState: !currentIsActive,
        });
    };

    const closeConfirm = () => {
        if (actionLoadingId) return;
        setConfirmState({ open: false, studentId: null, fullName: '', nextState: null });
    };

    const showToast = (message, type = 'success') => {
        setToast({ open: true, message, type });
        setTimeout(() => setToast({ open: false, message: '', type: 'success' }), 3000);
    };

    const confirmToggleStudentActive = async () => {
        const { studentId, nextState } = confirmState;
        if (!studentId || nextState === null) return;

        try {
            setActionLoadingId(studentId);
            await AxiosSetup.put(`/Admin/accounts/students/${studentId}/active`, null, {
                params: { isActive: nextState },
            });

            setAccounts((currentAccounts) =>
                currentAccounts.map((account) =>
                    account.id === studentId ? { ...account, isActive: nextState } : account
                )
            );
            closeConfirm();
            showToast(
                `${confirmState.fullName} đã được ${nextState ? 'kích hoạt' : 'khóa'} thành công.`,
                'success'
            );
        } catch (err) {
            console.error(err);
            setError('Không thể thay đổi trạng thái tài khoản.');
            showToast('Thay đổi trạng thái tài khoản thất bại.', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="admin-account">
            <header className="admin-account__header">
                <div>
                    <h2>Quản lý tài khoản</h2>
                    <p>Quản lý tài khoản người dùng, tài xế và sinh viên trong hệ thống.</p>
                </div>
            </header>


            <section className="admin-account__grid">
                <article className="admin-account__panel admin-account__panel--chart">
                    <div className="admin-account__panel-head">
                        <div>
                            <h3>Phân bố hệ sinh thái</h3>
                            <p>Vai trò đang hoạt động</p>
                        </div>
                        <button type="button" className="admin-account__icon-btn" aria-label="Thống kê">
                            <FiBarChart2 />
                        </button>
                    </div>

                    <div className="admin-account__role-list">
                        <div>
                            <div className="admin-account__role-head">
                                <span>Drivers</span>
                                <span>1</span>
                            </div>
                            <div className="admin-account__progress">
                                <div className="admin-account__progress-fill admin-account__progress-fill--primary" style={{ width: '75%' }} />
                            </div>
                        </div>
                        <div>
                            <div className="admin-account__role-head">
                                <span>Students</span>
                                <span>2</span>
                            </div>
                            <div className="admin-account__progress">
                                <div className="admin-account__progress-fill admin-account__progress-fill--secondary" style={{ width: '85%' }} />
                            </div>
                        </div>
                        <div>
                            <div className="admin-account__role-head">
                                <span>Staff Admins</span>
                                <span>0</span>
                            </div>
                            <div className="admin-account__progress">
                                <div className="admin-account__progress-fill admin-account__progress-fill--tertiary" style={{ width: '15%' }} />
                            </div>
                        </div>
                    </div>
                </article>

                <article className="admin-account__panel admin-account__panel--featured">
                    <div className="admin-account__panel-head">
                        <div>
                            <h3>Tài khoản nhân sự quan trọng</h3>
                            <p>Level 4+ Clearance</p>
                        </div>
                        <button type="button" className="admin-account__icon-btn" aria-label="Tùy chọn">
                            <FiMoreHorizontal />
                        </button>
                    </div>

                    <div className="admin-account__staff-list">
                        {systemUsers.map((user) => (
                            <div key={user.id} className="admin-account__staff-item">
                                <div>
                                    <p>{user.fullName}</p>
                                    <span>{user.email}</span>
                                </div>
                                <span className={`admin-account__badge ${user.role === 'Admin' ? 'admin-account__badge--admin' : 'admin-account__badge--staff'}`}>
                                    {user.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}
                                </span>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="admin-account__panel admin-account__panel--table">
                <div className="admin-account__table-head">
                    <h3>Hoạt động tài khoản gần đây</h3>
                    <div className="admin-account__search">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, mã sinh viên..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {error ? <p className="admin-account__error">{error}</p> : null}

                <div className="admin-account__table-wrap">
                    {loading ? (
                        <div className="admin-account__loading">Đang tải dữ liệu...</div>
                    ) : (
                        <table className="admin-account__table">
                            <thead>
                                <tr>
                                    <th>Họ và tên</th>
                                    <th>Email</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th className="admin-account__text-right">Cập nhật</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.map((account) => {
                                    const meta = statusMeta[`${account.isActive}`];

                                    return (
                                        <tr key={account.id}>
                                            <td>
                                                <div className="admin-account__user-cell">
                                                    <div className="admin-account__avatar">
                                                        {account.fullName?.slice(0, 2)?.toUpperCase() || 'NA'}
                                                    </div>
                                                    <div>
                                                        <strong>{account.fullName}</strong>
                                                        <span>{account.studentCode} • {account.university}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{account.email}</td>
                                            <td>{roleLabels[account.role] || account.role || '-'}</td>
                                            <td>
                                                <span className={`admin-account__status ${meta.className}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="admin-account__text-right">
                                                <div className="admin-account__row-actions">
                                                    <span>{formatDate(account.createdAt)}</span>
                                                    <button
                                                        type="button"
                                                        className="admin-account__action-btn"
                                                        onClick={() => openConfirm(account.id, account.isActive, account.fullName)}
                                                        disabled={actionLoadingId === account.id}
                                                        aria-label={account.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                                                    >
                                                        <FiPower />
                                                        {actionLoadingId === account.id
                                                            ? 'Đang xử lý...'
                                                            : account.isActive
                                                                ? 'Khóa'
                                                                : 'Kích hoạt'}
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

                <div className="admin-account__footer">
                    <p>Tổng cộng: {total} tài khoản</p>
                    <div className="admin-account__pagination">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                        >
                            Trước
                        </button>
                        <span>
                            Trang {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </section>

            {confirmState.open ? (
                <div className="admin-account__modal-backdrop" role="presentation" onClick={closeConfirm}>
                    <div
                        className="admin-account__modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-account-confirm-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="admin-account__modal-icon">
                            <FiPower />
                        </div>
                        <h3 id="admin-account-confirm-title">
                            {confirmState.nextState ? 'Kích hoạt tài khoản' : 'Khóa tài khoản'}
                        </h3>
                        <p>
                            Bạn có chắc muốn {confirmState.nextState ? 'kích hoạt' : 'khóa'} tài khoản{' '}
                            <strong>{confirmState.fullName}</strong> không?
                        </p>
                        <div className="admin-account__modal-actions">
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--ghost" onClick={closeConfirm}>
                                Hủy
                            </button>
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--primary" onClick={confirmToggleStudentActive}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {toast.open ? (
                <div className={`admin-account__toast admin-account__toast--${toast.type}`}>
                    <span>{toast.message}</span>
                </div>
            ) : null}
        </div>
    );
};

export default AdminAccountManage;
