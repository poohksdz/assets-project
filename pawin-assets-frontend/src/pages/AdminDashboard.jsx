// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Package, Users, Edit3, TrendingDown, RefreshCw, ArrowUpRight, Database, Lock, ChevronLeft, ChevronRight, PackagePlus, Plus, X, Image as ImageIcon, UploadCloud, FileText, Search, Eye, ClipboardList, CheckCircle, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

// Dictionary แปลภาษาเฉพาะหน้า Admin Dashboard
const translations = {
  en: {
    pageTitle: "COMMAND CENTER",
    globalOverview: "GLOBAL OVERVIEW",
    onlineStatus: "Online",
    sysMonitorDesc: "Real-time system monitoring and tactical control interface.",
    syncing: "Syncing...",
    resyncAssets: "Resync Assets",
    totOperators: "Total Operators",
    assetDb: "Asset Database",
    activeDep: "Active Deployment",
    sysPenalties: "System Penalties",
    assetCtrl: "Asset Control",
    filterPn: "Filter P/N...",
    allTypes: "All Types",
    noAssets: "No assets match.",
    personnel: "Personnel",
    filterName: "Filter Name...",
    allStatus: "All",
    clear: "Clear",
    inDebt: "In Debt",
    noOperators: "No operators found.",
    sysAuditRep: "System Audit Report",
    exportDesc: "Export master asset database and current valuations in CSV format.",
    exportMod: "Export Data Module",
    tacDepLog: "Tactical Deployment Log",
    tacDesc: "Global tracking of assets currently in field operations.",
    searchOpPn: "Search operator or P/N...",
    active: "Active",
    pendingReturn: "Pending Return",
    colOpName: "Operator Name",
    colAssetId: "Asset ID",
    colQty: "QTY",
    colDue: "Due Date",
    colExec: "Execute",
    noTacData: "No tactical data found.",
    opDep: "OPERATOR DEPLOYMENT",
    clearanceView: "Clearance View",
    noActBorrows: "No active borrows.",
    due: "Due",
    pcs: "PCS",
    closeInsp: "Close Inspection",
    addNewAsset: "Add New Asset",
    editAsset: "Edit Asset", 
    browseFile: "Browse File",
    maxSize: "JPG, PNG (MAX 5MB)",
    partNum: "Part Number *",
    category: "Category *",
    quantity: "Quantity *",
    valThb: "Value (฿)",
    cancel: "Cancel",
    deployAsset: "Deploy Asset",
    saveChanges: "Save Changes", 
    deleteConfirm: "Are you sure you want to permanently delete",
    // 🚀 เพิ่มแปลภาษาสำหรับฟังก์ชัน Long-term
    isLongtermLabel: "Permanent / Long-term Asset",
    isLongtermDesc: "This item requires status check-in instead of a physical return."
  },
  th: {
    pageTitle: "ศูนย์บัญชาการ",
    globalOverview: "ภาพรวมระบบ",
    onlineStatus: "ออนไลน์",
    sysMonitorDesc: "ระบบตรวจสอบและควบคุมการทำงานแบบเรียลไทม์",
    syncing: "กำลังซิงค์...",
    resyncAssets: "รีซิงค์ข้อมูล",
    totOperators: "พนักงานทั้งหมด",
    assetDb: "จำนวนอุปกรณ์",
    activeDep: "กำลังถูกใช้งาน",
    sysPenalties: "ค่าปรับสะสม",
    assetCtrl: "จัดการอุปกรณ์",
    filterPn: "ค้นหา P/N...",
    allTypes: "ทุกประเภท",
    noAssets: "ไม่พบอุปกรณ์",
    personnel: "จัดการพนักงาน",
    filterName: "ค้นหาชื่อ...",
    allStatus: "ทั้งหมด",
    clear: "ปกติ",
    inDebt: "ติดหนี้",
    noOperators: "ไม่พบพนักงาน",
    sysAuditRep: "รายงานระบบ",
    exportDesc: "ส่งออกข้อมูลอุปกรณ์และมูลค่าทั้งหมดในรูปแบบไฟล์ CSV",
    exportMod: "ส่งออกข้อมูล",
    tacDepLog: "รายการที่ถูกเบิกใช้งาน",
    tacDesc: "ติดตามอุปกรณ์ทั้งหมดที่กำลังถูกเบิกใช้งานอยู่ในขณะนี้",
    searchOpPn: "ค้นหาผู้ยืม หรือ P/N...",
    active: "กำลังยืม",
    pendingReturn: "รอตรวจสอบคืน",
    colOpName: "ชื่อผู้ทำรายการ",
    colAssetId: "รหัสอุปกรณ์",
    colQty: "จำนวน",
    colDue: "กำหนดคืน",
    colExec: "คำสั่ง",
    noTacData: "ไม่มีรายการเบิกของ",
    opDep: "รายการเบิกของพนักงาน",
    clearanceView: "มุมมองผู้ดูแลระบบ",
    noActBorrows: "ไม่มีรายการค้างคืน",
    due: "กำหนด:",
    pcs: "ชิ้น",
    closeInsp: "ปิดหน้าต่าง",
    addNewAsset: "เพิ่มอุปกรณ์ใหม่",
    editAsset: "แก้ไขข้อมูลอุปกรณ์", 
    browseFile: "เลือกไฟล์",
    maxSize: "JPG, PNG (ไม่เกิน 5MB)",
    partNum: "รหัส P/N *",
    category: "หมวดหมู่ *",
    quantity: "จำนวน *",
    valThb: "มูลค่า (บาท)",
    cancel: "ยกเลิก",
    deployAsset: "เพิ่มข้อมูล",
    saveChanges: "บันทึกข้อมูล", 
    deleteConfirm: "คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้อย่างถาวร:",
    // 🚀 เพิ่มแปลภาษาสำหรับฟังก์ชัน Long-term
    isLongtermLabel: "อุปกรณ์ประจำตำแหน่ง (ระยะยาว)",
    isLongtermDesc: "อุปกรณ์ชิ้นนี้จะไม่ระบุวันคืน แต่จะใช้ระบบรายงานสถานะแทน"
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalAssets: 0, borrowedItems: 0, penalties: 0 });
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [assetSearch, setAssetSearch] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState(''); 
  const [borrowSearch, setBorrowSearch] = useState('');
  const [borrowStatus, setBorrowStatus] = useState(''); 

  const [selectedUserDeployment, setSelectedUserDeployment] = useState(null);
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);

  const [assetPage, setAssetPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const itemsPerPage = 4;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 🚀 เพิ่ม is_longterm ใน State เริ่มต้น
  const [newAsset, setNewAsset] = useState({
    electotronixPN: '', value: '', description: '', category: '', 
    subcategory: '', quantity: '', manufacture: '', position: '', footprint: '', img: '', is_longterm: false
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAssetData, setEditAssetData] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo?.user?.isAdmin) return navigate('/dashboard');

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const [statsRes, prodRes, userRes, borrowRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', config),
        axios.get('http://localhost:5000/api/assets', config),
        axios.get('http://localhost:5000/api/admin/users', config),
        axios.get('http://localhost:5000/api/admin/active-borrows', config) 
      ]);
      
      setStats(statsRes.data);
      setProducts(prodRes.data);
      setUsers(userRes.data);
      setActiveBorrows(borrowRes.data || []);
    } catch (error) { 
      toast.error('DATABASE_SYNC_ERROR: Data Retrieval Failed.'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const uniqueCategories = [...new Set(products.map(item => item.category).filter(Boolean))];

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchSearch = p.electotronixPN.toLowerCase().includes(assetSearch.toLowerCase());
        const matchCategory = assetCategory === '' || p.category === assetCategory;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        const scoreA = (getImageUrl(a.img) && a.fileExists !== false) ? 1 : 0;
        const scoreB = (getImageUrl(b.img) && b.fileExists !== false) ? 1 : 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.ID - a.ID;
      });
  }, [products, assetSearch, assetCategory]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase());
      let matchStatus = true;
      if (userStatus === 'DEBT') matchStatus = u.credit < 0;
      if (userStatus === 'CLEAR') matchStatus = u.credit >= 0;
      return matchSearch && matchStatus;
    });
  }, [users, userSearch, userStatus]);

  const filteredBorrows = useMemo(() => {
    return activeBorrows.filter(b => {
      const matchSearch = b.operator_name.toLowerCase().includes(borrowSearch.toLowerCase()) || 
                          b.electotronixPN.toLowerCase().includes(borrowSearch.toLowerCase());
      const matchStatus = borrowStatus === '' || b.status === borrowStatus;
      return matchSearch && matchStatus;
    });
  }, [activeBorrows, borrowSearch, borrowStatus]);

  const handleViewUserDeployment = async (user) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`http://localhost:5000/api/admin/user-borrows/${user._id}`, config);
      setSelectedUserDeployment({ ...user, items: data });
      setIsDepModalOpen(true);
    } catch (err) {
      toast.error('Failed to load deployment details.');
    }
  };

  const handleApproveReturn = async (borrowId, assetName, qty) => {
    if (!window.confirm(`[SYSTEM CONFIRM] Approve return of ${qty}x ${assetName} and restock?`)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      await axios.put('http://localhost:5000/api/admin/approve-return', { borrowId }, config);
      
      toast.success(`RESTOCK COMPLETED: ${assetName} (+${qty})`);
      fetchData(); 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'ERROR: Failed to process return.'); 
    }
  };

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["PN,Category,Quantity,Price"].join(",") + "\n"
      + products.map(p => `${p.electotronixPN},${p.category},${p.quantity},${p.price}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pawin_assets_report.csv");
    document.body.appendChild(link);
    link.click();
    toast.success('REPORT_READY: CSV file downloaded.');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      let imageUrlPath = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data } = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo.token}` }
        });
        imageUrlPath = data.image;
      }
      await axios.post('http://localhost:5000/api/assets', { ...newAsset, img: imageUrlPath }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      toast.success('ASSET_DEPLOYED_SUCCESS');
      setIsAddModalOpen(false);
      setImageFile(null); setImagePreview(null);
      // เคลียร์ฟอร์ม
      setNewAsset({
        electotronixPN: '', value: '', description: '', category: '', 
        subcategory: '', quantity: '', manufacture: '', position: '', footprint: '', img: '', is_longterm: false
      });
      fetchData();
    } catch (error) { toast.error('DEPLOYMENT_FAILED'); } finally { setIsUploading(false); }
  };

  // เปิดหน้าต่างแก้ไขข้อมูล (ดึงข้อมูลเก่ามาใส่ฟอร์ม)
  const openEditModal = (asset) => {
    // 🚀 เซ็ตค่าเริ่มต้นของ is_longterm (ถ้าไม่มีใน db ให้ถือว่าเป็น false)
    setEditAssetData({
      ...asset,
      is_longterm: asset.is_longterm === 1 || asset.is_longterm === true
    });
    setImagePreview(getImageUrl(asset.img));
    setImageFile(null);
    setIsEditModalOpen(true);
  };

  // ส่งข้อมูลที่แก้ไขไปบันทึก
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      let imageUrlPath = editAssetData.img;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data } = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo.token}` }
        });
        imageUrlPath = data.image;
      }

      await axios.put(`http://localhost:5000/api/assets/${editAssetData.ID}`, { ...editAssetData, img: imageUrlPath }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      toast.success('ASSET_UPDATED_SUCCESS');
      setIsEditModalOpen(false);
      setImageFile(null); setImagePreview(null);
      fetchData();
    } catch (error) { toast.error('UPDATE_FAILED'); } finally { setIsUploading(false); }
  };

  const handleDeleteAsset = async (id, name) => {
    if (!window.confirm(`${t.deleteConfirm} ${name}?`)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.delete(`http://localhost:5000/api/assets/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      toast.success('ASSET_DELETED_SUCCESS');
      fetchData();
    } catch (error) {
      toast.error('DELETE_FAILED');
    }
  };

  const handleEditQuantity = async (id, currentQty, name) => {
    const newQty = window.prompt(`ENTER NEW STOCK QUANTITY FOR: ${name}`, currentQty);
    if (newQty === null || isNaN(newQty)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.put(`http://localhost:5000/api/admin/product-quantity`, { productId: id, newQuantity: Number(newQty) }, { headers: { Authorization: `Bearer ${userInfo.token}` } });
      toast.success('INVENTORY_UPDATED');
      fetchData();
    } catch (err) { toast.error('ERROR: Stock update failed.'); }
  };

  const handleEditCredit = async (id, currentCredit, name) => {
    const newCredit = window.prompt(`MANIPULATE CREDITS FOR: ${name}`, currentCredit);
    if (newCredit === null || isNaN(newCredit)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.put(`http://localhost:5000/api/admin/update-credit`, { userId: id, newCredit: Number(newCredit) }, { headers: { Authorization: `Bearer ${userInfo.token}` } });
      toast.success('CLEARANCE_UPDATED');
      fetchData();
    } catch (err) { toast.error('ERROR: Credit sync failed.'); }
  };

  const paginatedAssets = filteredProducts.slice((assetPage - 1) * itemsPerPage, assetPage * itemsPerPage);
  const totalAssetPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  return (
    <MainLayout title={t.pageTitle}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 transition-colors duration-300">
            {t.globalOverview}
            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-sm dark:shadow-none transition-colors duration-300">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {t.onlineStatus}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium transition-colors duration-300">{t.sysMonitorDesc}</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm dark:shadow-lg active:scale-95">
          <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} /> {loading ? t.syncing : t.resyncAssets}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title={t.totOperators} value={stats?.totalUsers || 0} icon={<Users />} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-500/10" border="border-purple-200 dark:border-purple-500/20" />
            <StatCard title={t.assetDb} value={stats?.totalAssets || 0} icon={<Package />} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" border="border-blue-200 dark:border-blue-500/20" />
            <StatCard title={t.activeDep} value={stats?.borrowedItems || 0} icon={<ArrowUpRight />} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-500/10" border="border-orange-200 dark:border-orange-500/20" />
            <StatCard title={t.sysPenalties} value={`฿${Number(stats?.penalties || 0).toLocaleString()}`} icon={<TrendingDown />} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-500/10" border="border-red-200 dark:border-red-500/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset Control */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-xl flex flex-col h-[500px] transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors duration-300"><Database size={16} className="text-orange-500" /> {t.assetCtrl}</h2>
                <button onClick={() => { setImagePreview(null); setIsAddModalOpen(true); }} className="p-1.5 bg-orange-500 text-white dark:text-slate-950 rounded-lg hover:bg-orange-600 dark:hover:bg-orange-400 transition-all"><Plus size={16} /></button>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input type="text" placeholder={t.filterPn} value={assetSearch} onChange={(e) => { setAssetSearch(e.target.value); setAssetPage(1); }} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300" />
                </div>
                <select value={assetCategory} onChange={(e) => { setAssetCategory(e.target.value); setAssetPage(1); }} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 focus:border-orange-500 outline-none w-28 custom-scrollbar transition-colors duration-300">
                  <option value="">{t.allTypes}</option>
                  {uniqueCategories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                {paginatedAssets.length === 0 && <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 font-bold uppercase tracking-widest">{t.noAssets}</p>}
                {paginatedAssets.map(p => {
                  const validImg = getImageUrl(p.img);
                  const hasImage = validImg && p.fileExists !== false;

                  return (
                    <div key={p.ID} className="group flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-slate-700 transition-all shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 transition-colors duration-300">
                          {hasImage ? <img src={validImg} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} /> : <Package size={16} className="text-slate-400 dark:text-slate-600" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate transition-colors duration-300">{p.electotronixPN}</p>
                          <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase">฿{Number(p.price).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleEditQuantity(p.ID, p.quantity, p.electotronixPN)} className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors" title="Quick Update Stock"><PackagePlus size={12} /></button>
                        <button onClick={() => openEditModal(p)} className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white transition-colors" title="Edit Item Details"><Edit3 size={12} /></button>
                        <button onClick={() => handleDeleteAsset(p.ID, p.electotronixPN)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-colors" title="Delete Item"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase transition-colors duration-300">
                <button onClick={() => setAssetPage(prev => Math.max(prev - 1, 1))} disabled={assetPage === 1} className="disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span>{assetPage} / {totalAssetPages}</span>
                <button onClick={() => setAssetPage(prev => Math.min(prev + 1, totalAssetPages))} disabled={assetPage === totalAssetPages} className="disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* Personnel Clearance */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl flex flex-col h-[500px] transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors duration-300"><Lock size={16} className="text-orange-500" /> {t.personnel}</h2>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input type="text" placeholder={t.filterName} value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300" />
                </div>
                <select value={userStatus} onChange={(e) => { setUserStatus(e.target.value); setUserPage(1); }} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 focus:border-orange-500 outline-none w-24 transition-colors duration-300">
                  <option value="">{t.allStatus}</option>
                  <option value="CLEAR">{t.clear}</option>
                  <option value="DEBT">{t.inDebt}</option>
                </select>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                {paginatedUsers.length === 0 && <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 font-bold uppercase tracking-widest">{t.noOperators}</p>}
                {paginatedUsers.map(u => (
                  <div key={u._id} className="group flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate transition-colors duration-300">{u.name}</p>
                      <p className={`text-[10px] font-black uppercase ${u.credit < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Bal: ฿{Number(u.credit).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleViewUserDeployment(u)} className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-colors" title="View Active Borrows"><Eye size={12} /></button>
                      <button onClick={() => handleEditCredit(u._id, u.credit, u.name)} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-orange-500 hover:text-white transition-colors"><Edit3 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase transition-colors duration-300">
                <button onClick={() => setUserPage(prev => Math.max(prev - 1, 1))} disabled={userPage === 1} className="disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span>{userPage} / {totalUserPages}</span>
                <button onClick={() => setUserPage(prev => Math.min(prev + 1, totalUserPages))} disabled={userPage === totalUserPages} className="disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center text-center sticky top-8 transition-colors duration-300">
             <div className="w-20 h-20 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6 shadow-sm dark:shadow-inner transition-colors duration-300">
               <FileText size={32} className="text-slate-600 dark:text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight transition-colors duration-300">{t.sysAuditRep}</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium transition-colors duration-300">{t.exportDesc}</p>
             <button onClick={handleExportData} className="w-full bg-white dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-orange-500 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-orange-400 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm dark:shadow-lg group">
               <ArrowUpRight size={18} className="text-orange-500 dark:group-hover:text-slate-950" /> {t.exportMod}
             </button>
          </div>
        </div>
      </div>

      {/* GLOBAL DEPLOYMENT MONITOR */}
      <div className="mt-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-xl dark:shadow-2xl animate-in fade-in slide-in-from-bottom-6 transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight transition-colors duration-300">
              <ClipboardList className="text-orange-500" /> {t.tacDepLog}
            </h2>
            <p className="text-slate-500 dark:text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest transition-colors duration-300">{t.tacDesc}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
              <input type="text" placeholder={t.searchOpPn} value={borrowSearch} onChange={(e) => setBorrowSearch(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm dark:shadow-inner" />
            </div>
            <select value={borrowStatus} onChange={(e) => setBorrowStatus(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs uppercase font-bold text-slate-600 dark:text-slate-300 focus:border-orange-500 outline-none w-full sm:w-40 transition-colors duration-300">
              <option value="">{t.allStatus}</option>
              <option value="active">{t.active}</option>
              <option value="pending_return">{t.pendingReturn}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <tr>
                <th className="pb-4 px-4">{t.colOpName}</th>
                <th className="pb-4 px-4">{t.colAssetId}</th>
                <th className="pb-4 px-4 text-center">{t.colQty}</th>
                <th className="pb-4 px-4">{t.colDue}</th>
                <th className="pb-4 px-4 text-right">{t.colExec}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors duration-300">
              {filteredBorrows.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-slate-400 dark:text-slate-600 font-bold uppercase text-xs">{t.noTacData}</td></tr>
              ) : (
                filteredBorrows.map((b) => (
                  <tr key={b.borrow_id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-5 px-4 font-bold text-slate-800 dark:text-slate-200">{b.operator_name}</td>
                    <td className="py-5 px-4">
                      <p className="font-black text-orange-600 dark:text-orange-400 text-sm">{b.electotronixPN}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase">{b.category}</p>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className="bg-white dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-black text-slate-900 dark:text-white text-xs shadow-sm dark:shadow-none">{b.quantity}</span>
                    </td>
                    <td className="py-5 px-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                      {new Date(b.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}
                    </td>
                    <td className="py-5 px-4 text-right flex justify-end gap-3 items-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm dark:shadow-none ${b.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/20'}`}>{b.status === 'active' ? t.active : t.pendingReturn}</span>
                      
                      <button 
                        onClick={() => handleApproveReturn(b.borrow_id, b.electotronixPN, b.quantity)}
                        className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                        title="Approve Return & Restock"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: รายละเอียดการยืมของพนักงาน */}
      {isDepModalOpen && selectedUserDeployment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 dark:bg-black/90 backdrop-blur-md dark:backdrop-blur-lg p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden flex flex-col shadow-2xl transition-colors duration-300">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 transition-colors duration-300">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight transition-colors duration-300"><Eye className="text-purple-600 dark:text-purple-500" /> {t.opDep}</h2>
                <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{selectedUserDeployment.name} {t.clearanceView}</p>
              </div>
              <button onClick={() => setIsDepModalOpen(false)} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-2 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[50vh] custom-scrollbar space-y-4">
              {selectedUserDeployment.items.length === 0 ? (
                <p className="text-center py-8 text-slate-500 dark:text-slate-600 font-bold uppercase text-xs">{t.noActBorrows}</p>
              ) : (
                selectedUserDeployment.items.map((item, idx) => {
                  const validImg = getImageUrl(item.img);
                  const hasImage = validImg && item.fileExists !== false;

                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {hasImage ? <img src={validImg} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} /> : <Package size={18} className="text-slate-400 dark:text-slate-500" />}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-black text-sm transition-colors duration-300">{item.electotronixPN}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase mt-0.5">{t.due}: {new Date(item.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-black text-orange-600 dark:text-orange-400 text-lg">{item.quantity} <span className="text-[10px] text-slate-400 dark:text-slate-500">{t.pcs}</span></p>
                        <button 
                          onClick={() => {
                            setIsDepModalOpen(false); 
                            handleApproveReturn(item.borrow_id, item.electotronixPN, item.quantity);
                          }}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Approve Return"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
               <button onClick={() => setIsDepModalOpen(false)} className="w-full py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-300 dark:hover:bg-slate-700 transition-all shadow-sm dark:shadow-none">{t.closeInsp}</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: เพิ่มสินค้าใหม่ (รวมสวิตช์ is_longterm) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl transition-colors duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 transition-colors duration-300">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest"><PackagePlus size={20} className="text-orange-500" /> {t.addNewAsset}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="add-asset-form" onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 🚀 สวิตช์ตั้งค่า Long-term */}
                <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl flex justify-between items-center cursor-pointer" onClick={() => setNewAsset({...newAsset, is_longterm: !newAsset.is_longterm})}>
                  <div>
                    <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t.isLongtermLabel}</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t.isLongtermDesc}</p>
                  </div>
                  <div>
                    {newAsset.is_longterm ? <ToggleRight size={32} className="text-blue-500" /> : <ToggleLeft size={32} className="text-slate-300 dark:text-slate-600" />}
                  </div>
                </div>

                <div className="md:col-span-2 mb-2">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 border-dashed rounded-2xl p-4 transition-colors duration-300">
                    <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm dark:shadow-none">
                      {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />}
                    </div>
                    <div>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                      <label htmlFor="image-upload" className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2 shadow-sm dark:shadow-none"><UploadCloud size={16} /> {t.browseFile}</label>
                      <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-2">{t.maxSize}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.partNum}</label>
                  <input required type="text" value={newAsset.electotronixPN} onChange={(e) => setNewAsset({...newAsset, electotronixPN: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.category}</label>
                  <input required type="text" value={newAsset.category} onChange={(e) => setNewAsset({...newAsset, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.quantity}</label>
                  <input required type="number" value={newAsset.quantity} onChange={(e) => setNewAsset({...newAsset, quantity: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.valThb}</label>
                  <input type="number" step="0.01" value={newAsset.value} onChange={(e) => setNewAsset({...newAsset, value: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 transition-colors duration-300">
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase px-6 hover:text-slate-900 dark:hover:text-white transition-colors">{t.cancel}</button>
              <button type="submit" form="add-asset-form" disabled={isUploading} className="bg-orange-500 text-white dark:text-slate-950 px-8 py-3 rounded-xl font-black text-xs uppercase hover:bg-orange-600 dark:hover:bg-orange-400 active:scale-95 transition-all shadow-md dark:shadow-none">
                {isUploading ? t.syncing : t.deployAsset}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: แก้ไขข้อมูลอุปกรณ์ (รวมสวิตช์ is_longterm) */}
      {isEditModalOpen && editAssetData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl transition-colors duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 transition-colors duration-300">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest"><Edit3 size={20} className="text-orange-500" /> {t.editAsset}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="edit-asset-form" onSubmit={handleUpdateAsset} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 🚀 สวิตช์ตั้งค่า Long-term */}
                <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl flex justify-between items-center cursor-pointer" onClick={() => setEditAssetData({...editAssetData, is_longterm: !editAssetData.is_longterm})}>
                  <div>
                    <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t.isLongtermLabel}</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t.isLongtermDesc}</p>
                  </div>
                  <div>
                    {editAssetData.is_longterm ? <ToggleRight size={32} className="text-blue-500" /> : <ToggleLeft size={32} className="text-slate-300 dark:text-slate-600" />}
                  </div>
                </div>

                <div className="md:col-span-2 mb-2">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 border-dashed rounded-2xl p-4 transition-colors duration-300">
                    <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm dark:shadow-none">
                      {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />}
                    </div>
                    <div>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="edit-image-upload" />
                      <label htmlFor="edit-image-upload" className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2 shadow-sm dark:shadow-none"><UploadCloud size={16} /> {t.browseFile}</label>
                      <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-2">{t.maxSize}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.partNum}</label>
                  <input required type="text" value={editAssetData.electotronixPN} onChange={(e) => setEditAssetData({...editAssetData, electotronixPN: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.category}</label>
                  <input required type="text" value={editAssetData.category} onChange={(e) => setEditAssetData({...editAssetData, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.quantity}</label>
                  <input required type="number" value={editAssetData.quantity} onChange={(e) => setEditAssetData({...editAssetData, quantity: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.valThb}</label>
                  <input type="number" step="0.01" value={editAssetData.value} onChange={(e) => setEditAssetData({...editAssetData, value: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 transition-colors duration-300">
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase px-6 hover:text-slate-900 dark:hover:text-white transition-colors">{t.cancel}</button>
              <button type="submit" form="edit-asset-form" disabled={isUploading} className="bg-orange-500 text-white dark:text-slate-950 px-8 py-3 rounded-xl font-black text-xs uppercase hover:bg-orange-600 dark:hover:bg-orange-400 active:scale-95 transition-all shadow-md dark:shadow-none">
                {isUploading ? t.syncing : t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function StatCard({ title, value, icon, color, bg, border }) {
  return (
    <div className={`bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-lg`}>
      <div className={`w-14 h-14 rounded-2xl ${bg} ${border} border flex items-center justify-center shrink-0`}>
        {React.cloneElement(icon, { size: 24, className: color })}
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
         <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">{value}</h3>
      </div>
    </div>
  );
}