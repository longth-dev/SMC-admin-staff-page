import { NavLink } from 'react-router-dom';
import {
    FiUsers,
    FiBell,
    FiDollarSign,
    FiClipboard,
    FiMap,
    FiTruck,
    FiAlertTriangle,
    FiFileText,
    FiSettings,
    FiLogOut,
} from 'react-icons/fi';
import logo from '../../assets/smc.png';
import './SideBar.css';

const ROLE_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role';
const ROLE_CLAIM_ALT = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const adminMenu = [
    { label: 'Thống kê doanh thu', to: '/admin/statistics', icon: FiFileText, end: true },
    { label: 'Quản lý account', to: '/admin/accounts', icon: FiUsers },
    { label: 'Quản lý voucher', to: '/admin/vouchers', icon: FiDollarSign },
    { label: 'Point Policy', to: '/admin/point-policy', icon: FiClipboard },
    { label: 'Quản lý thông báo', to: '/admin/notifications', icon: FiBell },
    { label: 'Phân tích heatmap', to: '/admin/heatmap', icon: FiMap },
];

const staffMenu = [
    { label: 'Duyệt Driver', to: '/staff/drivers', icon: FiTruck, end: true },
    { label: 'Xử lý khiếu nại và bồi thường', to: '/staff/complaints', icon: FiAlertTriangle },
    { label: 'Xử lý rút tiền', to: '/staff/withdrawals', icon: FiDollarSign },
    { label: 'Quản lý account', to: '/staff/accounts', icon: FiUsers },
];

const footerMenu = [{ label: 'Settings', to: '/admin/settings', icon: FiSettings }];

const getLinkClass = ({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`;

const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    window.location.href = '/login';
};

const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return '';

    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(
            decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
                    .join('')
            )
        );

        return decoded[ROLE_CLAIM] || decoded[ROLE_CLAIM_ALT] || decoded.role || decoded.scope || '';
    } catch {
        return localStorage.getItem('role') || '';
    }
};

const SideBar = () => {
    const role = getUserRole();
    const isAdmin = role === 'Admin';
    const isStaff = role === 'Staff';

    return (
        <aside className="sidebar">
            <div className="sidebar__brand-wrap">
                <div className="sidebar__logo">
                    <img src={logo} alt="SMC logo" className="sidebar__logo-image" />
                </div>
                <div className="sidebar__brand">
                    <span className="sidebar__brand--blue">SMC</span> Admin
                </div>
            </div>

            {isAdmin ? (
                <nav className="sidebar__section">
                    <div className="sidebar__group-title">ADMIN</div>
                    <ul className="sidebar__menu">
                        {adminMenu.map((item) => {
                            const Icon = item.icon;

                            return (
                                <li key={item.label}>
                                    <NavLink to={item.to} end={item.end} className={getLinkClass}>
                                        <Icon className="sidebar__icon" aria-hidden="true" />
                                        <span className="sidebar__label">{item.label}</span>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            ) : null}

            {isAdmin && isStaff ? <div className="sidebar__divider" /> : null}

            {isStaff ? (
                <nav className="sidebar__section">
                    <div className="sidebar__group-title">STAFF</div>
                    <ul className="sidebar__menu">
                        {staffMenu.map((item) => {
                            const Icon = item.icon;

                            return (
                                <li key={item.label}>
                                    <NavLink to={item.to} className={getLinkClass}>
                                        <Icon className="sidebar__icon" aria-hidden="true" />
                                        <span className="sidebar__label">{item.label}</span>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            ) : null}

            {(isAdmin || isStaff) ? <div className="sidebar__divider" /> : null}

            <div className="sidebar__bottom">
                {footerMenu.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink key={item.label} to={item.to} className={getLinkClass}>
                            <Icon className="sidebar__icon" aria-hidden="true" />
                            <span className="sidebar__label">{item.label}</span>
                        </NavLink>
                    );
                })}

                <button type="button" className="sidebar__item" onClick={handleLogout}>
                    <FiLogOut className="sidebar__icon" aria-hidden="true" />
                    <span className="sidebar__label">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default SideBar;
