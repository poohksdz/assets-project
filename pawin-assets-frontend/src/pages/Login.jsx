// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, User, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🚀 โหลด Theme ตั้งแต่เปิดหน้าต่าง เพื่อป้องกันอาการหน้าขาววาบ
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = "#0F172A"; 
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = "#F8FAFC";
    }
    setTimeout(() => setPageLoaded(true), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', { 
        email, 
        password 
      });

      if (response.data) {
        localStorage.setItem('userInfo', JSON.stringify(response.data));
        
        toast.success(`Welcome, ${response.data.user.name}`);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid Credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-700">
      
      {/* 🌌 Ambient Background Effects (ลูกแก้วเรืองแสง) */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-orange-500/20 dark:bg-orange-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* 🪟 Glassmorphism Card */}
      <div className="max-w-md w-full mx-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/50 dark:border-slate-700/50 p-8 sm:p-10 relative z-10 transition-all duration-500">
        
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-24 h-24 flex items-center justify-center mb-4">
            <div className={`absolute inset-0 bg-orange-500/20 dark:bg-orange-500/30 blur-2xl rounded-full transition-all duration-700 ${isLoading ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`}></div>
            <img 
              src="/favicon.ico" 
              alt="PAWIN Logo" 
              className={`w-16 h-16 drop-shadow-xl relative z-10 transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)
                ${!pageLoaded ? 'rotate-[-360deg] scale-50 opacity-0' : ''}
                ${pageLoaded && !isLoading ? 'rotate-0 scale-100 opacity-100' : ''}
                ${isLoading ? '!rotate-[360deg] scale-110' : ''}
              `}
            />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-[900] tracking-tighter uppercase relative text-slate-900 dark:text-white transition-colors">
            PAWIN-<span className="text-orange-500">ASSETS</span>
          </h1>
          <div className="h-1.5 w-12 bg-orange-500 mt-4 rounded-full opacity-80 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
          
          <p className="text-slate-500 dark:text-slate-400 font-black mt-5 uppercase tracking-[0.3em] text-[9px] sm:text-[10px] transition-colors">
            Asset Management Solution
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-[0.1em] ml-1 transition-colors">
              Email / อีเมลผู้ใช้งาน
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors">
                <User size={18} strokeWidth={2.5} />
              </div>
              <input 
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-slate-950/50 rounded-2xl border border-transparent dark:border-slate-800 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500/30 dark:focus:border-orange-500/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 outline-none transition-all duration-300 disabled:opacity-50"
                placeholder="example@pawin.co.th"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-[0.1em] ml-1 transition-colors">
              Password / รหัสผ่าน
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors">
                <LockKeyhole size={18} strokeWidth={2.5} />
              </div>
              <input 
                type="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-slate-950/50 rounded-2xl border border-transparent dark:border-slate-800 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500/30 dark:focus:border-orange-500/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 outline-none transition-all duration-300 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full mt-2 relative overflow-hidden bg-slate-900 dark:bg-orange-500 hover:bg-black dark:hover:bg-orange-400 text-white dark:text-slate-950 font-[900] py-4 rounded-2xl shadow-xl dark:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.97] transition-all duration-300 uppercase tracking-widest text-xs
              ${isLoading ? 'cursor-not-allowed opacity-90 shadow-none' : ''}
            `}
          >
            <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              Sign In to System
            </span>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <Loader2 size={20} className="animate-spin text-white dark:text-slate-950" />
            </div>
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50 text-center transition-colors">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest transition-colors">
            Need assistance? 
            <a href="#" className="ml-2 text-orange-500 dark:text-orange-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Contact IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}