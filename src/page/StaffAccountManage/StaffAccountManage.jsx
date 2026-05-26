import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiLock, FiChevronLeft, FiChevronRight, FiMoreVertical, FiSend, FiUser, FiX } from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './StaffAccountManage.css';

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
    driverPreference: 'Sở thích tài xế',
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
    isActive: Boolean(item.isActive),
    status: item.isActive ? 'Đang hoạt động' : 'Đã khóa',
    lastLogin: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '-',
    phoneNumber: item.phoneNumber || '-',
    studentCode: item.studentCode || '-',
    university: item.university || '-',
    isBanNotificationSent: Boolean(item.isBanNotificationSent),
});

const StaffAccountManage = () => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [detailState, setDetailState] = useState({ open: false, loading: false, account: null, error: '' });
    const [selectedImage, setSelectedImage] = useState(null);
    const [notificationTarget, setNotificationTarget] = useState(null);
    const [notificationForm, setNotificationForm] = useState({ title: 'Thông báo xử phạt', message: '' });
    const [notificationLoading, setNotificationLoading] = useState(false);
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
                params: { page, size, role: roleFilter === 'all' ? undefined : roleFilter },
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
    }, [page, size, roleFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchAccounts();
        }, 0);

        return () => clearTimeout(timer);
    }, [fetchAccounts]);

    const roleStats = useMemo(() => {
        const driverCount = accounts.filter((item) => String(item.role).toLowerCase() === 'driver').length;
        const studentCount = accounts.filter((item) => String(item.role).toLowerCase() === 'student').length;
        return [
            { label: 'Tài xế', count: driverCount, ratio: accounts.length ? Math.round((driverCount / accounts.length) * 100) : 0, colorClass: 'secondary' },
            { label: 'Sinh viên', count: studentCount, ratio: accounts.length ? Math.round((studentCount / accounts.length) * 100) : 0, colorClass: 'tertiary' },
        ];
    }, [accounts]);

    const filteredAccounts = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return accounts.filter((account) => {
            const matchesKeyword = !keyword || [account.name, account.email, account.role, account.status, account.studentCode, account.university, account.phoneNumber]
                .map((value) => String(value ?? '').toLowerCase())
                .some((value) => value.includes(keyword));
            const normalizedRole = String(account.role || '').toLowerCase();
            const matchesRole = roleFilter === 'all' || (roleFilter === 'driver' && normalizedRole.includes('driver')) || (roleFilter === 'student' && normalizedRole.includes('student'));
            return matchesKeyword && matchesRole;
        });
    }, [accounts, search, roleFilter]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 2500);
    };

    const openDetail = async (account) => {
        setDetailState({ open: true, loading: true, account: null, error: '' });
        try {
            const response = await AxiosSetup.get(`/Admin/accounts/students/${account.id}`);
            setDetailState({ open: true, loading: false, account: response.data, error: '' });
        } catch (e) {
            console.error(e);
            setDetailState({ open: true, loading: false, account: null, error: 'Không thể tải thông tin chi tiết tài khoản.' });
        }
    };

    const closeDetail = () => {
        setDetailState({ open: false, loading: false, account: null, error: '' });
        setSelectedImage(null);
    };

    const openImagePreview = (image) => {
        if (!image?.src) return;
        setSelectedImage(image);
    };

    const closeImagePreview = () => setSelectedImage(null);

    const handleLock = (account) => setSelectedAccount({ ...account, nextActive: false });
    const handleUnlock = (account) => setSelectedAccount({ ...account, nextActive: true });

    const confirmLock = async () => {
        if (!selectedAccount) return;
        try {
            await AxiosSetup.put(`/Admin/accounts/students/${selectedAccount.id}/active`, null, { params: { isActive: selectedAccount.nextActive } });
            showToast(selectedAccount.nextActive ? `Đã mở khóa tài khoản ${selectedAccount.name}` : `Đã khóa tài khoản ${selectedAccount.name}`);
            await fetchAccounts();
        } catch (e) {
            console.error(e);
            showToast(selectedAccount.nextActive ? 'Không thể mở khóa tài khoản.' : 'Không thể khóa tài khoản.');
        } finally {
            setSelectedAccount(null);
        }
    };

    const openNotification = (account) => {
        setNotificationTarget(account);
        setNotificationForm({ title: 'Thông báo xử phạt', message: '' });
    };

    const closeNotification = () => {
        if (notificationLoading) return;
        setNotificationTarget(null);
        setNotificationForm({ title: 'Thông báo xử phạt', message: '' });
    };

    const sendNotification = async () => {
        if (!notificationTarget) return;
        if (!notificationForm.message.trim()) {
            showToast('Vui lòng nhập nội dung thông báo.');
            return;
        }

        try {
            setNotificationLoading(true);
            await AxiosSetup.post('/Admin/notifications/direct', {
                studentId: notificationTarget.id,
                title: 'Thông báo xử phạt',
                message: notificationForm.message.trim(),
            });
            showToast(`Đã gửi thông báo tới ${notificationTarget.name}`);
            await fetchAccounts();
            closeNotification();
        } catch (e) {
            console.error(e);
            showToast('Không thể gửi thông báo.');
        } finally {
            setNotificationLoading(false);
        }
    };

    const formatKeyLabel = (key) => fieldLabels[key] || key;

    const renderDetailValue = (key, value) => {
        if (value === null || value === undefined || value === '') return '-';
        if (typeof value === 'boolean') return value ? 'Có' : 'Không';
        if (Array.isArray(value)) return value.length ? value.map((item) => JSON.stringify(item)).join(', ') : '-';
        if (key && (key.toLowerCase().includes('at') || key.toLowerCase().includes('date'))) {
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
        { label: 'Ảnh CCCD', src: account?.student?.citizenIdImage, alt: 'Ảnh CCCD' },
        { label: 'Ảnh bằng lái', src: account?.driverProfile?.driverLicenseImage, alt: 'Ảnh bằng lái' },
        { label: 'Ảnh đăng ký xe', src: account?.vehicles?.[0]?.vehicleRegistrationImage, alt: 'Ảnh đăng ký xe' },
        { label: 'Ảnh thẻ sinh viên', src: account?.student?.studentCardImage, alt: 'Ảnh thẻ sinh viên' },
    ].filter((image) => Boolean(image.src));
    const filterDetailEntries = (entries) => entries.filter(([key]) => !hiddenDetailFields.has(key));

    return (
        <div className="admin-account staff-account">
            <div className="admin-account__header staff-account__header">
                <div>
                    <h2>Quản lý tài khoản</h2>
                    <p>Quản lý tài khoản sinh viên, tài xế và quản trị viên trong giao diện gọn gàng, dễ theo dõi.</p>
                </div>
            </div>

            <div className="admin-account__grid">
                <section className="admin-account__panel staff-account__panel">
                    <div className="admin-account__panel-head">
                        <div>
                            <h3>Tổng quan vai trò</h3>
                            <p>Phân bố theo từng vai trò hệ thống</p>
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
                        {accounts.slice(0, 3).map((accountItem) => (
                            <div key={accountItem.id} className="admin-account__staff-item">
                                <div className="admin-account__user-cell">
                                    <div className="admin-account__avatar">{getInitials(accountItem.name)}</div>
                                    <div>
                                        <p>{accountItem.name}</p>
                                        <span>{accountItem.email}</span>
                                    </div>
                                </div>
                                <span className={`admin-account__badge ${accountItem.role === 'Admin' ? 'admin-account__badge--admin' : 'admin-account__badge--staff'}`}>
                                    {accountItem.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="admin-account__panel admin-account__panel--table staff-account__panel--table">
                    <div className="admin-account__table-head">
                        <div>
                            <h3>Bảng tài khoản</h3>
                            <p>Tìm kiếm và quản lý người dùng hệ thống</p>
                        </div>
                        <div className="admin-account__filters">
                            <div className="admin-account__search staff-account__search">
                                <FiSearch />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm tài khoản..." />
                            </div>
                            <div className="admin-account__role-filters">
                                <button type="button" className={`admin-account__role-filter ${roleFilter === 'all' ? 'is-active' : ''}`} onClick={() => { setRoleFilter('all'); setPage(1); }}>Tất cả</button>
                                <button type="button" className={`admin-account__role-filter ${roleFilter === 'driver' ? 'is-active' : ''}`} onClick={() => { setRoleFilter('driver'); setPage(1); }}>Tài xế</button>
                                <button type="button" className={`admin-account__role-filter ${roleFilter === 'student' ? 'is-active' : ''}`} onClick={() => { setRoleFilter('student'); setPage(1); }}>Sinh viên</button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-account__state">Đang tải tài khoản...</div>
                    ) : error ? (
                        <div className="admin-account__state admin-account__state--error">{error}</div>
                    ) : (
                        <>
                            <div className="admin-account__table-wrap">
                                <table className="admin-account__table">
                                    <thead>
                                        <tr>
                                            <th>Người dùng</th>
                                            <th>Vai trò</th>
                                            <th>Trạng thái</th>
                                            <th>Đăng nhập gần nhất</th>
                                            <th className="admin-account__text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAccounts.map((accountItem) => (
                                            <tr key={accountItem.id}>
                                                <td>
                                                    <div className="admin-account__user-cell">
                                                        <div className="admin-account__avatar">{getInitials(accountItem.name)}</div>
                                                        <div>
                                                            <strong>{accountItem.name}</strong>
                                                            <span>{accountItem.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{accountItem.role}</td>
                                                <td>
                                                    <span className={`admin-account__status ${accountItem.isActive ? 'admin-account__status--active' : 'admin-account__status--locked'}`}>
                                                        {accountItem.status}
                                                    </span>
                                                </td>
                                                <td>{accountItem.lastLogin}</td>
                                                <td className="admin-account__text-right">
                                                    <div className="admin-account__row-actions">
                                                        <button type="button" className="admin-account__action-btn staff-account__action-btn staff-account__action-btn--secondary" onClick={() => openDetail(accountItem)}>
                                                            <FiUser />
                                                            Chi tiết
                                                        </button>
                                                        <button type="button" className={`admin-account__action-btn staff-account__action-btn staff-account__action-btn--secondary ${accountItem.isBanNotificationSent ? 'staff-account__action-btn--sent' : ''}`} onClick={() => openNotification(accountItem)}>
                                                            <FiSend />
                                                            {accountItem.isBanNotificationSent ? 'Đã gửi' : 'Thông báo'}
                                                        </button>
                                                        {accountItem.isActive ? (
                                                            <button type="button" className="admin-account__action-btn staff-account__action-btn staff-account__action-btn--danger" onClick={() => handleLock(accountItem)}>
                                                                <FiLock />
                                                                Khóa
                                                            </button>
                                                        ) : (
                                                            <button type="button" className="admin-account__action-btn staff-account__action-btn staff-account__action-btn--success" onClick={() => handleUnlock(accountItem)}>
                                                                <FiLock />
                                                                Mở khóa
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
                                <span>Đang hiển thị {accounts.length} trên tổng {total} tài khoản</span>
                                <div className="admin-account__pagination">
                                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><FiChevronLeft /> Trước</button>
                                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Tiếp theo <FiChevronRight /></button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {detailState.open ? (
                <div className="admin-account__modal-backdrop" role="presentation" onClick={closeDetail}>
                    <div className="admin-account__modal admin-account__modal--detail" role="dialog" aria-modal="true" aria-labelledby="admin-account-detail-title" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-account__modal-detail-header">
                            <div className="admin-account__modal-icon"><FiUser /></div>
                            <button type="button" className="admin-account__modal-close" onClick={closeDetail} aria-label="Đóng"><FiX /></button>
                        </div>

                        {detailState.loading ? (
                            <div className="admin-account__loading">Đang tải thông tin chi tiết...</div>
                        ) : detailState.error ? (
                            <p className="admin-account__error">{detailState.error}</p>
                        ) : account ? (
                            <div className="admin-account__detail-content">
                                <div className="admin-account__detail-summary">
                                    <div className="admin-account__detail-avatar">{account.student?.fullName?.slice(0, 2)?.toUpperCase() || account.fullName?.slice(0, 2)?.toUpperCase() || 'NA'}</div>
                                    <div>
                                        <h3 id="admin-account-detail-title">{account.student?.fullName || account.fullName || '-'}</h3>
                                        <p>{roleLabels[account.accountRole] || account.accountRole || '-'}</p>
                                        <span className={`admin-account__status ${account.student?.isActive ? 'admin-account__status--active' : 'admin-account__status--locked'}`}>{account.student?.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span>
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
                                                        <button type="button" className="admin-account__detail-image-btn" onClick={() => openImagePreview(image)} aria-label={`Phóng to ${image.label}`}>
                                                            <img className="admin-account__detail-image" src={image.src} alt={image.alt} />
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
                        <button type="button" className="admin-account__modal-close admin-account__modal-close--image" onClick={closeImagePreview} aria-label="Đóng ảnh phóng to"><FiX /></button>
                        <img src={selectedImage.src} alt={selectedImage.alt} className="admin-account__image-preview-img" />
                        <p>{selectedImage.label}</p>
                    </div>
                </div>
            ) : null}

            {selectedAccount ? (
                <div className="admin-account__modal-backdrop" role="presentation" onClick={() => setSelectedAccount(null)}>
                    <div className="admin-account__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-account__modal-icon"><FiLock /></div>
                        <h3>Khóa tài khoản?</h3>
                        <p>Bạn có chắc chắn muốn khóa <strong>{selectedAccount.name}</strong> không? Hành động này có thể được xem xét lại sau.</p>
                        <div className="admin-account__modal-actions">
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--ghost" onClick={() => setSelectedAccount(null)}>Hủy</button>
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--primary" onClick={confirmLock}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {notificationTarget ? (
                <div className="admin-account__modal-backdrop" role="presentation" onClick={closeNotification}>
                    <div className="admin-account__modal admin-account__modal--notification" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-account__modal-icon"><FiSend /></div>
                        <h3>Gửi thông báo</h3>
                        <p>Gửi thông báo trực tiếp tới <strong>{notificationTarget.name}</strong>.</p>
                        <div className="admin-account__form">
                            <input type="text" value="Thông báo xử phạt" disabled />
                            <textarea rows="4" placeholder="Nhập nội dung thông báo..." value={notificationForm.message} onChange={(e) => setNotificationForm((current) => ({ ...current, message: e.target.value }))} />
                        </div>
                        <div className="admin-account__modal-actions">
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--ghost" onClick={closeNotification}>Hủy</button>
                            <button type="button" className="admin-account__modal-btn admin-account__modal-btn--primary" onClick={sendNotification} disabled={notificationLoading}>{notificationLoading ? 'Đang gửi...' : 'Gửi thông báo'}</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {toast ? <div className="admin-account__toast admin-account__toast--success">{toast}</div> : null}
        </div>
    );
};

export default StaffAccountManage;
