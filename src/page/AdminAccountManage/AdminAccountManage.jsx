import { useEffect, useMemo, useState } from 'react';
import {
    FiSearch,
    FiMoreHorizontal,
    FiBarChart2,
    FiPower,
    FiSend,
    FiUser,
    FiX,
} from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './AdminAccountManage.css';

const roleLabels = {
    Driver: 'Tài xế',
    Student: 'Sinh viên',
    Staff: 'Nhân viên',
    Admin: 'Quản trị viên',
};

const fieldLabels = {
    studentId: 'Mã học viên',
    accountRole: 'Vai trò tài khoản',
    isDriver: 'Là tài xế',
    student: 'Thông tin sinh viên',
    driverProfile: 'Hồ sơ tài xế',
    vehicles: 'Phương tiện',
    fullName: 'Họ và tên',
    email: 'Email',
    phoneNumber: 'Số điện thoại',
    gender: 'Giới tính',
    avatar: 'Ảnh đại diện',
    dateOfBirth: 'Ngày sinh',
    studentCode: 'Mã sinh viên',
    university: 'Trường đại học',
    personality: 'Tính cách',
    citizenId: 'Số CCCD',
    citizenIdImage: 'Ảnh CCCD',
    studentCardImage: 'Ảnh thẻ sinh viên',
    studentEmailVerified: 'Đã xác thực email',
    trustScore: 'Điểm tin cậy',
    ratingAverage: 'Điểm đánh giá trung bình',
    totalRatingCount: 'Tổng lượt đánh giá',
    completedTripsParticipatedCount: 'Số chuyến đã tham gia',
    locationUpdatedAt: 'Cập nhật vị trí lúc',
    isOnline: 'Đang online',
    status: 'Trạng thái',
    isActive: 'Đang hoạt động',
    createdAt: 'Ngày tạo',
    updatedAt: 'Ngày cập nhật',
    driverProfileId: 'Mã hồ sơ tài xế',
    driverLicenseNumber: 'Số bằng lái',
    driverLicenseImage: 'Ảnh bằng lái',
    studentRequestedAt: 'Thời điểm yêu cầu',
    approvalStatus: 'Trạng thái duyệt',
    approvedAt: 'Thời điểm duyệt',
    approvedBySystemUserId: 'Người duyệt',
    rejectionReason: 'Lý do từ chối',
    consecutiveRejectCount: 'Số lần từ chối liên tiếp',
    isDriverModeEnabled: 'Bật chế độ tài xế',
    vehicleId: 'Mã phương tiện',
    vehicleRegistrationImage: 'Ảnh đăng ký xe',
    vehicleType: 'Loại xe',
    brand: 'Hãng xe',
    model: 'Mẫu xe',
    color: 'Màu xe',
    licensePlate: 'Biển số',
    rejectReason: 'Lý do từ chối',
    isInUse: 'Đang sử dụng',
    activeTripCount: 'Số chuyến đang hoạt động',
    totalTripCount: 'Tổng số chuyến',
    lastTripPlannedStartAt: 'Lịch chuyến gần nhất',
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

const AdminAccountManage = () => {
    const [accounts, setAccounts] = useState([]);
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [systemUsers, setSystemUsers] = useState([]);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [confirmState, setConfirmState] = useState({ open: false, studentId: null, fullName: '', nextState: null });
    const [notificationState, setNotificationState] = useState({ open: false, studentId: null, fullName: '' });
    const [notificationForm, setNotificationForm] = useState({ title: 'Thông báo xử phạt', message: '' });
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [detailState, setDetailState] = useState({ open: false, loading: false, account: null, error: '' });
    const [selectedImage, setSelectedImage] = useState(null);
    const [toast, setToast] = useState({ open: false, type: 'success', message: '' });

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await AxiosSetup.get('/Admin/accounts/students', {
                    params: {
                        page,
                        size,
                        role: roleFilter === 'all' ? undefined : roleFilter,
                    },
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
    }, [page, size, roleFilter]);

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

        return accounts.filter((account) => {
            const matchesKeyword = !keyword || [account.fullName, account.email, account.phoneNumber, account.studentCode, account.university, account.role]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(keyword));

            const normalizedRole = (account.accountRole || account.role || '').toLowerCase();
            const matchesRole =
                roleFilter === 'all' ||
                (roleFilter === 'driver' && normalizedRole.includes('driver')) ||
                (roleFilter === 'student' && normalizedRole.includes('student'));

            return matchesKeyword && matchesRole;
        });
    }, [accounts, search, roleFilter]);

    const roleStats = useMemo(
        () =>
            accounts.reduce(
                (stats, account) => {
                    const role = (account.role || '').toLowerCase();

                    if (role.includes('driver')) {
                        stats.drivers += 1;
                    }

                    if (role.includes('student')) {
                        stats.students += 1;
                    }

                    return stats;
                },
                { drivers: 0, students: 0 }
            ),
        [accounts]
    );

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

    const openNotification = (studentId, fullName) => {
        setNotificationState({ open: true, studentId, fullName });
        setNotificationForm({ title: 'Thông báo xử phạt', message: '' });
    };

    const closeNotification = () => {
        if (notificationLoading) return;
        setNotificationState({ open: false, studentId: null, fullName: '' });
        setNotificationForm({ title: '', message: '' });
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

    const sendNotificationToStudent = async () => {
        const { studentId } = notificationState;
        if (!studentId || !notificationForm.title.trim() || !notificationForm.message.trim()) {
            showToast('Vui lòng nhập tiêu đề và nội dung thông báo.', 'error');
            return;
        }

        try {
            setNotificationLoading(true);
            await AxiosSetup.post('/Admin/notifications/direct', {
                studentId,
                title: notificationForm.title.trim(),
                message: notificationForm.message.trim(),
            });

            setAccounts((currentAccounts) =>
                currentAccounts.map((account) =>
                    account.id === studentId ? { ...account, isBanNotificationSent: true } : account
                )
            );

            closeNotification();
            showToast(`Đã gửi thông báo tới ${notificationState.fullName}.`, 'success');
        } catch (err) {
            console.error(err);
            setError('Không thể gửi thông báo.');
            showToast('Gửi thông báo thất bại.', 'error');
        } finally {
            setNotificationLoading(false);
        }
    };

    const openAccountDetail = async (studentId) => {
        if (!studentId) return;

        setDetailState({ open: true, loading: true, account: null, error: '' });

        try {
            const response = await AxiosSetup.get(`/Admin/accounts/students/${studentId}`);
            setDetailState({ open: true, loading: false, account: response.data, error: '' });
        } catch (err) {
            console.error(err);
            setDetailState({ open: true, loading: false, account: null, error: 'Không thể tải thông tin chi tiết tài khoản.' });
        }
    };

    const closeAccountDetail = () => {
        setDetailState({ open: false, loading: false, account: null, error: '' });
        setSelectedImage(null);
    };

    const openImagePreview = (image) => {
        if (!image?.src) return;
        setSelectedImage(image);
    };

    const closeImagePreview = () => {
        setSelectedImage(null);
    };

    const formatKeyLabel = (key) => fieldLabels[key] || key;

    const renderDetailValue = (key, value) => {
        if (value === null || value === undefined || value === '') return '-';
        if (typeof value === 'boolean') return value ? 'Có' : 'Không';
        if (Array.isArray(value)) return value.length ? value.map((item) => JSON.stringify(item)).join(', ') : '-';
        if (key.toLowerCase().includes('at') || key.toLowerCase().includes('date')) {
            const formatted = new Date(value);
            if (!Number.isNaN(formatted.getTime())) {
                return new Intl.DateTimeFormat('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }).format(formatted);
            }
        }
        return String(value);
    };

    const account = detailState.account;
    const hiddenDetailFields = new Set([
        'citizenIdImage',
        'studentCardImage',
        'driverLicenseImage',
        'vehicleRegistrationImage',
        'driverPreference',
        'locationUpdatedAt',
        'isOnline',
        'isActive',
        'status',
        'ratingAverage',
        'totalRatingCount',
        'completedTripsParticipatedCount',
        'createdAt',
        'updatedAt',
        'lastTripPlannedStartAt',
        'consecutiveRejectCount',
    ]);
    const detailImages = [
        {
            label: 'Ảnh CCCD',
            src: account?.student?.citizenIdImage,
            alt: 'Ảnh CCCD',
        },
        {
            label: 'Ảnh bằng lái',
            src: account?.driverProfile?.driverLicenseImage,
            alt: 'Ảnh bằng lái',
        },
        {
            label: 'Ảnh đăng ký xe',
            src: account?.vehicles?.[0]?.vehicleRegistrationImage,
            alt: 'Ảnh đăng ký xe',
        },
        {
            label: 'Ảnh thẻ sinh viên',
            src: account?.student?.studentCardImage,
            alt: 'Ảnh thẻ sinh viên',
        },
    ].filter((image) => Boolean(image.src));
    const filterDetailEntries = (entries) => entries.filter(([key]) => !hiddenDetailFields.has(key));

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
                                <span>Tài xế</span>
                                <span>{roleStats.drivers}</span>
                            </div>
                            <div className="admin-account__progress">
                                <div
                                    className="admin-account__progress-fill admin-account__progress-fill--primary"
                                    style={{ width: `${Math.max(8, Math.min(100, roleStats.drivers * 12 || 8))}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="admin-account__role-head">
                                <span>Học sinh</span>
                                <span>{roleStats.students}</span>
                            </div>
                            <div className="admin-account__progress">
                                <div
                                    className="admin-account__progress-fill admin-account__progress-fill--secondary"
                                    style={{ width: `${Math.max(8, Math.min(100, roleStats.students * 12 || 8))}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </article>

                <article className="admin-account__panel admin-account__panel--featured">
                    <div className="admin-account__panel-head">
                        <div>
                            <h3>Tài khoản nhân sự quan trọng</h3>
                         
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
                    <div className="admin-account__filters">
                        <div className="admin-account__search">
                            <FiSearch />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, email, mã sinh viên..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="admin-account__role-filters" role="group" aria-label="Lọc theo vai trò">
                            <button
                                type="button"
                                className={`admin-account__role-filter ${roleFilter === 'all' ? 'is-active' : ''}`}
                                onClick={() => setRoleFilter('all')}
                            >
                                Tất cả
                            </button>
                            <button
                                type="button"
                                className={`admin-account__role-filter ${roleFilter === 'driver' ? 'is-active' : ''}`}
                                onClick={() => setRoleFilter('driver')}
                            >
                                Tài xế
                            </button>
                            <button
                                type="button"
                                className={`admin-account__role-filter ${roleFilter === 'student' ? 'is-active' : ''}`}
                                onClick={() => setRoleFilter('student')}
                            >
                                Sinh viên
                            </button>
                        </div>
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
                                                    <button
                                                        type="button"
                                                        className="admin-account__action-btn admin-account__action-btn--secondary"
                                                        onClick={() => openAccountDetail(account.id)}
                                                        disabled={actionLoadingId === account.id || notificationLoading}
                                                        aria-label={`Xem chi tiết ${account.fullName}`}
                                                    >
                                                        <FiUser />
                                                        Chi tiết
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`admin-account__action-btn admin-account__action-btn--secondary ${account.isBanNotificationSent ? 'admin-account__action-btn--sent' : ''}`}
                                                        onClick={() => openNotification(account.id, account.fullName)}
                                                        disabled={actionLoadingId === account.id || notificationLoading}
                                                        aria-label={account.isBanNotificationSent ? 'Đã gửi thông báo xử phạt' : 'Gửi thông báo xử phạt'}
                                                    >
                                                        <FiSend />
                                                        {account.isBanNotificationSent ? 'Đã gửi' : 'Thông báo'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-account__action-btn"
                                                        onClick={() => openConfirm(account.id, account.isActive, account.fullName)}
                                                        disabled={actionLoadingId === account.id || notificationLoading}
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

            {notificationState.open ? (
                <div className="admin-account__modal-backdrop" role="presentation" onClick={closeNotification}>
                    <div
                        className="admin-account__modal admin-account__modal--notification"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-account-notify-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="admin-account__modal-icon">
                            <FiSend />
                        </div>
                        <h3 id="admin-account-notify-title">Gửi thông báo</h3>
                        <p>
                            Gửi thông báo trực tiếp tới <strong>{notificationState.fullName}</strong>.
                        </p>
                        <div className="admin-account__form">
                            <input
                                type="text"
                                value={notificationForm.title}
                                readOnly
                            />
                            <textarea
                                rows="4"
                                placeholder="Nội dung thông báo"
                                value={notificationForm.message}
                                onChange={(e) => setNotificationForm((current) => ({ ...current, message: e.target.value }))}
                            />
                        </div>
                        <div className="admin-account__modal-actions">
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--ghost" onClick={closeNotification}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="admin-account__modal-btn admin-account__modal-btn--primary"
                                onClick={sendNotificationToStudent}
                                disabled={notificationLoading}
                            >
                                {notificationLoading ? 'Đang gửi...' : 'Gửi thông báo'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {detailState.open ? (
                <div className="admin-account__modal-backdrop" role="presentation" onClick={closeAccountDetail}>
                    <div
                        className="admin-account__modal admin-account__modal--detail"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-account-detail-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="admin-account__modal-detail-header">
                            <div className="admin-account__modal-icon">
                                <FiUser />
                            </div>
                            <button type="button" className="admin-account__modal-close" onClick={closeAccountDetail} aria-label="Đóng">
                                <FiX />
                            </button>
                        </div>

                        {detailState.loading ? (
                            <div className="admin-account__loading">Đang tải thông tin chi tiết...</div>
                        ) : detailState.error ? (
                            <p className="admin-account__error">{detailState.error}</p>
                        ) : account ? (
                            <div className="admin-account__detail-content">
                                <div className="admin-account__detail-summary">
                                    <div className="admin-account__detail-avatar">
                                        {account.student?.fullName?.slice(0, 2)?.toUpperCase() || account.fullName?.slice(0, 2)?.toUpperCase() || 'NA'}
                                    </div>
                                    <div>
                                        <h3 id="admin-account-detail-title">{account.student?.fullName || account.fullName || '-'}</h3>
                                        <p>{roleLabels[account.accountRole] || account.accountRole || '-'}</p>
                                        <span className={`admin-account__status ${account.student?.isActive ? 'admin-account__status--active' : 'admin-account__status--locked'}`}>
                                            {account.student?.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                                        </span>
                                    </div>
                                </div>

                                <div className="admin-account__detail-grid">
                                    <div className="admin-account__detail-card">
                                        <h4>Thông tin tài khoản</h4>
                                        <dl>
                                            <div><dt>{formatKeyLabel('studentId')}</dt><dd>{renderDetailValue('studentId', account.studentId)}</dd></div>
                                            <div><dt>{formatKeyLabel('accountRole')}</dt><dd>{renderDetailValue('accountRole', account.accountRole)}</dd></div>
                                            <div><dt>{formatKeyLabel('isDriver')}</dt><dd>{renderDetailValue('isDriver', account.isDriver)}</dd></div>
                                        </dl>
                                    </div>

                                    <div className="admin-account__detail-card">
                                        <h4>Thông tin sinh viên</h4>
                                        <dl>
                                            {filterDetailEntries(Object.entries(account.student || {})).map(([key, value]) => (
                                                <div key={key}><dt>{formatKeyLabel(key)}</dt><dd>{renderDetailValue(key, value)}</dd></div>
                                            ))}
                                        </dl>
                                    </div>

                                    <div className="admin-account__detail-card admin-account__detail-card--full">
                                        <h4>Hồ sơ tài xế</h4>
                                        <dl>
                                            {account.driverProfile ? filterDetailEntries(Object.entries(account.driverProfile)).map(([key, value]) => (
                                                <div key={key}><dt>{formatKeyLabel(key)}</dt><dd>{renderDetailValue(key, value)}</dd></div>
                                            )) : <div><dt>{formatKeyLabel('driverProfile')}</dt><dd>-</dd></div>}
                                        </dl>
                                    </div>

                                    <div className="admin-account__detail-card admin-account__detail-card--full">
                                        <h4>Phương tiện</h4>
                                        {account.vehicles?.length ? account.vehicles.map((vehicle) => (
                                            <div key={vehicle.vehicleId} className="admin-account__detail-vehicle">
                                                <strong>{vehicle.brand} {vehicle.model}</strong>
                                                <dl>
                                                    {filterDetailEntries(Object.entries(vehicle)).map(([key, value]) => (
                                                        <div key={key}><dt>{formatKeyLabel(key)}</dt><dd>{renderDetailValue(key, value)}</dd></div>
                                                    ))}
                                                </dl>
                                            </div>
                                        )) : <p className="admin-account__detail-empty">Không có phương tiện.</p>}
                                    </div>
                                    {detailImages.length ? (
                                        <div className="admin-account__detail-card admin-account__detail-card--full">
                                            <h4>Thư viện ảnh</h4>
                                            <div className="admin-account__detail-gallery">
                                                {detailImages.map((image) => (
                                                    <figure key={image.label} className="admin-account__detail-gallery-item">
                                                        <button
                                                            type="button"
                                                            className="admin-account__detail-image-btn"
                                                            onClick={() => openImagePreview(image)}
                                                            aria-label={`Phóng to ${image.label}`}
                                                        >
                                                            <img
                                                                className="admin-account__detail-image"
                                                                src={image.src}
                                                                alt={image.alt}
                                                                onError={(event) => {
                                                                    event.currentTarget.closest('.admin-account__detail-gallery-item')?.classList.add('is-error');
                                                                }}
                                                            />
                                                        </button>
                                                        <figcaption>{image.label}</figcaption>
                                                    </figure>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {selectedImage ? (
                <div className="admin-account__modal-backdrop admin-account__modal-backdrop--image" role="presentation" onClick={closeImagePreview}>
                    <div className="admin-account__image-preview" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="admin-account__modal-close admin-account__modal-close--image" onClick={closeImagePreview} aria-label="Đóng ảnh phóng to">
                            <FiX />
                        </button>
                        <img src={selectedImage.src} alt={selectedImage.alt} className="admin-account__image-preview-img" />
                        <p>{selectedImage.label}</p>
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
