// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; 
import History from './pages/History'; 
import AdminApprovals from './pages/AdminApprovals'; 
import AdminDashboard from './pages/AdminDashboard'; 

// นำเข้ากล่องแจ้งเตือน และไฟล์ CSS ของมัน
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  //  1. ย้าย State ตะกร้ามาไว้ที่ไฟล์แม่สูงสุด และดึงจาก localStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  //  2. สั่งบันทึกลง localStorage อัตโนมัติเมื่อตะกร้าเปลี่ยน
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  return (
    <BrowserRouter>
      {/* วาง ToastContainer ไว้ตรงนี้ เพื่อให้ใช้ได้ทุกหน้าในแอป */}
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* หน้าแรกที่เข้ามาเจอคือหน้า Login */}
        <Route path="/" element={<Login />} />
        
        {/* เพื่อให้ตอนที่ระบบเตะมาที่ /login แล้วหาหน้าเจอ จะได้ไม่จอขาว */}
        <Route path="/login" element={<Login />} />
        
        {/*  3. ส่ง cartItems และ setCartItems เป็น Props ไปให้หน้า Dashboard */}
        <Route 
          path="/dashboard" 
          element={<Dashboard cartItems={cartItems} setCartItems={setCartItems} />} 
        />

        {/* สร้างเส้นทางสำหรับไปหน้าประวัติ */}
        <Route path="/history" element={<History />} />

        {/* สร้างเส้นทางสำหรับหน้า Admin อนุมัติการคืน */}
        <Route path="/admin/approvals" element={<AdminApprovals />} />

        {/* เพิ่มเส้นทางสำหรับหน้าศูนย์บัญชาการ Admin Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}