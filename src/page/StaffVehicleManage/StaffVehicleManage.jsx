import { useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiFilter,
  FiInfo,
  FiSearch,
  FiUser,
  FiX,
} from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './StaffVehicleManage.css';

const STATUS_OPTIONS = ['Tất cả', 'Approved', 'Pending', 'Rejected'];
const USE_STATUS_OPTIONS = ['Tất cả', 'Đang sử dụng', 'Không sử dụng'];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

const stripLocation = (value) => String(value || '-').split('|@lat:')[0].trim();

const mapUseStatus = (value) => (value ? 'Đang sử dụng' : 'Không sử dụng');

const StaffVehicleManage = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Tất cả');
  const [useStatus, setUseStatus] = useState('Tất cả');
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchVehicles = async (params = {}) => {
    try {
      setLoadingList(true);
      setListError('');
      const response = await AxiosSetup.get('/Admin/vehicles', { params });
      const data = response.data || {};
      setVehicles(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || params.page || 1);
    } catch (error) {
      console.error(error);
      setListError('Không thể tải danh sách phương tiện.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedVehicleId(null);
      setDetail(null);
      setDetailLoading(false);
      setDetailError('');
      void fetchVehicles({
        keyword: search || undefined,
        status: status === 'Tất cả' ? undefined : status,
        inUse: useStatus === 'Tất cả' ? undefined : useStatus === 'Đang sử dụng',
        page: currentPage,
        size: pageSize,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [search, status, useStatus, currentPage]);

  useEffect(() => {
    if (!selectedVehicleId) return undefined;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          setDetailLoading(true);
          setDetailError('');
          const response = await AxiosSetup.get(`/Admin/vehicles/${selectedVehicleId}`);
          setDetail(response.data || null);
        } catch (error) {
          console.error(error);
          setDetailError('Không thể tải chi tiết phương tiện.');
        } finally {
          setDetailLoading(false);
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedVehicleId]);

  const selectedVehicle = detail;
  const filteredVehicles = useMemo(() => vehicles, [vehicles]);

  return (
    <div className="staff-vehicle-page">
      <main className="staff-vehicle-page__content">
        <header className="staff-vehicle-page__topbar">
          <div>
            <h1>Quản lý phương tiện</h1>
            <p>Danh sách xe đăng ký và trạng thái sử dụng</p>
          </div>
        </header>

        <section className="staff-vehicle-page__toolbar">
          <div className="staff-vehicle-page__search">
            <FiSearch />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm biển số, tên tài xế, mã SV..."
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select value={useStatus} onChange={(e) => setUseStatus(e.target.value)}>
            {USE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button type="button" className="staff-vehicle-page__filter-btn">
            <FiFilter />
            Lọc
          </button>
        </section>

        <section className="staff-vehicle-page__table-card">
          {loadingList ? (
            <div className="staff-vehicle-page__state">Đang tải danh sách phương tiện...</div>
          ) : listError ? (
            <div className="staff-vehicle-page__state staff-vehicle-page__state--error">{listError}</div>
          ) : (
            <>
              <table className="staff-vehicle-page__table">
                <thead>
                  <tr>
                    <th>Biển số</th>
                    <th>Loại xe</th>
                    <th>Hãng/Model</th>
                    <th>Màu</th>
                    <th>Chủ xe</th>
                    <th>Trạng thái</th>
                    <th>Đang sử dụng</th>
                    <th>Tổng chuyến</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="staff-vehicle-page__empty-row">
                        Không có phương tiện phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.vehicleId || vehicle.id}>
                        <td><strong>{vehicle.licensePlate || '-'}</strong></td>
                        <td>{vehicle.vehicleType || '-'}</td>
                        <td>{[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '-'}</td>
                        <td>{vehicle.color || '-'}</td>
                        <td>{vehicle.ownerFullName || '-'}</td>
                        <td>{vehicle.status || '-'}</td>
                        <td>{mapUseStatus(vehicle.isInUse)}</td>
                        <td>{vehicle.totalTripCount ?? 0}</td>
                        <td>
                          <button
                            type="button"
                            className="staff-vehicle-page__detail-btn"
                            onClick={() => setSelectedVehicleId(vehicle.vehicleId || vehicle.id)}
                          >
                        
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="staff-vehicle-page__table-footer">
                <div className="staff-vehicle-page__pager">
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((page) => (
                    <button
                      type="button"
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? 'staff-vehicle-page__pager-active' : ''}
                    >
                      {page}
                    </button>
                  ))}
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                    <FiChevronRight />
                  </button>
                </div>
                <div className="staff-vehicle-page__page-size">
                  <span>Tổng {total || filteredVehicles.length} phương tiện</span>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {selectedVehicleId ? (
        <div className="staff-vehicle-modal__backdrop" onClick={() => setSelectedVehicleId(null)}>
          <aside className="staff-vehicle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-vehicle-modal__header">
              <div>
                <p>Chi tiết phương tiện</p>
                <h2>{selectedVehicle?.licensePlate || '...'}</h2>
              </div>
              <button type="button" className="staff-vehicle-modal__close" onClick={() => setSelectedVehicleId(null)}>
                <FiX />
              </button>
            </div>

            <div className="staff-vehicle-modal__body">
              {detailLoading ? (
                <div className="staff-vehicle-page__state">Đang tải chi tiết...</div>
              ) : detailError ? (
                <div className="staff-vehicle-page__state staff-vehicle-page__state--error">{detailError}</div>
              ) : selectedVehicle ? (
                <>
                  <div className="staff-vehicle-modal__header-card">
                    <div className="staff-vehicle-modal__header-left">
                      <span className="staff-vehicle-modal__plate-badge">{selectedVehicle.licensePlate || '-'}</span>
                    </div>
                    <span className={`staff-vehicle-modal__status-badge staff-vehicle-modal__status-badge--${String(selectedVehicle.status || '').toLowerCase()}`}>
                      {selectedVehicle.status || '-'}
                    </span>
                  </div>

                  <section className="staff-vehicle-modal__section staff-vehicle-modal__section--gallery">
                    <h3><FiInfo /> Ảnh giấy đăng ký xe</h3>
                    <div className="staff-vehicle-modal__gallery-single">
                      <img
                        src={selectedVehicle.vehicleRegistrationImage || selectedVehicle.registrationImage || selectedVehicle.documentImage || ''}
                        alt="Giấy đăng ký xe"
                      />
                    </div>
                    <a
                      className="staff-vehicle-modal__view-full"
                      href={selectedVehicle.vehicleRegistrationImage || selectedVehicle.registrationImage || selectedVehicle.documentImage || '#'}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Xem đầy đủ <FiExternalLink />
                    </a>
                  </section>

                  <section className="staff-vehicle-modal__section">
                    <h3><FiInfo /> Thông tin xe</h3>
                    <div className="staff-vehicle-modal__grid">
                      <div><span>Loại xe</span><strong>{selectedVehicle.vehicleType || '-'}</strong></div>
                      <div><span>Hãng/Model</span><strong>{[selectedVehicle.brand, selectedVehicle.model].filter(Boolean).join(' ') || '-'}</strong></div>
                      <div><span>Màu sắc</span><strong>{selectedVehicle.color || '-'}</strong></div>
                      <div><span>Năm sản xuất</span><strong>{selectedVehicle.manufacturingYear || '-'}</strong></div>
                      <div><span>Số khung</span><strong>{selectedVehicle.vin || '-'}</strong></div>
                      <div><span>Số máy</span><strong>{selectedVehicle.engineNumber || '-'}</strong></div>
                    </div>
                  </section>

                  <section className="staff-vehicle-modal__section">
                    <h3><FiUser /> Thông tin chủ xe</h3>
                    <div className="staff-vehicle-modal__grid">
                      <div><span>Họ tên</span><strong>{selectedVehicle.ownerFullName || '-'}</strong></div>
                      <div><span>Email</span><strong>{selectedVehicle.ownerEmail || '-'}</strong></div>
                      <div><span>Mã SV</span><strong>{selectedVehicle.ownerStudentCode || '-'}</strong></div>
                      <div><span>SĐT</span><strong>{selectedVehicle.ownerPhoneNumber || '-'}</strong></div>
                    </div>
                  </section>

                  <section className="staff-vehicle-modal__section staff-vehicle-modal__section--approval">
                    <h3><FiCalendar /> Trạng thái duyệt tài xế</h3>
                    <div className="staff-vehicle-modal__approval-box">
                      <strong>{selectedVehicle.driverApprovalStatus || '-'}</strong>
                      <span>Ngày duyệt: {formatDate(selectedVehicle.driverApprovedAt || selectedVehicle.approvedAt || selectedVehicle.createdAt)}</span>
                    </div>
                  </section>

                  <section className="staff-vehicle-modal__section staff-vehicle-modal__section--trips">
                    <div className="staff-vehicle-modal__section-head">
                      <div>
                        <h3><FiAlertCircle /> Các chuyến gần đây</h3>
                        <p>Danh sách những chuyến vừa được thực hiện hoặc đang theo dõi gần nhất.</p>
                      </div>
                      <span className="staff-vehicle-modal__trip-count">
                        {Array.isArray(selectedVehicle.recentTrips) ? selectedVehicle.recentTrips.length : 0} chuyến
                      </span>
                    </div>

                    {Array.isArray(selectedVehicle.recentTrips) && selectedVehicle.recentTrips.length > 0 ? (
                      <div className="staff-vehicle-modal__trip-list">
                        {selectedVehicle.recentTrips.map((trip) => (
                          <article key={trip.tripId} className="staff-vehicle-modal__trip-item">
                            <div className="staff-vehicle-modal__trip-item-top">
                              <div className="staff-vehicle-modal__trip-item-left">
                                <div className="staff-vehicle-modal__trip-badge">#{trip.tripId}</div>
                                <div>
                                  <strong className="staff-vehicle-modal__trip-title">
                                    {trip.tripType || 'Chuyến xe'}
                                  </strong>
                                  <p className="staff-vehicle-modal__trip-meta">
                                    {trip.plannedStartDateTime ? formatDate(trip.plannedStartDateTime) : 'Chưa có thời gian'}
                                  </p>
                                </div>
                              </div>
                              <span className={`staff-vehicle-modal__trip-status staff-vehicle-modal__trip-status--${String(trip.status || '').toLowerCase()}`}>
                                {trip.status || '-'}
                              </span>
                            </div>

                            <div className="staff-vehicle-modal__trip-route">
                              <div className="staff-vehicle-modal__trip-point staff-vehicle-modal__trip-point--pickup">
                                <span>Đón</span>
                                <strong>{stripLocation(trip.pickupLocation)}</strong>
                              </div>
                              <div className="staff-vehicle-modal__trip-arrow">→</div>
                              <div className="staff-vehicle-modal__trip-point staff-vehicle-modal__trip-point--dropoff">
                                <span>Trả</span>
                                <strong>{stripLocation(trip.dropoffLocation)}</strong>
                              </div>
                            </div>

                            <div className="staff-vehicle-modal__trip-footer">
                              <div>
                                <span>Vai trò</span>
                                <strong>{trip.role || 'Lái xe'}</strong>
                              </div>
                              <div>
                                <span>Ngày kết thúc</span>
                                <strong>{trip.plannedEndDateTime ? formatDate(trip.plannedEndDateTime) : '-'}</strong>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="staff-vehicle-modal__trip-empty">
                        <strong>Chưa có chuyến gần đây</strong>
                        <p>Khi có dữ liệu chuyến xe, mục này sẽ hiển thị theo dạng thẻ dễ quan sát hơn.</p>
                      </div>
                    )}
                  </section>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
};

export default StaffVehicleManage;
