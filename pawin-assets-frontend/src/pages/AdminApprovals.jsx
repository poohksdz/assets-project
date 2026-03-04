// src/pages/AdminApprovals.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import { FileSearch, CheckCircle, XCircle, Eye, X, Wallet, Tag, Info, AlertCircle, ShieldAlert, AlertTriangle, ArrowRightLeft, PackageCheck, ClipboardCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// 🌐 Dictionary สำหรับแปลภาษา
const translations = {
  en: {
    pageTitle: "DATABASE MODULE: APPROVALS",
    headerTitle: "Clearance Queue",
    headerDesc: "Action Required: Pending Requests",
    tabBorrows: "Pending Borrows",
    tabReturns: "Pending Returns",
    opBalance: "Operator / Balance",
    assetId: "Asset Identifier",
    qtyReq: "QTY Requested",
    creditDed: "Credit Deduction",
    evidence: "Evidence",
    execCmd: "Execute Command",
    credits: "CREDITS",
    unitVal: "Unit Value",
    stdReturn: "Standard Return",
    overduePen: "Overdue Penalty",
    inspect: "Inspect",
    reject: "Reject",
    approve: "Approve",
    queueClear: "Queue is Clear",
    appDescReturn: "Validate evidence & process credit deduction.",
    rejDescReturn: "Invalidate evidence & apply maximum penalty.",
    appDescBorrow: "Approve request & deduct stock from inventory.",
    rejDescBorrow: "Reject request & notify operator.",
    confApp: "Confirm Approval",
    confRej: "Confirm Rejection",
    consequences: "Consequences",
    abort: "Abort",
    execute: "Execute",
    visAnal: "Visual Evidence Analysis",
    verifyCond: "Verify asset condition before executing command",
    rec: "REC",
    date: "DATE",
    // 🚀 คำแปลสำหรับระบบ Check-in
    reqTypeCheckIn: "Status Check-in",
    reqTypeReturn: "Asset Return",
    condLabel: "Condition",
  },
  th: {
    pageTitle: "โมดูลฐานข้อมูล: การอนุมัติ",
    headerTitle: "คิวรอการตรวจสอบ",
    headerDesc: "จำเป็นต้องดำเนินการ: รายการรออนุมัติ",
    tabBorrows: "รออนุมัติเบิก (ออก)",
    tabReturns: "รอตรวจสอบคืน (เข้า)",
    opBalance: "ผู้ปฏิบัติงาน / ยอดเงิน",
    assetId: "รหัสอุปกรณ์",
    qtyReq: "จำนวนที่ขอ",
    creditDed: "หักเครดิต",
    evidence: "หลักฐาน",
    execCmd: "คำสั่ง",
    credits: "เครดิต",
    unitVal: "มูลค่าต่อชิ้น",
    stdReturn: "คืนปกติ",
    overduePen: "ค่าปรับล่าช้า",
    inspect: "ตรวจสอบ",
    reject: "ปฏิเสธ",
    approve: "อนุมัติ",
    queueClear: "ไม่มีรายการรอตรวจสอบ",
    appDescReturn: "ยืนยันหลักฐานและประมวลผลการหักเครดิต",
    rejDescReturn: "ปฏิเสธหลักฐานและคิดค่าปรับตามจริง",
    appDescBorrow: "อนุมัติคำขอและหักสต๊อกออกจากคลัง",
    rejDescBorrow: "ปฏิเสธคำขอและแจ้งเตือนผู้ปฏิบัติงาน",
    confApp: "ยืนยันการอนุมัติ",
    confRej: "ยืนยันการปฏิเสธ",
    consequences: "ผลที่จะเกิดขึ้น",
    abort: "ยกเลิก",
    execute: "ดำเนินการ",
    visAnal: "วิเคราะห์หลักฐานภาพถ่าย",
    verifyCond: "ตรวจสอบสภาพอุปกรณ์ก่อนสั่งการ",
    rec: "บันทึก",
    date: "วันที่",
    // 🚀 คำแปลสำหรับระบบ Check-in
    reqTypeCheckIn: "รายงานสถานะ",
    reqTypeReturn: "ขอคืนอุปกรณ์",
    condLabel: "สภาพแจ้ง",
  }
};

