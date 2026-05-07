import { useEffect, useMemo, useState } from 'react';
import { FiArrowUpRight, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AxiosSetup from '../../services/AxiosSetup';
import './AdminStatistic.css';

const monthLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const formatMoney = (value) => {
    if (value === null || value === undefined) return '0';
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2,
    }).format(value);
};

const getYearFromSummary = (value) => Number(value) || new Date().getFullYear();

const AdminStatistic = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [chartType, setChartType] = useState('area');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isDownloading, setIsDownloading] = useState(false);
    const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
    const [showAllMonths, setShowAllMonths] = useState(false);

    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, index) => currentYear - index);
    }, []);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await AxiosSetup.get('/Admin/dashboard/summary', {
                    params: { year: selectedYear },
                });
                setSummary(response.data);
                setSelectedYear(getYearFromSummary(response.data?.year ?? selectedYear));
            } catch (err) {
                console.error(err);
                setError('Không thể tải dữ liệu thống kê.');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [selectedYear]);

    const chartData = useMemo(() => {
        const monthlyRevenue = summary?.monthlyRevenue ?? [];
        return monthLabels.map((label, index) => {
            const item = monthlyRevenue.find((monthItem) => monthItem.month === index + 1);
            return { month: label, revenue: item?.revenueVnd ?? 0 };
        });
    }, [summary]);

    const highestRevenueMonth = useMemo(() => {
        if (!chartData.length) return null;
        return chartData.reduce((best, current) => (current.revenue > (best?.revenue ?? -1) ? current : best), null);
    }, [chartData]);

    const pieChartData = useMemo(() => chartData.filter((item) => item.revenue > 0), [chartData]);

    const pieColors = ['#0053ce', '#306deb', '#4b82f0', '#6c9cf3', '#8cb3f7', '#aac9fb', '#c7dafa', '#dce7fd', '#edf2ff', '#b5c8ff', '#87a8f9', '#5f89ef'];

    const handleYearSelect = (nextYear) => {
        setSelectedYear(nextYear);
        setIsYearMenuOpen(false);
    };

    const toggleYearMenu = () => {
        setIsYearMenuOpen((current) => !current);
    };

    const handleDownloadReport = async () => {
        try {
            setIsDownloading(true);
            const response = await AxiosSetup.get('/Admin/dashboard/summary/export-excel', {
                params: { year: selectedYear },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `dashboard-summary-${selectedYear}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error(err);
            setError('Không thể xuất báo cáo.');
        } finally {
            setIsDownloading(false);
        }
    };

    const monthRows = useMemo(() => {
        return chartData.map((item) => ({
            ...item,
            hasRevenue: item.revenue > 0,
        }));
    }, [chartData]);

    const selectedMonthCount = monthRows.filter((item) => item.hasRevenue).length;

    const kpis = [
        {
            title: 'Tổng người dùng',
            value: summary ? summary.totalUser.toLocaleString('vi-VN') : '0',
            icon: FiTrendingUp,
            trend: summary ? `${summary.totalUser.toLocaleString('vi-VN')} người` : '0 người',
            trendType: 'up',
        },
        {
            title: 'Tổng chuyến đi',
            value: summary ? summary.totalTripsInYear.toLocaleString('vi-VN') : '0',
            icon: FiTrendingUp,
            trend: summary ? `${summary.totalCompletedTrips} hoàn thành` : '0 hoàn thành',
            trendType: 'up',
        },
        {
            title: 'Tổng doanh thu',
            value: summary ? `${formatMoney(summary.totalRevenueVnd)} ₫` : '0 ₫',
            icon: FiTrendingUp,
            trend: summary ? `Năm ${summary.year}` : '',
            trendType: 'up',
            featured: true,
        },
        {
            title: 'Tỷ lệ hoàn thành',
            value: summary ? `${summary.completionRatePercent}%` : '0%',
            icon: FiCheckCircle,
            trend: summary ? `${summary.completionRatePercent}%` : '0%',
            trendType: 'flat',
        },
    ];

    return (
        <div className="admin-stat">
            <header className="admin-stat__header">
                <div>
                    <h2>Bảng điều khiển thống kê</h2>
                    <p>Tổng quan thời gian thực về chuyến đi, doanh thu và hiệu suất hệ thống.</p>
                </div>

                <div className="admin-stat__actions">
                    <button
                        type="button"
                        className="admin-stat__chip"
                        onClick={toggleYearMenu}
                    >
                        <span className="material-symbols-outlined">Năm -</span>
                        {selectedYear}

                    </button>
                    {isYearMenuOpen ? (
                        <div className="admin-stat__year-menu" role="listbox" aria-label="Chọn năm">
                            {availableYears.map((year) => (
                                <button
                                    key={year}
                                    type="button"
                                    className={`admin-stat__year-option ${year === selectedYear ? 'is-active' : ''}`}
                                    onClick={() => handleYearSelect(year)}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    ) : null}
                    <button
                        type="button"
                        className="admin-stat__primary-btn"
                        onClick={handleDownloadReport}
                        disabled={isDownloading}
                    >
                        <span className="material-symbols-outlined">Xuất File Excel</span>
                        {isDownloading ? 'Đang xuất...' : ''}
                    </button>
                </div>
            </header>

            {error ? <p className="admin-stat__error">{error}</p> : null}

            <section className="admin-stat__kpis">
                {kpis.map((item) => {
                    const Icon = item.icon;
                    return (
                        <article
                            key={item.title}
                            className={`admin-stat-kpi ${item.featured ? 'admin-stat-kpi--featured' : ''}`}
                        >
                            <div className="admin-stat-kpi__top">
                                <div className="admin-stat-kpi__icon">
                                    <Icon />
                                </div>
                                <span className={`admin-stat-trend admin-stat-trend--${item.trendType}`}>
                                    <FiArrowUpRight />
                                    {item.trend}
                                </span>
                            </div>
                            <div className="admin-stat-kpi__body">
                                <p>{item.title}</p>
                                <h3>{item.value}</h3>
                            </div>
                        </article>
                    );
                })}
            </section>

            <section className="admin-stat__grid">
                <article className="admin-stat-panel admin-stat-panel--chart">
                    <div className="admin-stat-panel__head">
                        <div>
                            <h3>Biểu đồ doanh thu</h3>
                            <p>Doanh thu theo tháng trong năm {summary?.year ?? ''}</p>
                        </div>
                        <button
                            type="button"
                            className="admin-stat__chart-toggle"
                            onClick={() => setChartType((current) => (current === 'area' ? 'pie' : 'area'))}
                        >
                            {chartType === 'area' ? 'Đổi sang biểu đồ tròn' : 'Đổi sang biểu đồ cột'}
                        </button>
                    </div>

                    <div className="admin-stat-chart">
                        <div className="admin-stat-chart__canvas">
                            {loading ? (
                                <div className="admin-stat__loading">Đang tải dữ liệu...</div>
                            ) : chartType === 'area' ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 20, right: 16, left: 24, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="5%" stopColor="#0053ce" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#0053ce" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#d3e4fe" />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                                        <YAxis
                                            width={84}
                                            tickMargin={10}
                                            tickFormatter={(value) => formatMoney(value)}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`${formatMoney(value)} ₫`, '']}
                                            labelFormatter={(label) => `Tháng ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#0053ce"
                                            strokeWidth={3}
                                            fill="url(#revenueGradient)"
                                            activeDot={{ r: 5 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip formatter={(value, name, props) => [`${formatMoney(value)} ₫`, `Tháng ${props?.payload?.month ?? ''}`]} />
                                        <Pie
                                            data={pieChartData}
                                            dataKey="revenue"
                                            nameKey="month"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={120}
                                            innerRadius={68}
                                            paddingAngle={2}
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${entry.month}`} fill={pieColors[index % pieColors.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="admin-stat-chart__axis admin-stat-chart__axis--x" aria-hidden="true" />
                    </div>
                </article>

                <aside className="admin-stat-panel admin-stat-panel--rank">
                    <h3>Doanh thu tháng cao nhất</h3>
                    <div className="admin-stat-rank-list">
                        {highestRevenueMonth ? (
                            <div className="admin-stat-rank-item">
                                <div className="admin-stat-rank-item__left">
                                    <div className="admin-stat-rank-item__rank">1</div>
                                    <div>
                                        <p>Tháng {highestRevenueMonth.month.replace('Th', '')}</p>
                                        <span>Tháng có doanh thu cao nhất</span>
                                    </div>
                                </div>

                                <div className="admin-stat-rank-item__right">
                                    <strong>{formatMoney(highestRevenueMonth.revenue)} ₫</strong>
                                    <span className="admin-stat-rank-item__trend admin-stat-rank-item__trend--up">
                                        <FiArrowUpRight />
                                        {summary?.year ?? ''}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="admin-stat__empty">Chưa có dữ liệu doanh thu.</p>
                        )}
                    </div>

                    <button
                        type="button"
                        className="admin-stat__outline-btn"
                        onClick={() => setShowAllMonths((current) => !current)}
                    >
                        {showAllMonths ? 'Thu gọn tháng' : 'Xem tất cả tháng'}
                    </button>

                    {showAllMonths ? (
                        <div className="admin-stat-months">
                            <div className="admin-stat-months__head">
                                <h4>Chi tiết theo tháng</h4>
                                <span>{selectedMonthCount}/12 tháng có doanh thu</span>
                            </div>

                            <div className="admin-stat-months__grid">
                                {monthRows.map((item) => (
                                    <article key={item.month} className={`admin-stat-month-card ${item.hasRevenue ? 'admin-stat-month-card--active' : ''}`}>
                                        <div className="admin-stat-month-card__label">Tháng {item.month}</div>
                                        <strong>{formatMoney(item.revenue)} ₫</strong>
                                        <span>{item.hasRevenue ? 'Có doanh thu' : 'Chưa phát sinh'}</span>
                                    </article>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </aside>
            </section>
        </div>
    );
};

export default AdminStatistic;
