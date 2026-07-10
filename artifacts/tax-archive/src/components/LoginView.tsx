import React, { useState } from "react";
import { Lock, Mail, AlertTriangle, Moon, Sun, Eye, EyeOff, Sparkles } from "lucide-react";
import { AppTheme } from "../types";

interface LoginViewProps {
  onLogin: () => void;
  theme: AppTheme;
  toggleTheme: () => void;
  fixedPassword: string;
}

export default function LoginView({ onLogin, theme, toggleTheme, fixedPassword }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email.trim().toLowerCase() === "a12026@gmail.com" && password === fixedPassword) {
        onLogin();
      } else {
        setError("بيانات الدخول غير صحيحة. يرجى التحقق وإعادة المحاولة.");
      }
    }, 800);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 py-12 transition-colors duration-500 relative overflow-hidden ${
      theme === "dark"
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/20 text-slate-100"
        : "bg-gradient-to-br from-slate-50 via-white to-violet-50/30 text-slate-950"
    }`}>
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-500/10 dark:bg-violet-500/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-2xl border transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer ${
            theme === "dark"
              ? "bg-slate-900/80 backdrop-blur-md border-slate-800 text-amber-400 hover:bg-slate-800"
              : "bg-white/80 backdrop-blur-md border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-lg z-10 space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-violet-500/20 dark:bg-violet-500/30 blur-2xl rounded-3xl scale-125"></div>
            <img
              src="/logo.jpg"
              alt="أرشيف الضرائب"
              className="w-24 h-24 rounded-3xl object-cover shadow-2xl border-2 border-violet-500 mx-auto relative z-10 transform hover:scale-105 transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}>
              أرشيف الضرائب
            </h1>
            <p className={`text-sm mt-1 flex items-center justify-center gap-1.5 ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              <Sparkles size={13} className="text-violet-500" />
              نظام متكامل لإدارة الأرشيف الضريبي
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`p-6 md:p-8 rounded-3xl border shadow-2xl space-y-5 transition-all duration-300 ${
          theme === "dark"
            ? "bg-slate-900/80 backdrop-blur-xl border-slate-800"
            : "bg-white/90 backdrop-blur-xl border-slate-200"
        }`}>
          <div>
            <label className={`block text-sm font-bold mb-2 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
              البريد الإلكتروني
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                autoComplete="email"
                className={`w-full pr-10 pl-4 py-3 rounded-xl border text-right transition-all text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
                  theme === "dark"
                    ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500"
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
              كلمة المرور
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                className={`w-full pr-10 pl-10 py-3 rounded-xl border text-right transition-all text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
                  theme === "dark"
                    ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
              theme === "dark"
                ? "bg-red-950/30 border border-red-900/30 text-red-400"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
              loading
                ? "bg-violet-500/50 text-white cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 active:scale-95 text-white shadow-lg shadow-violet-500/20"
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>جاري التحقق...</span>
              </>
            ) : (
              "دخول إلى النظام"
            )}
          </button>
        </form>

        <p className={`text-center text-xs ${theme === "dark" ? "text-slate-600" : "text-slate-400"}`}>
          نظام مؤمن ومشفر — بياناتك محفوظة محلياً على جهازك فقط
        </p>
      </div>
    </div>
  );
}
