import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Search, LayoutDashboard, ChevronLeft, ChevronRight, 
  X, Eye, Image as ImageIcon, ShoppingCart, ChevronDown,
  Package, Clock, RotateCcw, Wallet, Plus, Zap, Filter
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import CartDrawer from '../components/CartDrawer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const translations = {
  en: {
    pageTitle: "ASSET CATALOG",
    searchPlaceholder: "Search equipment, P/N, or specs...",
    allModules: "ALL CATEGORIES",
    online: "IN STOCK",
    offline: "OUT OF STOCK",
    acquire: "Acquire",
    activeAssets: "Active Borrows",
    pendingApp: "Pending",
    awaitingReturn: "Returning",
    totalCredit: "My Credit Balance",
  },
  th: {
    pageTitle: "แคตตาล็อกอุปกรณ์",
    searchPlaceholder: "ค้นหาอุปกรณ์, รหัส P/N หรือสเปค...",
    allModules: "ทุกหมวดหมู่",
    online: "พร้อมเบิก",
    offline: "ของหมด",
    acquire: "เบิกอุปกรณ์",
    activeAssets: "กำลังยืม",
    pendingApp: "รออนุมัติ",
    awaitingReturn: "รอส่งคืน",
    totalCredit: "เครดิตคงเหลือ",
  }
};

