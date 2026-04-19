import { Outlet, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ROLE_CLAIM =
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const ProtectedRoutesStaff = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    let hasAccess = false;

    try {
        const decodedToken = jwtDecode(token);
        const role = decodedToken[ROLE_CLAIM] || decodedToken.role || decodedToken.scope;
        const roles = (Array.isArray(role) ? role : [role])
            .filter(Boolean)
            .map((item) => String(item).toLowerCase());

        hasAccess = roles.includes('staff');
    } catch (e) {
        console.error('Lỗi khi giải mã token:', e);
        hasAccess = false;
    }

    return hasAccess ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoutesStaff