import { useEffect, useMemo, useState } from 'react';
import {
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiFilter,
    FiMapPin,
    FiSearch,
    FiShield,
    FiUser,
    FiPhone,
    FiMail,
    FiBookOpen,
    FiX,
} from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import passengerAvatar from '../../assets/avtkh.png';
import driverAvatar from '../../assets/taixee.png';
import vehicleImage from '../../assets/wave.png';
import './StaffBookingManage.css';

const STATUS_OPTIONS = ['Tất cả', 'Pending', 'Confirmed', 'CheckedIn', 'Completed', 'Cancelled', 'Refunded', 'NoShow'];
const STATUS_LABELS = {
    Pending: 'Đang chờ',
    Confirmed: 'Đã xác nhận',
    CheckedIn: 'Đã check-in',
    Completed: 'Hoàn thành',
    Cancelled: 'Đã hủy',
    Refunded: 'Đã hoàn tiền',
    NoShow: 'Không đến',
};
const TRIP_TYPE_LABELS = {
    Fixed: 'Cố định',
    Flexible: 'Linh hoạt',
};

const formatMoney = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value || 0)) + ' ₫';
const formatPoint = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(value || 0));
const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
const getStatusClass = (status) => `booking-status--${String(status || '').toLowerCase()}`;
const getStatusLabel = (status) => STATUS_LABELS[status] || status || '-';
const getTripTypeLabel = (value) => TRIP_TYPE_LABELS[value] || value || '-';
const stripLocation = (value) => String(value || '-').split('|@lat:')[0].trim();
const getPaginationPages = (currentPage, totalPages) => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const pages = new Set([1, totalPages, currentPage]);
    if (currentPage - 1 > 1) pages.add(currentPage - 1);
    if (currentPage - 2 > 1) pages.add(currentPage - 2);
    if (currentPage + 1 < totalPages) pages.add(currentPage + 1);
    if (currentPage + 2 < totalPages) pages.add(currentPage + 2);

    return Array.from(pages).sort((a, b) => a - b);
};
const renderPagination = (currentPage, totalPages) => {
    const pages = getPaginationPages(currentPage, totalPages);
    const items = [];

    pages.forEach((page, index) => {
        const previous = pages[index - 1];
        if (previous && page - previous > 1) items.push('...');
        items.push(page);
    });

    return items;
};

