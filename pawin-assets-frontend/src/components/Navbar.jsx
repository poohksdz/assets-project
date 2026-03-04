// src/components/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, History, LayoutGrid, LayoutDashboard, User, Bell, CheckCircle2, ShieldCheck, CheckCheck } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// 🔊 ฟังก์ชันเล่นเสียงแจ้งเตือน (สร้างเสียง beep จาก Web Audio API ไม่ต้องใช้ไฟล์เสียง)
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);      // โน้ต A5
    oscillator.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1); // โน้ต D6
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) { /* เบราว์เซอร์บางตัวอาจบล็อก AudioContext */ }
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const storedUser = localStorage.getItem('userInfo');
  const userInfo = storedUser ? JSON.parse(storedUser) : null;
  const userName = userInfo?.user?.name || 'PAWIN TECH';
  const isAdmin = userInfo?.user?.isAdmin || false;
  const userRole = isAdmin ? 'Administrator' : 'User';

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const stored = localStorage.getItem('userInfo');
      if (!stored) return;

      const user = JSON.parse(stored);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/notifications', config);
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications(); // ดึงครั้งแรกเมื่อเปลี่ยนหน้า
    const interval = setInterval(fetchNotifications, 60000); // fallback ทุก 60 วินาที (เผื่อ socket หลุด)
    return () => clearInterval(interval);
  }, [location.pathname]);

  // 🔔 ขอสิทธิ์ Browser Push Notification ตอนเปิดหน้าเว็บครั้งแรก
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 🔌 Socket.io: รับแจ้งเตือนแบบ real-time + Toast + เสียง + Browser Push
  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (!stored) return;

    const user = JSON.parse(stored);
    const userId = user?.user?._id || user?.user?.id;
    if (!userId) return;

    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      socket.emit('join', userId);
    });

    socket.on('new_notification', async (payload) => {
      // 🔊 เล่นเสียงแจ้งเตือน
      playNotificationSound();

      // 🍞 แสดง Toast Popup
      toast.info(payload?.title || 'คุณมีการแจ้งเตือนใหม่', {
        position: 'top-right',
        autoClose: 5000,
        icon: '🔔',
      });

      // 🌐 Browser Push Notification (แจ้งเตือนแม้แท็บอยู่ background)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload?.title || 'PAWIN-ASSETS', {
          body: payload?.message || 'คุณมีการแจ้งเตือนใหม่',
          icon: '/favicon.ico',
        });
      }

      // ดึงข้อมูล notification ทั้งหมดมาใหม่
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/notifications', config);
        setNotifications(data);
      } catch (error) {
        console.error('Error refetching notifications:', error);
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRead = async (id, isRead) => {
    if (isRead) return;
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, config);

      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, is_read: 1 } : notif)
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // ✅ อ่านทั้งหมดแล้ว
  const handleMarkAllRead = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, config);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // 🚀 แก้ไขที่นี่: เปลี่ยน z-50 เป็น z-[999] เพื่อให้ Navbar ลอยอยู่เหนือกล่องค้นหาและหน้าเว็บทั้งหมด
  return (
    <nav className="bg-white sticky top-0 z-[999] border-b border-slate-100 shadow-sm font-sans">
      <div className="w-full px-4 md:px-6 h-16 md:h-20 flex justify-between items-center relative">

        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 md:gap-4 group">
            <div className="relative">
              <img
                src="/favicon.ico"
                alt="PAWIN Logo"
                className={`w-8 h-8 md:w-10 md:h-10 relative z-10 transition-all duration-800 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${isNavigating ? 'rotate-360 scale-110' : 'rotate-0 scale-100'}
                `}
              />
            </div>

            <div className="flex flex-col">
              <h1 className="text-lg md:text-2xl font-black tracking-tighter uppercase leading-none text-slate-900">
                PAWIN-<span className="text-orange-500">ASSETS</span>
              </h1>
              <span className="text-[8px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em] mt-0.5 md:mt-1 hidden sm:block">
                Technology
              </span>
            </div>
          </Link>

          <div className="hidden lg:block h-10 w-px bg-slate-100 mx-2"></div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2
                ${location.pathname === '/dashboard' ? 'text-blue-900 bg-slate-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
              `}
            >
              <LayoutGrid size={18} strokeWidth={2.5} /> Dashboard
            </Link>
            <Link
              to="/history"
              className={`px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2
                ${location.pathname === '/history' ? 'text-blue-900 bg-slate-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
              `}
            >
              <History size={18} strokeWidth={2.5} /> History
            </Link>

            {isAdmin && (
              <>
                <Link
                  to="/admin/approvals"
                  className={`px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2
                    ${location.pathname === '/admin/approvals' ? 'text-orange-600 bg-orange-50' : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'}
                  `}
                >
                  <ShieldCheck size={18} strokeWidth={2.5} /> Admin Approval
                </Link>
                <Link
                  to="/admin/dashboard"
                  className={`px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2
                    ${location.pathname === '/admin/dashboard' ? 'text-purple-600 bg-purple-50' : 'text-slate-500 hover:text-purple-600 hover:bg-purple-50'}
                  `}
                >
                  <LayoutDashboard size={18} strokeWidth={2.5} /> Admin Dashboard
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-5">
          <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-6 border-l border-slate-100">

            {/* ระบบกระดิ่งแจ้งเตือน */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-300 outline-none"
              >
                <Bell size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 sm:top-1.5 right-1 sm:right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>
                )}
              </button>

              {/* Dropdown กล่องจดหมาย */}
              <div className={`fixed inset-x-4 top-[70px] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 origin-top sm:origin-top-right z-[1000] ${isNotifOpen ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-95 invisible -translate-y-2'}`}>
                <div className="p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="bg-orange-500 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full uppercase italic">New {unreadCount}</span>
                    )}
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[8px] sm:text-[9px] font-bold text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-1 uppercase tracking-wider"
                      title="อ่านทั้งหมดแล้ว"
                    >
                      <CheckCheck size={12} /> Read All
                    </button>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleRead(notif.id, notif.is_read)}
                          className={`p-3 sm:p-4 cursor-pointer transition-colors hover:bg-slate-50 ${notif.is_read ? 'opacity-60' : 'bg-orange-50/30'}`}
                        >
                          <div className="flex gap-2 sm:gap-3">
                            <div className={`mt-0.5 shrink-0 ${notif.is_read ? 'text-slate-300' : 'text-orange-500'}`}>
                              <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs sm:text-sm truncate ${notif.is_read ? 'font-bold text-slate-600' : 'font-black text-slate-900'}`}>
                                {notif.title}
                              </p>
                              <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 leading-normal break-words whitespace-pre-wrap">
                                {notif.message}
                              </p>
                              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-1.5 sm:mt-2 uppercase tracking-tighter">
                                {new Date(notif.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 sm:p-8 text-center">
                      <Bell size={24} className="sm:w-8 sm:h-8 mx-auto text-slate-200 mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm font-bold text-slate-500">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ข้อมูลผู้ใช้งาน */}
            <div className="flex items-center gap-2 sm:gap-3 group cursor-default">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-extrabold text-slate-900 leading-none truncate max-w-[120px]">{userName}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{userRole}</span>
              </div>

              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 active:scale-95 transition-transform">
                <User size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('userInfo');
                navigate('/');
              }}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all duration-300 ml-1 sm:ml-0"
              title="Logout"
            >
              <LogOut size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}