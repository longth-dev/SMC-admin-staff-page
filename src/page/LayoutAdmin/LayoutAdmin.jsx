import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../../component/SideBar/SideBar';

const LayoutAdmin = () => {
    return (
        <div style={{ display: 'flex' }}>
            <SideBar />
            <div style={{ marginLeft: '5px', padding: '20px', flex: 1 }}>
                <Outlet />
            </div>
        </div>
    );
};

export default LayoutAdmin;