export default function Dashboard({ cartItems, setCartItems }) {
  const [assets, setAssets] = useState([]);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 
  const navigate = useNavigate();

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [borrowQty, setBorrowQty] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) return navigate('/login');
      const userParsed = JSON.parse(storedUser);
      setUserInfo(userParsed);

      const config = { headers: { Authorization: `Bearer ${userParsed.token}` } };
      const [resAssets, resHistory] = await Promise.all([
        axios.get('http://localhost:5000/api/assets', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/borrow/my-history', config).catch(() => ({ data: [] }))
      ]);
      setAssets(Array.isArray(resAssets.data) ? resAssets.data : []);
      setBorrowHistory(Array.isArray(resHistory.data) ? resHistory.data : []);
    } catch (err) { 
      console.error(err); 
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    if (!Array.isArray(borrowHistory)) return { active: 0, pending: 0, returns: 0, credit: 0 };
    return {
      active: borrowHistory.filter(b => b.status === 'active').length,
      pending: borrowHistory.filter(b => b.status === 'pending_approval').length,
      returns: borrowHistory.filter(b => b.status === 'pending_return').length,
      credit: userInfo?.user?.credit || 0,
    };
  }, [borrowHistory, userInfo]);

  const getImageUrl = (imgPath) => {
    if (!imgPath || imgPath === 'null' || imgPath === '-') return null;
    return imgPath.startsWith('http') ? imgPath : `http://localhost:5000/${imgPath.replace(/^\//, '')}`;
  };

  const uniqueCategories = [...new Set(assets.map(item => item.category).filter(Boolean))];

  const processedAssets = useMemo(() => {
    if (!Array.isArray(assets)) return [];
    return assets.filter(item => {
      const matchSearch = (item.electotronixPN || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.value || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === '' || item.category === selectedCategory;
      return matchSearch && matchCat;
    }).sort((a, b) => (b.fileExists ? 1 : 0) - (a.fileExists ? 1 : 0) || b.ID - a.ID);
  }, [assets, searchQuery, selectedCategory]);

  const currentItems = processedAssets.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const totalPages = Math.ceil(processedAssets.length / itemsPerPage) || 1;

  const handleConfirmBorrow = () => {
    if (borrowQty < 1 || borrowQty > selectedAsset.quantity) return toast.error("จำนวนไม่ถูกต้อง");
    if (stats.credit < 0) return toast.error("ไม่สามารถยืมได้เนื่องจากเครดิตติดลบ!");

    setCartItems(prev => {
      const idx = prev.findIndex(i => i.ID === selectedAsset.ID);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].borrowQty = Math.min(updated[idx].borrowQty + borrowQty, selectedAsset.quantity);
        return updated;
      }
      return [...prev, { ...selectedAsset, borrowQty }];
    });
    toast.success(`เพิ่มลงตะกร้าแล้ว`);
    setShowBorrowModal(false);
  };

  return (
    <MainLayout title={t.pageTitle}>
      <div className="max-w-[1600px] mx-auto pb-20 px-4 sm:px-0 animate-in fade-in duration-700">
        
        {/* 🚀 1. USER STATS (รองรับ Mobile Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
           <CompactStatCard title={t.activeAssets} val={stats.active} icon={<Package />} color="blue" />
           <CompactStatCard title={t.pendingApp} val={stats.pending} icon={<Clock />} color="orange" />
           <CompactStatCard title={t.awaitingReturn} val={stats.returns} icon={<RotateCcw />} color="emerald" />
           
           <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-col justify-between shadow-md relative overflow-hidden transition-all duration-500 hover:-translate-y-1.5 h-28 sm:h-36 ${stats.credit < 0 ? 'bg-gradient-to-br from-red-600 to-red-800 text-white animate-pulse' : 'bg-gradient-to-br from-slate-900 to-black dark:from-purple-900 dark:to-slate-900 text-white'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl sm:blur-3xl -translate-y-8 translate-x-8"></div>
              <div className="flex justify-between items-start relative z-10">
                 <div className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-md"><Wallet size={16} className="sm:w-5 sm:h-5" /></div>
                 {stats.credit < 0 && <span className="px-2 py-1 bg-red-950/50 text-red-200 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest">In Debt</span>}
              </div>
              <div className="mt-2 relative z-10">
                 <p className="text-[8px] sm:text-[9px] font-black text-white/60 uppercase tracking-widest mb-0.5 sm:mb-1">{t.totalCredit}</p>
                 <h2 className="text-xl sm:text-3xl font-black tracking-tighter">฿{stats.credit.toLocaleString()}</h2>
              </div>
           </div>
        </div>

        {/* 🚀 2. SEARCH & FILTER */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-8 relative z-30">
           
           <div className="relative w-full md:flex-1 group">
              <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10 w-4 h-4 sm:w-5 sm:h-5" />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                className="w-full bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-full pl-12 sm:pl-14 pr-5 sm:pr-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all shadow-sm" 
                value={searchQuery} 
                onChange={e => {setSearchQuery(e.target.value); setCurrentPage(1);}} 
              />
           </div>
           
           <div className="relative w-full md:w-auto min-w-[200px] md:min-w-[260px]" ref={categoryRef}>
              <button 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-full pl-12 sm:pl-14 pr-5 sm:pr-6 py-3.5 sm:py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all shadow-sm flex items-center justify-between group hover:border-orange-300 dark:hover:border-orange-500/50"
              >
                 <Filter className="absolute left-5 sm:left-6 text-slate-400 group-hover:text-orange-500 transition-colors w-4 h-4 sm:w-5 sm:h-5" />
                 <span className="truncate pr-4">{selectedCategory || t.allModules}</span>
                 <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180 text-orange-500' : ''} w-4 h-4`} />
              </button>

              <div className={`absolute top-full left-0 w-full mt-2 sm:mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-700/80 rounded-2xl sm:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-300 origin-top z-40 ${isCategoryOpen ? 'opacity-100 scale-y-100 translate-y-0 visible' : 'opacity-0 scale-y-90 -translate-y-4 invisible pointer-events-none'}`}>
                 <div className="p-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto custom-scrollbar">
                    <div 
                      onClick={() => { setSelectedCategory(''); setCurrentPage(1); setIsCategoryOpen(false); }}
                      className={`px-4 sm:px-6 py-3 sm:py-3.5 mb-1 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-3 ${selectedCategory === '' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === '' ? 'bg-orange-500 animate-pulse' : 'bg-transparent'}`}></div>
                      {t.allModules}
                    </div>
                    {uniqueCategories.map(c => (
                       <div 
                         key={c}
                         onClick={() => { setSelectedCategory(c); setCurrentPage(1); setIsCategoryOpen(false); }}
                         className={`px-4 sm:px-6 py-3 sm:py-3.5 mb-1 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-3 ${selectedCategory === c ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                       >
                         <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === c ? 'bg-orange-500 animate-pulse' : 'bg-transparent'}`}></div>
                         {c}
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* 🚀 3. PRODUCT GRID GALLERY */}
        {processedAssets.length === 0 ? (
           <div className="py-20 sm:py-32 text-center text-slate-400 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/20 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50">
              <Package size={48} className="mb-4 sm:mb-6 opacity-20 sm:w-16 sm:h-16" />
              <p className="font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm text-slate-500">{t.noMatch}</p>
           </div>
        ) : (
           <div key={`${selectedCategory}-${currentPage}-${searchQuery}`} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              {currentItems.map((item) => {
                 const isAvailable = item.quantity > 0;
                 return (
                   <div key={item.ID} className="group bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] p-2.5 sm:p-4 border border-slate-100 dark:border-slate-800 hover:border-orange-300 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden">
                      
                      {/* รูปภาพสินค้า */}
                      <div className="relative w-full aspect-square bg-slate-50/80 dark:bg-slate-950/50 rounded-xl sm:rounded-[2rem] flex items-center justify-center overflow-hidden mb-3 sm:mb-5">
                         <span className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 sm:px-3 sm:py-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full text-[7px] sm:text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest border border-slate-200/50 z-10 shadow-sm">
                            {item.category}
                         </span>
                         
                         {getImageUrl(item.img) ? (
                            <img src={getImageUrl(item.img)} className="w-[70%] h-[70%] sm:w-[75%] sm:h-[75%] object-contain group-hover:scale-110 transition-transform duration-700 ease-out relative z-0 drop-shadow-md sm:drop-shadow-xl" alt={item.electotronixPN} />
                         ) : (
                            <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-700 group-hover:scale-110 transition-transform duration-700" />
                         )}

                         {/* 🚀 Hover Actions (แก้ไขให้รองรับ Mobile: โชว์ปุ่มด้านล่างตลอดเวลาบนมือถือ แต่บน PC ให้ hover) */}
                         <div className="absolute inset-x-0 bottom-0 pb-2 md:pb-0 md:inset-0 bg-gradient-to-t from-slate-900/10 md:from-transparent to-transparent md:bg-slate-900/10 dark:md:bg-black/40 md:backdrop-blur-[2px] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center md:items-center gap-2 md:gap-4 z-20">
                            <button onClick={() => setDetailItem(item)} className="w-8 h-8 md:w-14 md:h-14 bg-white text-slate-900 rounded-lg md:rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-md md:shadow-xl" title="Quick Look">
                               <Eye className="w-4 h-4 md:w-[22px] md:h-[22px]" />
                            </button>
                            <button disabled={!isAvailable || stats.credit < 0} onClick={() => { setSelectedAsset(item); setBorrowQty(1); setShowBorrowModal(true); }} className="w-8 h-8 md:w-14 md:h-14 bg-orange-500 text-white rounded-lg md:rounded-2xl flex items-center justify-center hover:scale-110 hover:bg-orange-600 transition-transform shadow-md md:shadow-xl disabled:opacity-0 disabled:scale-50">
                               <Plus className="w-4 h-4 md:w-[26px] md:h-[26px]" />
                            </button>
                         </div>
                      </div>

                      {/* ข้อมูลสินค้า */}
                      <div className="px-1 sm:px-3 flex-1 flex flex-col justify-between mb-1 sm:mb-2">
                         <div>
                            <h3 className="font-black text-xs sm:text-base text-slate-900 dark:text-white uppercase tracking-tighter line-clamp-1 group-hover:text-orange-500 transition-colors">{item.electotronixPN}</h3>
                            <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed h-6 sm:h-8">{item.value || t.na}</p>
                         </div>
                         
                         <div className="mt-3 sm:mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                               <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                               <span className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest ${isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                  {isAvailable ? t.online : t.offline}
                               </span>
                            </div>
                            <div className="self-end sm:self-auto flex items-baseline bg-slate-100 dark:bg-slate-800/50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl">
                               <span className="font-black text-xs sm:text-lg text-slate-900 dark:text-white leading-none">{item.quantity}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                 );
              })}
           </div>
        )}

        {/* 🚀 Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 sm:mt-12 flex justify-center items-center gap-3 sm:gap-6 relative z-10">
             <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage===1} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-orange-500 hover:text-orange-500 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={18} /></button>
             <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] bg-white/60 dark:bg-slate-900/60 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full backdrop-blur-md shadow-sm">Page {currentPage} of {totalPages}</span>
             <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage===totalPages} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-orange-500 hover:text-orange-500 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-slate-900 dark:bg-orange-500 text-white p-4 sm:p-5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all z-[100] border-[3px] sm:border-4 border-white dark:border-slate-950 flex items-center gap-2 sm:gap-3 group">
        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
        {cartItems.length > 0 && <span className="bg-red-600 text-white text-[9px] sm:text-[10px] font-black w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full border border-white">{cartItems.length}</span>}
      </button>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems} 
        onRemoveItem={id => setCartItems(c => c.filter(i => i.ID !== id))} 
        onCheckoutSuccess={() => { setCartItems([]); setIsCartOpen(false); fetchData(); }} 
      />

      {/* 🚀 MODAL: QUICK LOOK (DETAIL) - ปรับ Layout ให้รองรับมือถือแบบเลื่อนได้ */}
      {detailItem && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl sm:rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden relative animate-in zoom-in-95 duration-300 max-h-[90vh] md:max-h-auto">
            
            <button onClick={() => setDetailItem(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 bg-slate-100 dark:bg-slate-800 text-slate-400 p-2 sm:p-2.5 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
            
            {/* โซนรูปภาพ (บนมือถือจะเตี้ยลง) */}
            <div className="w-full md:w-1/2 p-6 sm:p-12 h-[200px] sm:h-[300px] md:h-auto bg-slate-50 dark:bg-slate-950/50 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 relative shrink-0">
               <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent"></div>
               {getImageUrl(detailItem.img) ? <img src={getImageUrl(detailItem.img)} className="max-h-[140px] sm:max-h-[200px] md:max-h-[350px] object-contain drop-shadow-2xl relative z-10" alt="Item" /> : <ImageIcon size={60} className="sm:w-20 sm:h-20 opacity-10" />}
            </div>

            {/* โซนรายละเอียด (สามารถ Scroll เลื่อนได้บนมือถือ) */}
            <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              <div>
                 <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 border border-orange-200 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{detailItem.category}</span>
                 <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 sm:mt-5 tracking-tighter uppercase leading-tight">{detailItem.electotronixPN}</h2>
                 <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1 sm:mt-2">{detailItem.value}</p>
                 
                 <div className="mt-5 sm:mt-8 space-y-3 sm:space-y-4">
                   <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
                     <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5"><Zap size={12} className="sm:w-3.5 sm:h-3.5"/> Technical Specs</p>
                     <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{detailItem.description || "No description logged"}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-3 sm:gap-4">
                     <div className="bg-orange-50 dark:bg-orange-500/10 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-orange-200 text-center">
                       <p className="text-[8px] sm:text-[9px] font-black text-orange-500 uppercase tracking-widest mb-0.5 sm:mb-1">In Stock</p>
                       <p className="text-xl sm:text-3xl font-black text-orange-600">{detailItem.quantity}</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 text-center flex flex-col justify-center">
                       <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Location</p>
                       <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase">{detailItem.position || "N/A"}</p>
                     </div>
                   </div>
                 </div>
              </div>
              <button onClick={() => { setDetailItem(null); setSelectedAsset(detailItem); setBorrowQty(1); setShowBorrowModal(true); }} disabled={detailItem.quantity <= 0 || stats.credit < 0} className="w-full mt-6 sm:mt-8 py-4 sm:py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl sm:rounded-[2rem] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-xl">INITIATE ACQUISITION</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: BORROW QUANTITY */}
      {showBorrowModal && selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xs sm:max-w-sm rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base sm:text-lg font-black text-orange-500 mb-1 sm:mb-2 uppercase text-center tracking-widest">Set Quantity</h3>
            <p className="text-slate-500 text-[10px] sm:text-xs mb-6 sm:mb-8 text-center font-bold">{selectedAsset.electotronixPN}</p>
            <input type="number" min="1" max={selectedAsset.quantity} className="w-full p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl sm:rounded-[2rem] text-4xl sm:text-5xl font-black text-center outline-none text-slate-900 dark:text-white mb-5 sm:mb-6 border border-slate-200 focus:border-orange-500 transition-colors shadow-inner" value={borrowQty} onChange={(e) => setBorrowQty(Number(e.target.value))} />
            <div className="flex gap-2 sm:gap-3">
               <button onClick={() => setShowBorrowModal(false)} className="flex-1 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
               <button onClick={handleConfirmBorrow} className="flex-2 px-6 sm:px-8 py-3 sm:py-4 bg-slate-900 dark:bg-orange-500 text-white rounded-xl sm:rounded-[1.5rem] font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Confirm Add</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function CompactStatCard({ title, val, icon, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-200",
    orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 border-orange-200",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200",
  };
  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group h-28 sm:h-36">
      <div className={`absolute -right-4 -top-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full blur-2xl opacity-20 group-hover:scale-150 transition-transform duration-700 ${colors[color]}`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex items-center justify-center border bg-white dark:bg-slate-950 ${colors[color]}`}>{React.cloneElement(icon, { className: "w-4 h-4 sm:w-5 sm:h-5" })}</div>
        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-right max-w-[60px] sm:max-w-[80px] leading-tight mt-0.5 sm:mt-1">{title}</p>
      </div>
      <p className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none relative z-10">{val}</p>
    </div>
  );
}