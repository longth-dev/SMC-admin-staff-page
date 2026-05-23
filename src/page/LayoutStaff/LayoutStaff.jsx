import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../../component/SideBar/SideBar';

const LayoutStaff = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
            <SideBar />
            <div style={{ flex: 1, minWidth: 0, padding: '24px' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default LayoutStaff;
