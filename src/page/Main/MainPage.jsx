import { Outlet } from 'react-router-dom';
import SideBar from '../../component/SideBar/SideBar';
import './MainPage.css';

const stats = [
  { label: 'Total User', value: '40,689', change: '8.5% Up from yesterday', tone: 'up' },
  { label: 'Total Trip', value: '10293', change: '1.3% Up from past week', tone: 'up' },
  { label: 'Total Sales', value: '36,63 TR', change: '4.3% Down from yesterday', tone: 'down' },
  { label: 'Complete Rate', value: '90%', change: '1.8% Up from yesterday', tone: 'up' },
];

const MainPage = () => { 
  return (
    <div className="dashboard-layout">
      <SideBar />

      <main className="dashboard">
        <header className="dashboard__topbar">
          <div className="dashboard__search">
            <span className="dashboard__search-icon" aria-hidden="true">⌕</span>
            <input type="text" placeholder="Search" />
          </div>

          <div className="dashboard__profile">
            <span className="dashboard__flag" aria-hidden="true">🇬🇧</span>
            <span className="dashboard__lang">English</span>
            <div className="dashboard__avatar">MR</div>
            <div>
              <div className="dashboard__name">Moni Roy</div>
              <div className="dashboard__role">Admin</div>
            </div>
          </div>
        </header>

        <section className="dashboard__content">
          <Outlet />
          <h1 className="dashboard__title">Dashboard</h1>

          <div className="dashboard__stats">
            {stats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <div>
                  <p className="stat-card__label">{stat.label}</p>
                  <h2 className="stat-card__value">{stat.value}</h2>
                </div>
                <div className="stat-card__icon" aria-hidden="true" />
                <p className={`stat-card__change stat-card__change--${stat.tone}`}>
                  {stat.change}
                </p>
              </article>
            ))}
          </div>

          <section className="panel panel--chart">
            <div className="panel__head">
              <h3>Sales Details</h3>
              <button type="button" className="panel__month">October</button>
            </div>
            <div className="chart-placeholder">
              <div className="chart-placeholder__line" />
            </div>
          </section>

          <section className="panel">
            <h3>Doanh thu tháng cao nhất</h3>
            <div className="table-shell">
              <div className="table-row table-row--head">
                <span>Tháng</span>
                <span>Chuyến</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              <div className="table-row">
                <span>Tháng 8</span>
                <span>423</span>
                <span>$34,295</span>
                <span><b className="badge badge--good">Rất Tốt</b></span>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3>Doanh thu tháng thấp nhất</h3>
            <div className="table-shell">
              <div className="table-row table-row--head">
                <span>Tháng</span>
                <span>Chuyến</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              <div className="table-row">
                <span>Tháng 6</span>
                <span>50</span>
                <span>$16.36</span>
                <span><b className="badge badge--warn">Kém</b></span>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default MainPage;
