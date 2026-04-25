import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiLock, FiChevronLeft, FiChevronRight, FiMoreVertical } from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './StaffAccountManage.css';

const getInitials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

const normalizeAccount = (item) => ({
    id: item.id,
    name: item.fullName || '-',
    email: item.email || '-',
    role: item.role || '-',
    status: item.isActive ? 'Active' : 'Locked',
    lastLogin: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '-',
    phoneNumber: item.phoneNumber || '-',
    studentCode: item.studentCode || '-',
    university: item.university || '-',
});

const StaffAccountManage = () => {
    const [search, setSearch] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [toast, setToast] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/Admin/accounts/students', {
                params: { page, size },
            });
            const items = response.data?.items || [];
            setAccounts(Array.isArray(items) ? items.map(normalizeAccount) : []);
            setTotal(response.data?.total || 0);
            setTotalPages(response.data?.totalPages || 1);
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách tài khoản.');
        } finally {
            setLoading(false);
        }
    }, [page, size]);

    useEffect(() => {
        void (async () => {
            await fetchAccounts();
        })();
    }, [fetchAccounts]);

    const roleStats = useMemo(() => {
        const driverCount = accounts.filter((item) => String(item.role).toLowerCase() === 'driver').length;
        const studentCount = accounts.filter((item) => String(item.role).toLowerCase() === 'student').length;
        return [
            { label: 'Driver', count: driverCount, ratio: accounts.length ? Math.round((driverCount / accounts.length) * 100) : 0, colorClass: 'secondary' },
            { label: 'Student', count: studentCount, ratio: accounts.length ? Math.round((studentCount / accounts.length) * 100) : 0, colorClass: 'tertiary' },
        ];
    }, [accounts]);

    const filteredAccounts = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return accounts;

        return accounts.filter((account) =>
            [account.name, account.email, account.role, account.status, account.studentCode, account.university, account.phoneNumber]
                .map((value) => String(value ?? '').toLowerCase())
                .some((value) => value.includes(keyword)),
        );
    }, [accounts, search]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 2500);
    };

    const handleLock = (account) => {
        setSelectedAccount({ ...account, nextActive: false });
    };

    const handleUnlock = (account) => {
        setSelectedAccount({ ...account, nextActive: true });
    };

    const confirmLock = async () => {
        if (!selectedAccount) return;

        try {
            await AxiosSetup.put(`/Admin/accounts/students/${selectedAccount.id}/active`, null, {
                params: { isActive: selectedAccount.nextActive },
            });
            showToast(selectedAccount.nextActive ? `Đã mở khóa tài khoản ${selectedAccount.name}` : `Đã khóa tài khoản ${selectedAccount.name}`);
            await fetchAccounts();
        } catch (e) {
            console.error(e);
            showToast(selectedAccount.nextActive ? 'Không thể mở khóa tài khoản.' : 'Không thể khóa tài khoản.');
        } finally {
            setSelectedAccount(null);
        }
    };

    return (
        <div className="admin-account staff-account">
            <div className="admin-account__header staff-account__header">
                <div>
                    <h2>Account Management</h2>
                    <p>Manage student, driver and admin accounts in a clean dashboard layout.</p>
                </div>
            </div>

            <div className="admin-account__grid">
                <section className="admin-account__panel staff-account__panel">
                    <div className="admin-account__panel-head">
                        <div>
                            <h3>Role Overview</h3>
                            <p>Distribution by system role</p>
                        </div>
                        <button type="button" className="admin-account__icon-btn"><FiMoreVertical /></button>
                    </div>

                    <div className="admin-account__role-list">
                        {roleStats.map((role) => (
                            <div key={role.label}>
                                <div className="admin-account__role-head">
                                    <span>{role.label}</span>
                                    <strong>{role.count}</strong>
                                </div>
                                <div className="admin-account__progress">
                                    <div className={`admin-account__progress-fill admin-account__progress-fill--${role.colorClass}`} style={{ width: `${role.ratio}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="admin-account__staff-list">
                        {accounts.slice(0, 3).map((account) => (
                            <div key={account.id} className="admin-account__staff-item">
                                <div className="admin-account__user-cell">
                                    <div className="admin-account__avatar">{getInitials(account.name)}</div>
                                    <div>
                                        <p>{account.name}</p>
                                        <span>{account.email}</span>
                                    </div>
                                </div>
                                <span className={`admin-account__badge ${account.role === 'Admin' ? 'admin-account__badge--admin' : 'admin-account__badge--staff'}`}>
                                    {account.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="admin-account__panel admin-account__panel--table staff-account__panel--table">
                    <div className="admin-account__table-head">
                        <div>
                            <h3>Account Table</h3>
                            <p>Search and manage system users</p>
                        </div>
                        <div className="admin-account__search staff-account__search">
                            <FiSearch />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." />
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-account__state">Loading accounts...</div>
                    ) : error ? (
                        <div className="admin-account__state admin-account__state--error">{error}</div>
                    ) : (
                        <>
                            <div className="admin-account__table-wrap">
                                <table className="admin-account__table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Last Login</th>
                                            <th className="admin-account__text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAccounts.map((account) => (
                                            <tr key={account.id}>
                                                <td>
                                                    <div className="admin-account__user-cell">
                                                        <div className="admin-account__avatar">{getInitials(account.name)}</div>
                                                        <div>
                                                            <strong>{account.name}</strong>
                                                            <span>{account.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{account.role}</td>
                                                <td>
                                                    <span className={`admin-account__status ${account.status === 'Active' ? 'admin-account__status--active' : 'admin-account__status--locked'}`}>
                                                        {account.status}
                                                    </span>
                                                </td>
                                                <td>{account.lastLogin}</td>
                                                <td className="admin-account__text-right">
                                                    <div className="admin-account__row-actions">
                                                        {account.status === 'Active' ? (
                                                            <button type="button" className="admin-account__action-btn staff-account__action-btn staff-account__action-btn--danger" onClick={() => handleLock(account)}>
                                                                <FiLock />
                                                                Lock
                                                            </button>
                                                        ) : (
                                                            <button type="button" className="admin-account__action-btn staff-account__action-btn staff-account__action-btn--success" onClick={() => handleUnlock(account)}>
                                                                <FiLock />
                                                                Unlock
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="admin-account__footer">
                                <span>Showing {accounts.length} of {total} accounts</span>
                                <div className="admin-account__pagination">
                                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><FiChevronLeft /> Prev</button>
                                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <FiChevronRight /></button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {selectedAccount ? (
                <div className="admin-account__modal-backdrop" role="presentation" onClick={() => setSelectedAccount(null)}>
                    <div className="admin-account__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-account__modal-icon"><FiLock /></div>
                        <h3>Lock account?</h3>
                        <p>
                            Are you sure you want to lock <strong>{selectedAccount.name}</strong>? This action can be reviewed later.
                        </p>
                        <div className="admin-account__modal-actions">
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--ghost" onClick={() => setSelectedAccount(null)}>
                                Cancel
                            </button>
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--primary" onClick={confirmLock}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {toast ? <div className="admin-account__toast admin-account__toast--success">{toast}</div> : null}
        </div>
    );
};

export default StaffAccountManage;
