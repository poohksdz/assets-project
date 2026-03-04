// src/pages/History.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import { History as HistoryIcon, Clock, CheckCircle2, AlertCircle, UploadCloud, X, Package, Fingerprint, Calendar, Wallet, Ban, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const translations = {
  en: {
    pageTitle: "DATABASE MODULE: LOGS",
    opLogs: "Operation Logs",
    historyDesc: "Personal Acquisition History",
    colTime: "Timestamp / Deadline",
    colAsset: "Asset Identity",
    colVol: "Volume",
    colState: "State",
    colCmd: "Command",
    due: "Due",
    execReturn: "Execute Return",
    processing: "Processing",
    concluded: "Operation Concluded",
    noLogs: "No Logs Detected in Database",
    evUpload: "Evidence Upload",
    target: "Target",
    initScanner: "Initialize Scanner",
    capture: "Capture clear visual data",
    transmit: "Transmit Data",
    warnEv: "Awaiting visual evidence for verification.",
    errId: "System Error: Cannot identify asset ID.",
    errUpload: "Upload failed. Connection interrupted.",
    succEv: "Evidence submitted. Awaiting Admin clearance.",
    stCleared: "Cleared",
    stVerify: "Verifying",
    stBreach: "Breach: Overdue",
    stActive: "Active Use",
    borrowDate: "Borrowed",
    dueDate: "Deadline",
    // 🚀 เพิ่มคำแปลสำหรับโหมด Check-in
    checkInBtn: "Report Status",
    checkInTitle: "Condition Check-in",
    stCheckInReq: "Check-in Req.",
    conditionLabel: "Asset Condition",
    condGood: "Good (Operational)",
    condDamaged: "Damaged (Needs Repair)",
    condLost: "Lost / Missing",
    condWarning: "* In case of damage or loss, a penalty fee may apply.",
    creditLabel: "Credit Balance",
    penaltyLabel: "Total Penalty",
    monthFilter: "Filter by Month",
    allMonths: "All Months"
  },
  th: {
    pageTitle: "โมดูลฐานข้อมูล: บันทึกปฏิบัติการ",
    opLogs: "บันทึกปฏิบัติการ",
    historyDesc: "ประวัติการเบิกอุปกรณ์ส่วนตัว",
    colTime: "เวลาที่ยืม / กำหนดคืน",
    colAsset: "ข้อมูลอุปกรณ์",
    colVol: "จำนวน",
    colState: "สถานะ",
    colCmd: "คำสั่ง",
    due: "กำหนดคืน",
    execReturn: "ดำเนินการคืน",
    processing: "กำลังตรวจสอบ",
    concluded: "เสร็จสิ้นภารกิจ",
    noLogs: "ไม่พบประวัติการทำรายการในระบบ",
    evUpload: "อัปโหลดหลักฐาน",
    target: "เป้าหมาย",
    initScanner: "เริ่มต้นการสแกน",
    capture: "ถ่ายภาพหลักฐานให้ชัดเจน",
    transmit: "ส่งข้อมูล",
    warnEv: "กรุณาแนบภาพหลักฐานก่อนยืนยัน",
    errId: "ข้อผิดพลาดของระบบ: ไม่พบรหัสอุปกรณ์",
    errUpload: "การอัปโหลดล้มเหลว การเชื่อมต่อขัดข้อง",
    succEv: "ส่งหลักฐานสำเร็จ รอการอนุมัติจาก Admin",
    stCleared: "อนุมัติแล้ว",
    stVerify: "รอตรวจสอบ",
    stBreach: "เลยกำหนดคืน",
    stActive: "กำลังใช้งาน",
    borrowDate: "วันที่ยืม",
    dueDate: "กำหนดคืน",
    // 🚀 เพิ่มคำแปลสำหรับโหมด Check-in
    checkInBtn: "รายงานสถานะ",
    checkInTitle: "รายงานสภาพอุปกรณ์",
    stCheckInReq: "ต้องรายงานสถานะ",
    conditionLabel: "สภาพอุปกรณ์ปัจจุบัน",
    condGood: "🟢 ใช้งานได้ปกติ",
    condDamaged: "🟡 ชำรุด / รอซ่อม",
    condLost: "🔴 สูญหาย",
    condWarning: "* กรณีอุปกรณ์ชำรุดหรือสูญหาย อาจมีการหักเงินค่าปรับ",
    creditLabel: "เครดิตคงเหลือ",
    penaltyLabel: "ค่าปรับที่โดนหักทั้งหมด",
    monthFilter: "กรองตามเดือน",
    allMonths: "ทุกเดือน"
  }
};

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [returnImage, setReturnImage] = useState(null);

  const [modalMode, setModalMode] = useState('return');
  const [assetCondition, setAssetCondition] = useState('good');
  const [credit, setCredit] = useState(0);
  const [totalPenalty, setTotalPenalty] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('all');

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang];

  useEffect(() => {
    const checkLang = setInterval(() => {
      const currentLang = localStorage.getItem('lang') || 'en';
      if (currentLang !== lang) setLang(currentLang);
    }, 300);
    return () => clearInterval(checkLang);
  }, [lang]);

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    const cleanPath = String(imgPath).trim().toLowerCase();
    const invalid = ['', 'null', '-', '/', 'undefined', 'no-image'];
    if (invalid.includes(cleanPath)) return null;

    if (imgPath.startsWith('http')) return imgPath;
    if (imgPath.startsWith('/')) return `http://localhost:5000${imgPath}`;
    return `http://localhost:5000/${imgPath}`;
  };

  const fetchHistory = async () => {
    let isMounted = true;
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) return navigate('/login');
      const userInfo = JSON.parse(storedUser);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const { data } = await axios.get('http://localhost:5000/api/borrow/my-history', config);
      if (isMounted) {
        // API ส่งกลับมาเป็น { history, credit, totalPenalty }
        if (data && data.history) {
          setHistory(Array.isArray(data.history) ? data.history : []);
          setCredit(data.credit || 0);
          setTotalPenalty(data.totalPenalty || 0);
        } else {
          // fallback กรณี API เก่ายังส่งเป็น array
          setHistory(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      toast.error(t.errUpload);
    } finally {
      if (isMounted) setLoading(false);
    }
    return () => { isMounted = false; };
  };

  useEffect(() => { const cleanup = fetchHistory(); return () => cleanup; }, []);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnImage) return toast.warn(t.warnEv);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}`, 'Content-Type': 'multipart/form-data' } };

      const formData = new FormData();
      formData.append('return_image', returnImage);

      // 🚀 แนบข้อมูลสถานะอุปกรณ์เสมอ (เผื่อต้องหักเงินกรณีพัง/หาย)
      formData.append('asset_condition', assetCondition);

      // 🚀 แนบข้อมูลว่าเป็นโหมดเช็คอิน
      if (modalMode === 'checkin') {
        formData.append('is_checkin', 'true');
      }

      const targetId = selectedBorrow.borrow_id || selectedBorrow.ID || selectedBorrow.id;

      if (!targetId) {
        return toast.error(t.errId);
      }

      await axios.post(`http://localhost:5000/api/borrow/${targetId}/return`, formData, config);

      toast.success(t.succEv);
      setShowReturnModal(false);
      setReturnImage(null);
      setAssetCondition('good'); // รีเซ็ตสถานะ
      fetchHistory();
    } catch (error) {
      const message = error.response?.data?.message || t.errUpload;
      toast.error(`ERROR: ${message}`);
    }
  };

  // 🚀 ปรับฟังก์ชันแสดงสถานะ ให้รองรับ is_longterm
  const getStatusDisplay = (status, dueDate, is_longterm) => {
    const now = new Date();
    const due = new Date(dueDate);
    const isLate = now > due && status === 'active';

    if (status === 'returned') return <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shadow-sm"><CheckCircle2 size={10} className="sm:w-3 sm:h-3 inline mr-1 mb-0.5" /> {t.stCleared}</span>;
    if (status === 'pending_return') return <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 shadow-sm animate-pulse"><Clock size={10} className="sm:w-3 sm:h-3 inline mr-1 mb-0.5" /> {t.stVerify}</span>;

    if (isLate) {
      if (is_longterm) {
        // ของระยะยาวที่เลยกำหนด -> สีฟ้า (รอรายงานสถานะ)
        return <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 shadow-sm"><AlertCircle size={10} className="sm:w-3 sm:h-3 inline mr-1 mb-0.5 animate-pulse" /> {t.stCheckInReq}</span>;
      }
      // ของชั่วคราวที่เลยกำหนด -> สีแดง (เลยกำหนดคืน)
      return <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30 shadow-sm"><AlertCircle size={10} className="sm:w-3 sm:h-3 inline mr-1 mb-0.5 animate-bounce" /> {t.stBreach}</span>;
    }

    return <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">{t.stActive}</span>;
  };

  return (
    <MainLayout title={t.pageTitle}>
      <div className="max-w-7xl mx-auto pb-10 sm:pb-20 px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700">

        <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden mt-4 sm:mt-6 relative transition-colors duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl -z-10"></div>

          <div className="p-5 sm:p-8 border-b border-slate-200 dark:border-slate-800/50 flex flex-row items-center gap-4 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-orange-500 dark:text-orange-400 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors duration-300">
              <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">{t.opLogs}</h2>
              <p className="text-[8px] sm:text-[10px] font-bold text-orange-600 dark:text-orange-500 mt-0.5 sm:mt-1 uppercase tracking-[0.1em] sm:tracking-[0.2em]">{t.historyDesc}</p>
            </div>
          </div>

          {/* 💰 Summary Cards: Credit + Penalty + Month Filter */}
          <div className="px-5 sm:px-8 py-4 border-b border-slate-200 dark:border-slate-800/50 flex flex-wrap items-center gap-3 sm:gap-4 relative z-10">
            {/* Credit Balance */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl sm:rounded-2xl">
              <Wallet size={14} className="sm:w-4 sm:h-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t.creditLabel}</span>
                <span className={`text-sm sm:text-base font-black ${credit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>฿{Number(credit).toLocaleString()}</span>
              </div>
            </div>

            {/* Total Penalty */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl sm:rounded-2xl">
              <Ban size={14} className="sm:w-4 sm:h-4 text-red-500" />
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">{t.penaltyLabel}</span>
                <span className="text-sm sm:text-base font-black text-red-500">-฿{Number(totalPenalty).toLocaleString()}</span>
              </div>
            </div>

            {/* Month Filter */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">{t.monthFilter}</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-orange-500 transition-colors cursor-pointer appearance-none min-w-[140px] sm:min-w-[160px]"
              >
                <option value="all">{t.allMonths}</option>
                {(() => {
                  const months = new Set();
                  history.forEach(item => {
                    const d = new Date(item.borrow_date);
                    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                  });
                  return [...months].sort().reverse().map(m => {
                    const [y, mo] = m.split('-');
                    const label = new Date(y, mo - 1).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { year: 'numeric', month: 'long' });
                    return <option key={m} value={m}>{label}</option>;
                  });
                })()}
              </select>
            </div>
          </div>

          {/* 📱 MOBILE VIEW (Card Layout) */}
          {(() => {
            const filteredHistory = selectedMonth === 'all' ? history : history.filter(item => {
              const d = new Date(item.borrow_date);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
            });
            return (
              <div className="block md:hidden p-4 space-y-4 relative z-10">
                {filteredHistory.length > 0 ? filteredHistory.map((item) => {
                  const validImg = getImageUrl(item.img);
                  const rowKey = item.borrow_id || item.ID || item.id || Math.random().toString();
                  const isLate = new Date() > new Date(item.due_date) && item.status === 'active';

                  return (
                    <div key={rowKey} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col gap-4 shadow-sm relative overflow-hidden">

                      {/* ข้อมูลอุปกรณ์และสถานะ */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            {validImg ? <img src={validImg} alt={item.electotronixPN} className="w-full h-full object-contain p-1" /> : <Package size={20} className="text-slate-400" />}
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">{item.electotronixPN}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{item.category}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {getStatusDisplay(item.status, item.due_date, item.is_longterm)}
                        </div>
                      </div>

                      {/* ตารางข้อมูลเล็กๆ */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Calendar size={10} /> {t.borrowDate}</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(item.borrow_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Clock size={10} /> {t.dueDate}</p>
                          <p className={`text-xs font-bold ${isLate ? (item.is_longterm ? 'text-blue-500' : 'text-red-500') : 'text-orange-500'}`}>
                            {new Date(item.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}
                          </p>
                        </div>
                        <div className="col-span-2 pt-2 mt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.colVol}</span>
                          <span className="font-black text-sm text-slate-900 dark:text-white">{item.quantity} Unit(s)</span>
                        </div>
                      </div>

                      {/* 🚀 ปุ่ม Action แบ่งสีตามประเภทอุปกรณ์ */}
                      {item.status === 'active' && (
                        item.is_longterm ? (
                          <button
                            onClick={() => { setSelectedBorrow(item); setModalMode('checkin'); setShowReturnModal(true); }}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                          >
                            {t.checkInBtn}
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSelectedBorrow(item); setModalMode('return'); setShowReturnModal(true); }}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                          >
                            {t.execReturn}
                          </button>
                        )
                      )}
                      {item.status === 'pending_return' && (
                        <div className="w-full py-2.5 text-slate-500 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                          <Fingerprint size={12} className="animate-pulse" /> {t.processing}
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="py-16 flex flex-col items-center opacity-40 dark:opacity-20 text-center">
                    <HistoryIcon size={48} className="mb-3 text-slate-400" />
                    <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{t.noLogs}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 💻 DESKTOP VIEW (Table Layout) */}
          {(() => {
            const filteredHistory = selectedMonth === 'all' ? history : history.filter(item => {
              const d = new Date(item.borrow_date);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
            });
            return (
              <div className="hidden md:block overflow-x-auto custom-scrollbar relative z-10">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-orange-600 dark:text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <tr>
                      <th className="p-6 whitespace-nowrap">{t.colTime}</th>
                      <th className="p-6 whitespace-nowrap">{t.colAsset}</th>
                      <th className="p-6 text-center whitespace-nowrap">{t.colVol}</th>
                      <th className="p-6 text-center whitespace-nowrap">{t.colState}</th>
                      <th className="p-6 text-right whitespace-nowrap">{t.colCmd}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 font-medium transition-colors duration-300">
                    {filteredHistory.length > 0 ? filteredHistory.map((item) => {
                      const validImg = getImageUrl(item.img);
                      const rowKey = item.borrow_id || item.ID || item.id || Math.random().toString();
                      const isLate = new Date() > new Date(item.due_date) && item.status === 'active';

                      return (
                        <tr key={rowKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                          <td className="p-6">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{new Date(item.borrow_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                              {t.due}: <span className={isLate ? (item.is_longterm ? 'text-blue-500' : 'text-red-500') : 'text-orange-500'}>
                                {new Date(item.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}
                              </span>
                            </p>
                          </td>
                          <td className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative group-hover:border-orange-300 dark:group-hover:border-orange-500/30 transition-colors">
                              {validImg ? <img src={validImg} alt={item.electotronixPN} className="w-full h-full object-contain p-1 opacity-90 group-hover:opacity-100" /> : <Package size={20} className="text-slate-400 dark:text-slate-600" />}
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{item.electotronixPN}</p>
                              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{item.category}</p>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <span className="font-black text-xl text-slate-900 dark:text-white">{item.quantity}</span>
                          </td>
                          <td className="p-6 text-center">
                            {getStatusDisplay(item.status, item.due_date, item.is_longterm)}
                          </td>
                          <td className="p-6 text-right">

                            {/* 🚀 ปุ่ม Action แบ่งสีตามประเภทอุปกรณ์ (Desktop) */}
                            {item.status === 'active' && (
                              item.is_longterm ? (
                                <button
                                  onClick={() => { setSelectedBorrow(item); setModalMode('checkin'); setShowReturnModal(true); }}
                                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
                                >
                                  {t.checkInBtn}
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setSelectedBorrow(item); setModalMode('return'); setShowReturnModal(true); }}
                                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-orange-500/50 transition-all hover:-translate-y-0.5"
                                >
                                  {t.execReturn}
                                </button>
                              )
                            )}
                            {item.status === 'pending_return' && (
                              <span className="px-4 py-2 text-slate-500 bg-slate-50 dark:bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-end gap-2 w-fit ml-auto">
                                <Fingerprint size={14} className="animate-pulse" /> {t.processing}
                              </span>
                            )}
                            {item.status === 'returned' && (
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">{t.concluded}</span>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5" className="p-20 text-center">
                          <div className="flex flex-col items-center opacity-40 dark:opacity-20">
                            <HistoryIcon size={64} className="mb-4 text-slate-400" />
                            <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">{t.noLogs}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 🚀 Modal สแกนหลักฐาน (เปลี่ยนสีและเพิ่ม Dropdown ถ้าเป็นโหมดรายงานสถานะ) */}
      {showReturnModal && selectedBorrow && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xs sm:max-w-md rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-300 overflow-hidden">

            {/* เส้นสแกน (สีเปลี่ยนตามโหมด) */}
            <div className={`absolute top-0 left-0 w-full h-1 ${modalMode === 'checkin' ? 'bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.8)]'} animate-[scan_2s_ease-in-out_infinite]`}></div>

            <button onClick={() => { setShowReturnModal(false); setReturnImage(null); }} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 p-2 sm:p-2.5 rounded-full transition-colors z-20">
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>

            <h3 className={`text-lg sm:text-xl font-black mb-1 tracking-widest uppercase ${modalMode === 'checkin' ? 'text-blue-500 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`}>
              {modalMode === 'checkin' ? t.checkInTitle : t.evUpload}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs mb-4 sm:mb-6 font-bold truncate border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">{t.target}: {selectedBorrow.electotronixPN}</p>

            <form onSubmit={handleReturnSubmit} className="relative z-10">

              {/* 🚀 ให้มีตัวเลือกสภาพอุปกรณ์ทั้งตอนคืนและตอนเช็คอิน */}
              <div className="mb-4 sm:mb-6">
                <label className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{t.conditionLabel}</label>
                <select
                  className="w-full mt-2 p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-[1.5rem] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-orange-500 transition-colors"
                  value={assetCondition}
                  onChange={(e) => setAssetCondition(e.target.value)}
                >
                  <option value="good">{t.condGood}</option>
                  <option value="damaged">{t.condDamaged}</option>
                  <option value="lost">{t.condLost}</option>
                </select>
                {assetCondition !== 'good' && (
                  <p className="mt-2 text-[10px] font-bold text-red-500 animate-pulse">
                    {t.condWarning}
                  </p>
                )}
              </div>

              <div className="mb-6 sm:mb-8">
                <label className={`flex flex-col items-center justify-center w-full h-40 sm:h-56 border-2 border-dashed rounded-2xl sm:rounded-[1.5rem] cursor-pointer transition-colors group relative overflow-hidden ${modalMode === 'checkin' ? 'border-blue-200 hover:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 hover:border-orange-400'}`}>
                  {returnImage ? (
                    <img src={URL.createObjectURL(returnImage)} alt="Preview" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className={`w-10 h-10 sm:w-14 sm:h-14 mb-3 sm:mb-4 transition-colors ${modalMode === 'checkin' ? 'text-blue-300 group-hover:text-blue-500' : 'text-slate-400 group-hover:text-orange-500'}`} />
                      <p className={`mb-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${modalMode === 'checkin' ? 'text-blue-600' : 'text-slate-600 group-hover:text-orange-500'}`}>{t.initScanner}</p>
                      <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest mt-1 sm:mt-2">{t.capture}</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => setReturnImage(e.target.files[0])} />
                </label>
              </div>

              <button type="submit" className={`w-full py-3 sm:py-4 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg transition-all hover:-translate-y-1 active:translate-y-0 ${modalMode === 'checkin' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'}`}>
                {t.transmit}
              </button>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}