export default function AdminApprovals() {
  const [activeTab, setActiveTab] = useState('borrows');
  const [pendingReturns, setPendingReturns] = useState([]);
  const [pendingBorrows, setPendingBorrows] = useState([]); 
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, action: null, requestType: null });

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

  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) return navigate('/login');
      const userInfo = JSON.parse(storedUser);
      if (!userInfo.user.isAdmin) return navigate('/dashboard');

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const [returnsRes, borrowsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/borrow/pending', config),
        axios.get('http://localhost:5000/api/borrow/pending-borrows', config)
      ]);

      setPendingReturns(Array.isArray(returnsRes.data) ? returnsRes.data : []);
      setPendingBorrows(Array.isArray(borrowsRes.data) ? borrowsRes.data : []);
    } catch (error) { 
      toast.error('Connection Error'); 
    }
  };

  useEffect(() => {
    fetchData(); 
  }, [navigate]);

  const triggerConfirmation = (item, action, requestType) => {
    setConfirmModal({ isOpen: true, item, action, requestType });
  };

  const executeAction = async () => {
    const { item, action, requestType } = confirmModal;
    const id = item.id;

    setConfirmModal({ isOpen: false, item: null, action: null, requestType: null }); 

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      if (requestType === 'borrow') {
        setPendingBorrows(prev => prev.filter(i => i.id !== id));
        await axios.put(`http://localhost:5000/api/borrow/${id}/${action}-borrow`, {}, config);
        toast.success(action === 'approve' ? 'Deployment Approved. Stock updated.' : 'Deployment Rejected.');
      } else {
        setPendingReturns(prev => prev.filter(i => i.id !== id));
        await axios.put(`http://localhost:5000/api/borrow/${id}/${action}`, {}, config);
        
        // 🚀 แจ้งเตือนแยกข้อความตามประเภทของ (คืนของ vs รายงานสถานะ)
        if (item.is_longterm) {
           toast.success(action === 'approve' ? 'Check-in Verified. Due date extended.' : 'Check-in Rejected.');
        } else {
           toast.success(action === 'approve' ? 'Clearance Granted. Asset returned.' : 'Clearance Denied. Penalty applied.');
        }
      }
      
      fetchData();
    } catch (error) { 
      const errMsg = error.response?.data?.message || 'Command Failed. Please reload.';
      toast.error(`ERROR: ${errMsg}`); 
      fetchData(); 
    }
  };

  return (
    <MainLayout title={t.pageTitle}>
      <div className="max-w-7xl mx-auto pb-10 sm:pb-20 px-4 sm:px-0 animate-in fade-in duration-700">
        
        <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden mt-4 sm:mt-6 relative transition-colors duration-300">
          
          {/* Header & Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
            <div className="p-5 sm:p-8 pb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm transition-colors duration-300 shrink-0 ${activeTab === 'returns' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/30' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/30'}`}>
                  {activeTab === 'returns' ? <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" /> : <PackageCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">{t.headerTitle}</h2>
                  <p className={`text-[8px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 uppercase tracking-[0.1em] sm:tracking-[0.2em] animate-pulse ${activeTab === 'returns' ? 'text-red-600 dark:text-red-500' : 'text-orange-600 dark:text-orange-500'}`}>{t.headerDesc}</p>
                </div>
              </div>

              <div className="flex flex-row bg-slate-100 dark:bg-slate-950 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner w-full xl:w-auto">
                <button
                  onClick={() => setActiveTab('borrows')}
                  className={`flex-1 xl:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === 'borrows' 
                      ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-md' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <ArrowRightLeft size={14} className="sm:w-4 sm:h-4" /> <span className="truncate">{t.tabBorrows}</span>
                  {pendingBorrows.length > 0 && (
                    <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 bg-orange-500 text-white rounded-md text-[8px] sm:text-[9px]">{pendingBorrows.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('returns')}
                  className={`flex-1 xl:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === 'returns' 
                      ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-md' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <CheckCircle size={14} className="sm:w-4 sm:h-4" /> <span className="truncate">{t.tabReturns}</span>
                  {pendingReturns.length > 0 && (
                    <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 bg-red-500 text-white rounded-md text-[8px] sm:text-[9px]">{pendingReturns.length}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 📱 MOBILE VIEW (Card Layout) */}
          <div className="block md:hidden p-4 space-y-4 relative z-10">
            
            {/* MOBILE: PENDING BORROWS */}
            {activeTab === 'borrows' && (
              pendingBorrows.length > 0 ? pendingBorrows.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-col gap-3 transition-colors">
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-3">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{item.userName}</span>
                      <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">{t.date}: {new Date(item.borrow_date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-black text-xl text-slate-900 dark:text-white leading-none">{item.quantity}</span>
                      <span className="text-[8px] font-bold text-slate-500 mt-1">PCS</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">#{item.id} - {item.electotronixPN}</span>
                  </div>
                  <button 
                    onClick={() => setPreviewImage(getImageUrl(item.img))} 
                    disabled={!getImageUrl(item.img)}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-1"
                  >
                    <Eye size={14} /> {t.inspect}
                  </button>
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={() => triggerConfirmation(item, 'reject', 'borrow')} 
                      className="flex-1 py-3 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-black text-[10px] uppercase tracking-widest flex justify-center items-center gap-1.5 transition-all"
                    >
                      <XCircle size={14} /> {t.reject}
                    </button>
                    <button 
                      onClick={() => triggerConfirmation(item, 'approve', 'borrow')} 
                      className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex justify-center items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <CheckCircle size={14} /> {t.approve}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-16 flex flex-col items-center opacity-40 dark:opacity-20 text-center">
                  <FileSearch size={48} className="mb-3 text-slate-500 dark:text-slate-400" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">{t.queueClear}</p>
                </div>
              )
            )}

            {/* 🚀 MOBILE: PENDING RETURNS (รองรับ is_longterm) */}
            {activeTab === 'returns' && (
              pendingReturns.length > 0 ? pendingReturns.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-col gap-3 transition-colors">
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-3">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{item.userName}</span>
                      
                      {/* Badge ป้ายกำกับ */}
                      <div className="mt-1.5">
                        {item.is_longterm ? (
                           <span className="text-[8px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2 py-0.5 rounded border border-blue-200"><ClipboardCheck size={10} className="inline mb-0.5 mr-0.5"/> {t.reqTypeCheckIn}</span>
                        ) : (
                           <span className="text-[8px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200"><ArrowRightLeft size={10} className="inline mb-0.5 mr-0.5"/> {t.reqTypeReturn}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {item.penalty_fee > 0 ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-red-600 dark:text-red-500 font-black text-[10px] bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md border border-red-200 dark:border-red-500/30">
                            - ฿{item.penalty_fee.toLocaleString()}
                          </span>
                          <span className="text-[7px] text-red-500 font-black uppercase tracking-widest flex items-center gap-0.5"><AlertCircle size={8}/> {t.overduePen}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-[9px] bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-[0.1em]">
                          {t.stdReturn}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">#{item.id} - {item.electotronixPN}</span>
                    <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Tag size={10} className={item.is_longterm ? "text-blue-500" : "text-red-500"} /> 
                      {/* ถ้าเป็น check-in ให้โชว์สภาพของ ถ้าเป็นการคืนปกติให้โชว์ราคา */}
                      {item.is_longterm && item.asset_condition ? `${t.condLabel}: ${item.asset_condition}` : `${t.unitVal}: ฿${Number(item.productPrice || 0).toLocaleString()}`} 
                      <span className="text-red-400 ml-1">(x{item.quantity})</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => setPreviewImage(item.return_image)} 
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 mt-1"
                  >
                    <Eye size={14} /> {t.inspect}
                  </button>
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={() => triggerConfirmation(item, 'reject', 'return')} 
                      className="flex-1 py-3 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-black text-[10px] uppercase tracking-widest flex justify-center items-center gap-1.5 transition-all"
                    >
                      <XCircle size={14} /> {t.reject}
                    </button>
                    <button 
                      onClick={() => triggerConfirmation(item, 'approve', 'return')} 
                      className={`flex-1 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex justify-center items-center gap-1.5 active:scale-95 transition-all ${item.is_longterm ? 'bg-blue-600 border border-blue-500' : 'bg-red-600 border border-red-500'}`}
                    >
                      <CheckCircle size={14} /> {t.approve}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-16 flex flex-col items-center opacity-40 dark:opacity-20 text-center">
                  <FileSearch size={48} className="mb-3 text-slate-500 dark:text-slate-400" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">{t.queueClear}</p>
                </div>
              )
            )}
          </div>

          {/* 💻 DESKTOP VIEW (Table Layout) */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar relative z-10">
            <table className="w-full text-left min-w-[1000px]">
              <thead className={`text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 ${activeTab === 'returns' ? 'bg-red-50/50 dark:bg-slate-900/80 text-red-600 dark:text-red-400' : 'bg-orange-50/50 dark:bg-slate-900/80 text-orange-600 dark:text-orange-400'}`}>
                <tr>
                  <th className="p-6 whitespace-nowrap">{t.opBalance}</th>
                  <th className="p-6 whitespace-nowrap">{t.assetId}</th>
                  <th className="p-6 text-center whitespace-nowrap">{activeTab === 'returns' ? t.creditDed : t.qtyReq}</th>
                  <th className="p-6 text-center whitespace-nowrap">{activeTab === 'returns' ? t.evidence : 'Visual Data'}</th>
                  <th className="p-6 text-right whitespace-nowrap">{t.execCmd}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 font-medium transition-colors duration-300">
                
                {/* DESKTOP: PENDING BORROWS */}
                {activeTab === 'borrows' && (
                  pendingBorrows.length > 0 ? pendingBorrows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white text-base group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {item.userName}
                          </span>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Date: {new Date(item.borrow_date).toLocaleDateString()}</p>
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">#{item.id} - {item.electotronixPN}</span>
                        </div>
                      </td>

                      <td className="p-6 text-center">
                        <span className="font-black text-xl text-slate-900 dark:text-white">{item.quantity}</span> 
                        <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">PCS</span>
                      </td>

                      <td className="p-6 text-center">
                        <button 
                          onClick={() => setPreviewImage(getImageUrl(item.img))} 
                          disabled={!getImageUrl(item.img)}
                          className="px-5 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-500/50 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2 mx-auto transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                          <Eye size={14} className="group-hover/btn:scale-110 transition-transform" /> 
                          {t.inspect}
                        </button>
                      </td>

                      <td className="p-6 text-right space-x-3">
                        <button 
                          onClick={() => triggerConfirmation(item, 'reject', 'borrow')} 
                          className="px-5 py-3 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 hover:shadow-sm rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-white dark:bg-transparent"
                        >
                          <XCircle size={14} className="inline mr-1.5 mb-0.5"/> {t.reject}
                        </button>
                        <button 
                          onClick={() => triggerConfirmation(item, 'approve', 'borrow')} 
                          className="px-6 py-3 bg-orange-500 text-white dark:text-slate-950 hover:bg-orange-600 dark:hover:bg-orange-400 shadow-md rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-orange-400"
                        >
                          <CheckCircle size={14} className="inline mr-1.5 mb-0.5"/> {t.approve}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="p-24 text-center">
                        <div className="flex flex-col items-center opacity-40 dark:opacity-20">
                          <FileSearch size={64} className="mb-4 text-slate-500 dark:text-slate-400" />
                          <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-600 dark:text-slate-300">{t.queueClear}</p>
                        </div>
                      </td>
                    </tr>
                  )
                )}

                {/* 🚀 DESKTOP: PENDING RETURNS (รองรับ is_longterm) */}
                {activeTab === 'returns' && (
                  pendingReturns.length > 0 ? pendingReturns.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white text-base group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {item.userName}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            {item.is_longterm ? (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2.5 py-1 rounded border border-blue-200"><ClipboardCheck size={12} className="inline mb-0.5 mr-0.5"/> {t.reqTypeCheckIn}</span>
                            ) : (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-2.5 py-1 rounded border border-red-200"><ArrowRightLeft size={12} className="inline mb-0.5 mr-0.5"/> {t.reqTypeReturn}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">#{item.id} - {item.electotronixPN}</span>
                          <div className="flex items-center gap-2 mt-2">
                            <Tag size={12} className={item.is_longterm ? "text-blue-500" : "text-red-600 dark:text-red-500"} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                              {item.is_longterm && item.asset_condition ? `${t.condLabel}: ${item.asset_condition}` : `${t.unitVal}: ฿${Number(item.productPrice || 0).toLocaleString()}`} <span className="text-red-600/50 dark:text-red-400/50">(x{item.quantity})</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-6 text-center">
                        {item.penalty_fee > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-500 font-black bg-red-50 dark:bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 shadow-sm transition-colors duration-300">
                              <span>- ฿{item.penalty_fee.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-red-500 dark:text-red-400 animate-pulse">
                              <AlertCircle size={10} />
                              <span className="text-[9px] font-black uppercase tracking-[0.1em]">{t.overduePen}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-emerald-600 dark:text-emerald-400 font-black text-[9px] bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-[0.1em] shadow-sm transition-colors duration-300">
                              {t.stdReturn}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-6 text-center">
                        <button 
                          onClick={() => setPreviewImage(item.return_image)} 
                          className="px-5 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2 mx-auto transition-all shadow-sm active:scale-95 group/btn"
                        >
                          <Eye size={14} className="group-hover/btn:scale-110 transition-transform" /> 
                          {t.inspect}
                        </button>
                      </td>

                      <td className="p-6 text-right space-x-3">
                        <button 
                          onClick={() => triggerConfirmation(item, 'reject', 'return')} 
                          className="px-5 py-3 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 hover:border-red-300 hover:bg-red-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-white dark:bg-transparent"
                        >
                          <XCircle size={14} className="inline mr-1.5 mb-0.5"/> {t.reject}
                        </button>
                        <button 
                          onClick={() => triggerConfirmation(item, 'approve', 'return')} 
                          className={`px-6 py-3 text-white shadow-md rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${item.is_longterm ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' : 'bg-red-600 hover:bg-red-700 border-red-500'}`}
                        >
                          <CheckCircle size={14} className="inline mr-1.5 mb-0.5"/> {t.approve}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="p-24 text-center">
                        <div className="flex flex-col items-center opacity-40 dark:opacity-20">
                          <FileSearch size={64} className="mb-4 text-slate-500 dark:text-slate-400" />
                          <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-600 dark:text-slate-300">{t.queueClear}</p>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>

      {/* 🚀 TACTICAL CONFIRMATION MODAL (ปรับเงื่อนไขให้รองรับ is_longterm) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl sm:rounded-[2rem] w-full max-w-[90vw] sm:max-w-md shadow-2xl overflow-hidden transition-colors duration-300">
            
            <div className={`p-4 sm:p-6 border-b flex items-center gap-2 sm:gap-3 transition-colors duration-300 ${
              confirmModal.action === 'approve' 
                ? (confirmModal.requestType === 'borrow' ? 'bg-orange-50 border-orange-200' : (confirmModal.item?.is_longterm ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'))
                : 'bg-slate-100 border-slate-200 dark:bg-slate-800'
            }`}>
              {confirmModal.action === 'approve' ? (
                <ShieldAlert className={confirmModal.requestType === 'borrow' ? "text-orange-600" : (confirmModal.item?.is_longterm ? "text-blue-600" : "text-red-600")} size={20} />
              ) : (
                <AlertTriangle className="text-slate-600 dark:text-slate-400" size={20} />
              )}
              <h2 className={`text-sm sm:text-lg font-black uppercase tracking-widest ${
                confirmModal.action === 'approve' 
                  ? (confirmModal.requestType === 'borrow' ? 'text-orange-600' : (confirmModal.item?.is_longterm ? 'text-blue-600' : 'text-red-600'))
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {confirmModal.action === 'approve' ? t.confApp : t.confRej}
              </h2>
            </div>

            <div className="p-5 sm:p-8">
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-5 sm:mb-6 leading-relaxed">
                You are about to <span className={`font-black ${
                  confirmModal.action === 'approve' 
                    ? (confirmModal.requestType === 'borrow' ? 'text-orange-600' : (confirmModal.item?.is_longterm ? 'text-blue-600' : 'text-red-600'))
                    : 'text-slate-700 dark:text-slate-300'
                }`}>{confirmModal.action.toUpperCase()}</span> the {confirmModal.requestType} request for <span className="text-slate-900 dark:text-white font-bold">{confirmModal.item?.electotronixPN}</span> from operator <span className="text-slate-900 dark:text-white font-bold">{confirmModal.item?.userName}</span>.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 mb-2 sm:mb-6 transition-colors duration-300">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.consequences}:</p>
                <ul className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 space-y-2 font-medium">
                  {confirmModal.requestType === 'borrow' ? (
                    confirmModal.action === 'approve' ? (
                      <>
                        <li>• Asset status changed to <span className="text-orange-600 dark:text-orange-400 font-bold">Active Use</span></li>
                        <li>• Stock quantity <span className="text-red-600 dark:text-red-400 font-bold">Deducted (-{confirmModal.item.quantity})</span></li>
                      </>
                    ) : (
                      <>
                        <li>• Request will be <span className="text-red-600 dark:text-red-400 font-bold">Deleted</span></li>
                        <li>• Stock quantity remains <span className="text-emerald-600 dark:text-emerald-400 font-bold">Unchanged</span></li>
                      </>
                    )
                  ) : (
                    // 🚀 เงื่อนไขสำหรับแท็บคืนของ: แยกแบบคืนปกติ กับ แบบเช็คอิน
                    confirmModal.item?.is_longterm ? (
                      // แบบตรวจเช็คสถานะ (Check-in)
                      confirmModal.action === 'approve' ? (
                        <>
                          <li>• Evidence marked as <span className="text-blue-600 dark:text-blue-400 font-bold">Verified</span></li>
                          <li>• Asset status remains <span className="text-blue-600 dark:text-blue-400 font-bold">Active Use</span></li>
                          <li>• Due date will be <span className="text-emerald-600 dark:text-emerald-400 font-bold">Extended (+ Time)</span></li>
                        </>
                      ) : (
                        <>
                          <li>• Check-in Evidence marked as <span className="text-red-600 dark:text-red-400 font-bold">Invalid</span></li>
                          <li>• Operator must submit a new report</li>
                        </>
                      )
                    ) : (
                      // แบบคืนของปกติ (Return)
                      confirmModal.action === 'approve' ? (
                        <>
                          <li>• Asset status changed to <span className="text-emerald-600 dark:text-emerald-400 font-bold">Returned</span></li>
                          <li>• Asset quantity <span className="text-emerald-600 dark:text-emerald-400 font-bold">Restocked (+{confirmModal.item.quantity})</span></li>
                          {confirmModal.item?.penalty_fee > 0 && <li>• Operator credit <span className="text-red-600 dark:text-red-400 font-bold">Deducted (-฿{confirmModal.item.penalty_fee})</span></li>}
                        </>
                      ) : (
                        <>
                          <li>• Evidence marked as <span className="text-red-600 dark:text-red-400 font-bold">Invalid</span></li>
                          <li>• Asset status reverted to <span className="text-orange-600 dark:text-orange-400 font-bold">Active</span></li>
                          {confirmModal.item?.penalty_fee > 0 && <li>• Penalty <span className="text-red-600 dark:text-red-400 font-bold">Applied (-฿{confirmModal.item.penalty_fee})</span></li>}
                        </>
                      )
                    )
                  )}
                </ul>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex gap-2 sm:gap-3 transition-colors duration-300">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, item: null, action: null, requestType: null })} 
                className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm"
              >
                {t.abort}
              </button>
              <button 
                onClick={executeAction} 
                className={`flex-1 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg active:scale-95 ${
                  confirmModal.action === 'approve' 
                    ? (confirmModal.requestType === 'borrow' ? 'bg-orange-500 text-white' : (confirmModal.item?.is_longterm ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'))
                    : 'bg-slate-800 text-white'
                }`}
              >
                {confirmModal.action === 'approve' ? <CheckCircle size={14} className="sm:w-4 sm:h-4" /> : <XCircle size={14} className="sm:w-4 sm:h-4" />}
                {t.execute}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal สแกนดูรูป (ไม่ต้องแก้) */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/95 backdrop-blur-xl z-[500] flex items-center justify-center p-4 sm:p-6 transition-all duration-500">
          <div className="relative max-w-4xl w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="hidden sm:block absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-orange-500/80 pointer-events-none z-50"></div>
            <div className="hidden sm:block absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-orange-500/80 pointer-events-none z-50"></div>
            
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-50 bg-white/80 dark:bg-slate-800 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
              <span className="text-red-600 dark:text-red-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{t.rec}</span>
            </div>

            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute -top-12 right-0 sm:-top-14 text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 rounded-full shadow-md z-50"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
            
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden relative w-full flex justify-center">
              <img 
                src={previewImage} 
                alt="Evidence" 
                className="max-h-[60vh] sm:max-h-[75vh] object-contain rounded-xl opacity-95 dark:opacity-80" 
              />
            </div>
            
            <div className="mt-6 sm:mt-8 flex flex-col items-center bg-white/80 dark:bg-slate-900/50 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl backdrop-blur-md border border-slate-200/50 dark:border-slate-800 text-center">
               <p className="text-orange-600 dark:text-orange-500 font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.4em]">{t.visAnal}</p>
               <p className="text-slate-600 dark:text-slate-500 text-[8px] sm:text-[10px] font-bold mt-1 uppercase tracking-widest">{t.verifyCond}</p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}