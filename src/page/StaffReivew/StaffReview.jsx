import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiMessageSquare, FiRefreshCw, FiSearch, FiStar, FiTrendingUp, FiUsers } from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './StaffReview.css';

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

const formatRating = (value) => {
    if (value === null || value === undefined) return '-';
    return Number(value).toFixed(1).replace(/\.0$/, '');
};

const getInitials = (name) => {
    if (!name) return 'NA';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
};

const normalizeText = (value) => String(value || '').toLowerCase();

const StudentReview = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [viewMode, setViewMode] = useState('all');
    const [expandedStudentList, setExpandedStudentList] = useState(false);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AxiosSetup.get('/Staff/users/reviews');
            const data = Array.isArray(response.data) ? response.data : [];
            setReviews(data);
            setSelectedStudentId((current) => current ?? data[0]?.user?.studentId ?? null);
        } catch (err) {
            console.error(err);
            setError('Không thể tải dữ liệu review của student.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReviews();
        }, 0);

        return () => clearTimeout(timer);
    }, [fetchReviews]);

    const selectedUser = useMemo(
        () => reviews.find((item) => item.user?.studentId === selectedStudentId) || reviews[0] || null,
        [reviews, selectedStudentId]
    );

    const filteredUsers = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        const list = [...reviews].sort((a, b) => (b.user?.totalRatingCount ?? 0) - (a.user?.totalRatingCount ?? 0));

        if (!keyword) return list;

        return list.filter((item) => {
            const user = item.user || {};
            const textFields = [
                user.fullName,
                user.studentId,
                user.ratingAverage,
                user.totalRatingCount,
                item.receivedCount,
                item.sentCount,
            ];

            return textFields.some((value) => normalizeText(value).includes(keyword));
        });
    }, [reviews, search]);

    const visibleUsers = useMemo(() => {
        if (viewMode === 'with-received') {
            return filteredUsers.filter((item) => (item.receivedCount ?? 0) > 0);
        }

        if (viewMode === 'with-sent') {
            return filteredUsers.filter((item) => (item.sentCount ?? 0) > 0);
        }

        return filteredUsers;
    }, [filteredUsers, viewMode]);

    const studentPreviewLimit = 5;
    const displayedUsers = expandedStudentList ? visibleUsers : visibleUsers.slice(0, studentPreviewLimit);

    const stats = useMemo(() => {
        const totalUsers = reviews.length;
        const totalReceived = reviews.reduce((sum, item) => sum + (item.receivedCount ?? 0), 0);
        const totalSent = reviews.reduce((sum, item) => sum + (item.sentCount ?? 0), 0);
        const avgRating = totalUsers
            ? reviews.reduce((sum, item) => sum + Number(item.user?.ratingAverage ?? 0), 0) / totalUsers
            : 0;

        return {
            totalUsers,
            totalReceived,
            totalSent,
            avgRating,
        };
    }, [reviews]);

    const receivedReviews = selectedUser?.receivedReviews ?? [];
    const sentReviews = selectedUser?.sentReviews ?? [];

    return (
        <div className="student-review-page">
            <header className="staff-review-page__header">
                <div>
                    <h2>Quản lý review student</h2>
                    <p>Theo dõi danh sách review đã gửi, review đã nhận và điểm đánh giá của từng student.</p>
                </div>

                <button type="button" className="staff-review-page__refresh" onClick={fetchReviews} disabled={loading}>
                    <FiRefreshCw />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </header>

            {error ? <p className="staff-review-page__error">{error}</p> : null}

            <section className="staff-review-page__stats">
                <article className="staff-review-page__stat-card">
                    <span className="staff-review-page__stat-icon staff-review-page__stat-icon--users">
                        <FiUsers />
                    </span>
                    <div>
                        <p>Tổng student</p>
                        <strong>{stats.totalUsers}</strong>
                    </div>
                </article>

                <article className="staff-review-page__stat-card">
                    <span className="staff-review-page__stat-icon staff-review-page__stat-icon--rating">
                        <FiStar />
                    </span>
                    <div>
                        <p>Điểm trung bình</p>
                        <strong>{formatRating(stats.avgRating)}</strong>
                    </div>
                </article>

                <article className="staff-review-page__stat-card">
                    <span className="staff-review-page__stat-icon staff-review-page__stat-icon--received">
                        <FiMessageSquare />
                    </span>
                    <div>
                        <p>Review đã nhận</p>
                        <strong>{stats.totalReceived}</strong>
                    </div>
                </article>

                <article className="staff-review-page__stat-card">
                    <span className="staff-review-page__stat-icon staff-review-page__stat-icon--sent">
                        <FiTrendingUp />
                    </span>
                    <div>
                        <p>Review đã gửi</p>
                        <strong>{stats.totalSent}</strong>
                    </div>
                </article>
            </section>

            <section className="staff-review-page__layout">
                <aside className="staff-review-page__sidebar">
                    <div className="staff-review-page__panel-head">
                        <div>
                            <h3>Danh sách student</h3>
                            <p>Chọn một student để xem chi tiết review.</p>
                        </div>
                    </div>

                    <div className="staff-review-page__search">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, mã SV, điểm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="staff-review-page__filters">
                        <button
                            type="button"
                            className={viewMode === 'all' ? 'is-active' : ''}
                            onClick={() => setViewMode('all')}
                        >
                            Tất cả
                        </button>
                        <button
                            type="button"
                            className={viewMode === 'with-received' ? 'is-active' : ''}
                            onClick={() => setViewMode('with-received')}
                        >
                            Có review nhận
                        </button>
                        <button
                            type="button"
                            className={viewMode === 'with-sent' ? 'is-active' : ''}
                            onClick={() => setViewMode('with-sent')}
                        >
                            Có review gửi
                        </button>
                    </div>

                    <div className="staff-review-page__list">
                        {loading ? (
                            <div className="staff-review-page__loading">Đang tải dữ liệu...</div>
                        ) : visibleUsers.length === 0 ? (
                            <div className="staff-review-page__empty">Không tìm thấy student phù hợp.</div>
                        ) : (
                            <>
                                {displayedUsers.map((item) => {
                                    const user = item.user || {};
                                    const isActive = selectedStudentId === user.studentId;

                                    return (
                                        <button
                                            key={user.studentId}
                                            type="button"
                                            className={`staff-review-page__staff-item ${isActive ? 'is-active' : ''}`}
                                            onClick={() => setSelectedStudentId(user.studentId)}
                                        >
                                            <div className="staff-review-page__avatar">{getInitials(user.fullName)}</div>
                                            <div className="staff-review-page__staff-meta">
                                                <strong>{user.fullName}</strong>
                                                <span>ID: {user.studentId}</span>
                                                <span>
                                                    Điểm: {formatRating(user.ratingAverage)} · {item.receivedCount ?? 0} nhận · {item.sentCount ?? 0} gửi
                                                </span>
                                            </div>
                                            <div className="staff-review-page__staff-badge">
                                                <FiStar />
                                                {formatRating(user.ratingAverage)}
                                            </div>
                                        </button>
                                    );
                                })}

                                {visibleUsers.length > studentPreviewLimit ? (
                                    <button
                                        type="button"
                                        className="staff-review-page__staff-toggle"
                                        onClick={() => setExpandedStudentList((current) => !current)}
                                    >
                                        {expandedStudentList
                                            ? 'Thu gọn danh sách'
                                            : `Xem thêm ${visibleUsers.length - studentPreviewLimit} student`}
                                    </button>
                                ) : null}
                            </>
                        )}
                    </div>
                </aside>

                <main className="staff-review-page__content">
                    <article className="staff-review-page__panel staff-review-page__summary">
                        <div className="staff-review-page__panel-head">
                            <div>
                                <h3>Chi tiết review</h3>
                                <p>Review nhận và gửi của staff đang được chọn.</p>
                            </div>
                        </div>

                        {selectedUser ? (
                            <div className="staff-review-page__detail-card">
                                <div className="staff-review-page__detail-main">
                                    <div className="staff-review-page__avatar staff-review-page__avatar--large">
                                        {getInitials(selectedUser.user?.fullName)}
                                    </div>
                                    <div>
                                        <h4>{selectedUser.user?.fullName}</h4>
                                        <p>ID: {selectedUser.user?.studentId}</p>
                                        <p>Điểm đánh giá trung bình: {formatRating(selectedUser.user?.ratingAverage)}</p>
                                    </div>
                                </div>

                                <div className="staff-review-page__detail-stats">
                                    <div>
                                        <span>Nhận</span>
                                        <strong>{selectedUser.receivedCount ?? 0}</strong>
                                    </div>
                                    <div>
                                        <span>Gửi</span>
                                        <strong>{selectedUser.sentCount ?? 0}</strong>
                                    </div>
                                    <div>
                                        <span>Tổng rating</span>
                                        <strong>{selectedUser.user?.totalRatingCount ?? 0}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="staff-review-page__empty staff-review-page__empty--detail">Chưa có dữ liệu staff.</div>
                        )}
                    </article>

                    <section className="staff-review-page__reviews-grid">
                        <article className="staff-review-page__panel">
                            <div className="staff-review-page__panel-head">
                                <div>
                                    <h3>Review đã nhận</h3>
                                    <p>Từ khách hàng hoặc staff khác gửi tới.</p>
                                </div>
                            </div>

                            <div className="staff-review-page__review-list">
                                {receivedReviews.length === 0 ? (
                                    <div className="staff-review-page__empty">Chưa có review đã nhận.</div>
                                ) : (
                                    receivedReviews.map((review) => (
                                        <article key={review.reviewId} className="staff-review-page__review-card">
                                            <div className="staff-review-page__review-top">
                                                <div>
                                                    <strong>{review.fromFullName}</strong>
                                                    <span>Trip #{review.tripId} · {formatDate(review.createdAt)}</span>
                                                </div>
                                                <div className="staff-review-page__rating-pill">
                                                    <FiStar />
                                                    {review.rating}
                                                </div>
                                            </div>
                                            <p>{review.comment || 'Không có bình luận.'}</p>
                                        </article>
                                    ))
                                )}
                            </div>
                        </article>

                        <article className="staff-review-page__panel">
                            <div className="staff-review-page__panel-head">
                                <div>
                                    <h3>Review đã gửi</h3>
                                    <p>Danh sách review staff đã gửi cho người khác.</p>
                                </div>
                            </div>

                            <div className="staff-review-page__review-list">
                                {sentReviews.length === 0 ? (
                                    <div className="staff-review-page__empty">Chưa có review đã gửi.</div>
                                ) : (
                                    sentReviews.map((review) => (
                                        <article key={review.reviewId} className="staff-review-page__review-card staff-review-page__review-card--sent">
                                            <div className="staff-review-page__review-top">
                                                <div>
                                                    <strong>{review.toFullName}</strong>
                                                    <span>Trip #{review.tripId} · {formatDate(review.createdAt)}</span>
                                                </div>
                                                <div className="staff-review-page__rating-pill staff-review-page__rating-pill--sent">
                                                    <FiStar />
                                                    {review.rating}
                                                </div>
                                            </div>
                                            <p>{review.comment || 'Không có bình luận.'}</p>
                                        </article>
                                    ))
                                )}
                            </div>
                        </article>
                    </section>
                </main>
            </section>
        </div>
    );
};

export default StudentReview;
