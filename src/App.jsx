import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LayoutAdmin from './page/LayoutAdmin/LayoutAdmin';
import Login from './page/Login/Login';
import AdminStatistic from './page/AdminStatistic/AdminStatistic';
import AdminAccountManage from './page/AdminAccountManage/AdminAccountManage';
import ProtectedRoutesAdmin from './Utils/ProtectedRoutesAdmin';
import AdminVoucherManage from './page/AdminVoucherManage/AdminVoucherManage';
import AdminNotificationManage from './page/AdminNotificationManage/AdminNotificationManage';
import AdminHeatMapManage from './page/AdminHeatMapManage/AdminHeatMapManage';
import LayoutStaff from './page/LayoutStaff/LayoutStaff';
import ProtectedRoutesStaff from './Utils/ProtectedRoutesStaff';
import StaffDriverApprovalManage from './page/StaffDriverApprovalManage/StaffDriverApprovalManage';
import StaffHandleWithdraw from './page/StaffHandleWithdraw/StaffHandleWithdraw';
import StaffHandleIncident from './page/StaffHandleIncident/StaffHandleIncident';
import StaffAccountManage from './page/StaffAccountManage/StaffAccountManage';

const Placeholder = ({ title }) => <div style={{ padding: 24 }}>{title}</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoutesAdmin />}>
          <Route path="/admin" element={<LayoutAdmin />}>
            <Route path="accounts" element={<AdminAccountManage />} />
            <Route path="vouchers" element={<AdminVoucherManage />} />
            <Route path="notifications" element={<AdminNotificationManage />} />
            <Route path="statistics" element={<AdminStatistic />} />
            <Route path="heatmap" element={<AdminHeatMapManage />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoutesStaff />}>
          <Route path="/staff" element={<LayoutStaff />}>
            <Route path="drivers" element={<StaffDriverApprovalManage />} />
            <Route path="complaints" element={<StaffHandleIncident />} />
            <Route path="accounts" element={< StaffAccountManage />} />
            <Route path="withdrawals" element={<StaffHandleWithdraw />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
