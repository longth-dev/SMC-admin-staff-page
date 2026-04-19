import { useEffect, useMemo, useState } from 'react';
import { FiArrowUpRight, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import {
    Area,
    AreaChart,
    CartesianGrid,
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

const AdminStatistic = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await AxiosSetup.get('/Admin/dashboard/summary');
                setSummary(response.data);
            } catch (err) {
                console.error(err);
                setError('Không thể tải dữ liệu thống kê.');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

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
                    <button type="button" className="admin-stat__chip">
                        <span className="material-symbols-outlined">calendar_today</span>
                        {summary?.year ?? 'Đang tải...'}
                        <span className="material-symbols-outlined">expand_more</span>
                    </button>
                    <button type="button" className="admin-stat__primary-btn">
                        <span className="material-symbols-outlined">download</span>
                        Xuất báo cáo
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
                    </div>

                    <div className="admin-stat-chart">
                        <div className="admin-stat-chart__canvas">
                            {loading ? (
                                <div className="admin-stat__loading">Đang tải dữ liệu...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="5%" stopColor="#0053ce" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#0053ce" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#d3e4fe" />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                                        <YAxis tickFormatter={(value) => formatMoney(value)} tickLine={false} axisLine={false} />
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

                    <button type="button" className="admin-stat__outline-btn">Xem tất cả tháng</button>
                </aside>
            </section>
        </div>
    );
};

export default AdminStatistic;