const StaffBookingManage = () => {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Tất cả');
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [summary, setSummary] = useState({ items: [], total: 0, totalFinalPriceVnd: 0, totalPlatformRevenueVnd: 0 });
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState('');
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const fetchBookings = async (params = {}) => {
        try {
            setLoadingList(true);
            setListError('');
            const response = await AxiosSetup.get('/Admin/bookings', { params });
            const data = response.data || {};
            setSummary({
                items: Array.isArray(data.items) ? data.items : [],
                total: data.total || 0,
                totalFinalPriceVnd: data.totalFinalPriceVnd || 0,
                totalPlatformRevenueVnd: data.totalPlatformRevenueVnd || 0,
            });
        } catch (error) {
            console.error(error);
            setListError('Không thể tải danh sách booking.');
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setSelectedBookingId(null);
            setDetail(null);
            void fetchBookings({
                keyword: search || undefined,
                bookingStatus: status === 'Tất cả' ? undefined : status,
                page: currentPage,
                size: pageSize,
            });
        }, 0);

        return () => clearTimeout(timer);
    }, [search, status, currentPage]);

    useEffect(() => {
        if (!selectedBookingId) {
            const timer = setTimeout(() => setDetail(null), 0);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(() => {
            void (async () => {
                try {
                    setDetailLoading(true);
                    setDetailError('');
                    const response = await AxiosSetup.get(`/Admin/bookings/${selectedBookingId}`);
                    setDetail(response.data || null);
                } catch (error) {
                    console.error(error);
                    setDetailError('Không thể tải chi tiết booking.');
                } finally {
                    setDetailLoading(false);
                }
            })();
        }, 0);

        return () => clearTimeout(timer);
    }, [selectedBookingId]);

    const filteredBookings = useMemo(() => summary.items, [summary.items]);
    const totalPages = Math.max(1, Math.ceil((summary.total || filteredBookings.length) / pageSize));
    const activeBooking = detail;

    return (
        <div className="admin-booking-page">
            <main className="admin-booking-page__content">
                <header className="admin-booking-page__topbar">
                    <div>
                        <h1>Quản lý cuốc xe</h1>
                    </div>
                </header>

                <section className={`admin-booking-page__main-grid${selectedBookingId ? ' admin-booking-page__main-grid--split' : ' admin-booking-page__main-grid--full'}`}>
                    <div className="admin-booking-page__left-panel admin-booking-page__left-panel--sticky">
                        <div className="admin-booking-page__toolbar">
                            <div className="admin-booking-page__search">
                                <FiSearch />
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm booking, tên, biển số..." />
                            </div>

                            <select className="admin-booking-page__select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>

                            <button type="button" className="admin-booking-page__date-range">
                                <FiCalendar />
                                01/05/2025 - 31/05/2025
                            </button>

                            <button type="button" className="admin-booking-page__filter-btn">
                                <FiFilter />
                                Lọc
                            </button>
                        </div>

                        <div className="admin-booking-page__summary-grid">
                            <article className="admin-booking-page__summary-card"><span>Tổng cuốc xe</span><strong>{summary.total}</strong></article>
                            <article className="admin-booking-page__summary-card"><span>Tổng giá trị</span><strong>{formatMoney(summary.totalFinalPriceVnd)}</strong></article>
                            <article className="admin-booking-page__summary-card"><span>Doanh thu nền tảng</span><strong>{formatMoney(summary.totalPlatformRevenueVnd)}</strong></article>
                        </div>

                        <div className="admin-booking-page__table-card">
                            {loadingList ? (
                                <div className="admin-booking-page__state">Đang tải danh sách booking...</div>
                            ) : listError ? (
                                <div className="admin-booking-page__state admin-booking-page__state--error">{listError}</div>
                            ) : (
                                <>
                                    <table className="admin-booking-page__table">
                                        <thead>
                                            <tr>
                                                <th>Mã BK</th><th>Chuyến</th><th>Hành khách</th><th>Tài xế</th><th>Xe</th><th>Giá</th><th>Hoa hồng</th><th>Trạng thái</th><th>Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBookings.length === 0 ? (
                                                <tr><td colSpan="9" className="admin-booking-page__empty-row">Không có booking phù hợp.</td></tr>
                                            ) : (
                                                filteredBookings.map((booking) => (
                                                    <tr
                                                        key={booking.bookingId}
                                                        className={`${selectedBookingId === booking.bookingId ? 'admin-booking-page__row--active' : ''} admin-booking-page__row`}
                                                        onClick={() => {
                                                            setSelectedBookingId(booking.bookingId);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                    >
                                                        <td><strong>#{booking.bookingId}</strong></td>
                                                        <td>{getTripTypeLabel(booking.tripType)}</td>
                                                        <td>{booking.passengerFullName}</td>
                                                        <td>{booking.driverFullName}</td>
                                                        <td>{booking.vehicleLicensePlate}</td>
                                                        <td>{formatMoney(booking.finalPriceVnd)}</td>
                                                        <td>{formatMoney(booking.platformRevenueVnd)}</td>
                                                        <td><span className={`booking-status ${getStatusClass(booking.bookingStatus)}`}>{getStatusLabel(booking.bookingStatus)}</span></td>
                                                        <td>{formatDateTime(booking.plannedStartDateTime)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="admin-booking-page__table-footer">
                                        <div className="admin-booking-page__pager">
                                            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                                                <FiChevronLeft />
                                            </button>
                                            {renderPagination(currentPage, totalPages).map((item, index) => (
                                                item === '...'
                                                    ? (
                                                        <span key={`ellipsis-${index}`} className="admin-booking-page__pager-ellipsis">...</span>
                                                    )
                                                    : (
                                                        <button
                                                            type="button"
                                                            key={item}
                                                            onClick={() => setCurrentPage(item)}
                                                            className={item === currentPage ? 'admin-booking-page__pager-active' : ''}
                                                        >
                                                            {item}
                                                        </button>
                                                    )
                                            ))}
                                            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                                                <FiChevronRight />
                                            </button>
                                        </div>
                                        <div className="admin-booking-page__page-size">
                                            <span>Hiển thị</span>
                                            <select value={pageSize} disabled>
                                                <option>10</option>
                                            </select>
                                            <span>/ trang</span>
                                            <strong>Tổng {summary.total || filteredBookings.length} booking</strong>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {selectedBookingId ? (
                        <aside className="admin-booking-page__detail-panel admin-booking-page__detail-panel--enter">
                            <div className="admin-booking-page__detail-panel-scroll">
                                {detailLoading ? (
                                    <div className="admin-booking-page__state">Đang tải chi tiết...</div>
                                ) : detailError ? (
                                    <div className="admin-booking-page__state admin-booking-page__state--error">{detailError}</div>
                                ) : activeBooking ? (
                                    <>
                                        <div className="admin-booking-page__detail-head">
                                            <div>
                                                <p>Quản lý cuốc xe</p>
                                                <h2>Cuốc xe số {activeBooking.bookingId}</h2>
                                            </div>
                                            <button type="button" className="admin-booking-page__close-btn" onClick={() => setSelectedBookingId(null)}>
                                                <FiX />
                                            </button>
                                        </div>

                                        <div className="admin-booking-page__status-line">
                                            <span className={`booking-status ${getStatusClass(activeBooking.bookingStatus)}`}>{getStatusLabel(activeBooking.bookingStatus)}</span>
                                            <div className="admin-booking-page__meta">
                                                <span>{formatDateTime(activeBooking.createdAt)}</span>
                                                <span>•</span>
                                                <span>{getTripTypeLabel(activeBooking.trip?.tripType || activeBooking.tripType)}</span>
                                            </div>
                                        </div>

                                        <div className="admin-booking-page__section-label">
                                            <FiShield />
                                            <span>Thông tin chi tiết</span>
                                        </div>

                                        <div className="admin-booking-page__card-grid">
                                            <section className="booking-card">
                                                <h3>Hành khách</h3>
                                                <div className="booking-card__person">
                                                    <img src={passengerAvatar} alt={activeBooking.passenger?.fullName || 'Passenger'} />
                                                    <div className="booking-card__person-info">
                                                        <strong>{activeBooking.passenger?.fullName || '-'}</strong>
                                                        <p><FiMail /> {activeBooking.passenger?.email || '-'}</p>
                                                        <p><FiPhone /> {activeBooking.passenger?.phoneNumber || '-'}</p>
                                                        <p><FiBookOpen /> MSSV: {activeBooking.passenger?.studentCode || '-'}</p>
                                                        <p><FiUser /> Trường: {activeBooking.passenger?.university || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="booking-card__footer">
                                                    <FiShield /><span>Điểm tin cậy</span><strong>{activeBooking.passenger?.trustScore ?? '-'}</strong>
                                                </div>
                                            </section>

                                            <section className="booking-card">
                                                <h3>Giá & doanh thu</h3>
                                                <div className="booking-card__money-list">
                                                    <div><span>Giá trước giảm</span><strong>{formatPoint(activeBooking.priceBeforeDiscountPoint)} point</strong></div>
                                                    <div><span>Giảm giá</span><strong className="booking-card__positive">-{formatPoint(activeBooking.discountPoint)} point</strong></div>
                                                    <div className="booking-card__highlight"><span>Thanh toán</span><strong>{formatPoint(activeBooking.finalPricePoint)} point</strong></div>
                                                    <div><span>Thành tiền</span><strong>{formatMoney(activeBooking.finalPriceVnd)}</strong></div>
                                                </div>
                                            </section>

                                            <section className="booking-card">
                                                <h3>Tài xế</h3>
                                                <div className="booking-card__person booking-card__person--compact">
                                                    <img src={driverAvatar} alt={activeBooking.driver?.fullName || 'Driver'} />
                                                    <div className="booking-card__person-info">
                                                        <strong>{activeBooking.driver?.fullName || '-'}</strong>
                                                        <p><FiMail /> {activeBooking.driver?.email || '-'}</p>
                                                        <p><FiPhone /> {activeBooking.driver?.phoneNumber || '-'}</p>
                                                        <p><FiBookOpen /> MSSV: {activeBooking.driver?.studentCode || '-'}</p>
                                                        <p><FiUser /> Trường: {activeBooking.driver?.university || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="booking-card__footer">
                                                    <FiShield /><span>Điểm tin cậy</span><strong>{activeBooking.driver?.trustScore ?? '-'}</strong>
                                                </div>
                                            </section>

                                            <section className="booking-card">
                                                <h3>Hành trình</h3>
                                                <div className="booking-card__timeline">
                                                    <div className="booking-card__timeline-item booking-card__timeline-item--green">
                                                        <FiMapPin />
                                                        <div>
                                                            <strong>Đón</strong>
                                                            <p>{stripLocation(activeBooking.trip?.pickupLocation || activeBooking.rideRequest?.pickupLocation)}</p>
                                                            <span>{formatDateTime(activeBooking.segmentStartTime || activeBooking.trip?.plannedStartDateTime)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="booking-card__timeline-item booking-card__timeline-item--red">
                                                        <FiMapPin />
                                                        <div>
                                                            <strong>Trả</strong>
                                                            <p>{stripLocation(activeBooking.trip?.dropoffLocation || activeBooking.rideRequest?.dropoffLocation)}</p>
                                                            <span>{formatDateTime(activeBooking.segmentEndTime || activeBooking.trip?.plannedEndDateTime)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="booking-card booking-card--vehicle">
                                                <h3>Phương tiện</h3>
                                                <div className="booking-card__vehicle">
                                                    <div className="booking-card__vehicle-image">
                                                        <img src={vehicleImage} alt={activeBooking.trip?.vehicle?.model || 'Vehicle'} />
                                                    </div>
                                                    <div className="booking-card__vehicle-info">
                                                        <strong>{activeBooking.trip?.vehicle?.model || '-'}</strong>
                                                        <p>{[activeBooking.trip?.vehicle?.brand, activeBooking.trip?.vehicle?.model].filter(Boolean).join(' ') || '-'}</p>
                                                        <span>Biển số: {activeBooking.trip?.vehicle?.licensePlate || activeBooking.vehicleLicensePlate || '-'}</span>
                                                        <span>Màu sắc: {activeBooking.trip?.vehicle?.color || '-'}</span>
                                                        <span>Loại xe: {activeBooking.trip?.vehicle?.vehicleType || '-'}</span>
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="booking-card">
                                                <h3>Settlement</h3>
                                                <div className="booking-card__money-list">
                                                    <div><span>Tài xế nhận</span><strong className="booking-card__positive">{formatMoney(activeBooking.settlement?.driverReceivableVnd || 0)}</strong></div>
                                                    <div><span>Phí nền tảng</span><strong>{formatMoney(activeBooking.settlement?.platformFeeVnd || activeBooking.platformRevenueVnd)}</strong></div>
                                                    <div><span>Hoàn tiền</span><strong>{formatPoint(activeBooking.settlement?.refundPoint || 0)} point</strong></div>
                                                    <div className="booking-card__highlight"><span>Tổng thu</span><strong>{formatMoney(activeBooking.finalPriceVnd)}</strong></div>
                                                </div>
                                            </section>
                                        </div>

                                        <section className="booking-card booking-card--wide">
                                            <h3>Lịch sử hành trình</h3>
                                            <div className="booking-card__history">
                                                <div className="booking-card__history-step">
                                                    <div className="booking-card__history-icon"><FiClock /></div>
                                                    <span>Tạo booking</span>
                                                    <p>{formatDateTime(activeBooking.createdAt)}</p>
                                                </div>
                                                <div className="booking-card__history-line" />
                                                <div className="booking-card__history-step">
                                                    <div className="booking-card__history-icon"><FiMapPin /></div>
                                                    <span>Check-in</span>
                                                    <p>{formatDateTime(activeBooking.checkedInAt || activeBooking.trip?.actualStartTime)}</p>
                                                </div>
                                                <div className="booking-card__history-line" />
                                                <div className="booking-card__history-step">
                                                    <div className="booking-card__history-icon"><FiCalendar /></div>
                                                    <span>Hoàn thành</span>
                                                    <p>{formatDateTime(activeBooking.completedAt || activeBooking.trip?.actualEndTime)}</p>
                                                </div>
                                            </div>
                                        </section>
                                    </>
                                ) : null}
                            </div>
                        </aside>
                    ) : null}
                </section>
            </main>
        </div>
    );
};

export default StaffBookingManage;
