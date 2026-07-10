import React, { useState } from "react";
import { Eye, EyeOff, Lock, Trash2, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";
import { AppTheme } from "../types";

interface SettingsViewProps {
  theme: AppTheme;
  fixedPassword: string;
  onChangePassword: (newPassword: string) => void;
  onResetAllData: () => void;
  showCountsInSidebar: boolean;
  onToggleShowCounts: () => void;
  triggerToast: (message: string, type?: "success" | "error") => void;
}

export default function SettingsView({
  theme,
  fixedPassword,
  onChangePassword,
  onResetAllData,
  showCountsInSidebar,
  onToggleShowCounts,
  triggerToast
}: SettingsViewProps) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError] = useState("");
  const [resetStep, setResetStep] = useState(0);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (!currentPass || !newPass || !confirmPass) { setPassError("يرجى ملء جميع الحقول."); return; }
    if (currentPass !== fixedPassword) { setPassError("كلمة المرور الحالية غير صحيحة."); return; }
    if (newPass.length < 4) { setPassError("كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل."); return; }
    if (newPass !== confirmPass) { setPassError("كلمة المرور الجديدة وتأكيدها غير متطابقتين."); return; }
    onChangePassword(newPass);
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
    triggerToast("تم تغيير كلمة المرور بنجاح ✅");
  };

  const cardClass = `p-6 rounded-2xl border transition-all ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;
  const inputClass = `w-full pr-10 pl-10 py-3 rounded-xl border text-right text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${
    theme === "dark" ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500"
  }`;

  const PasswordField = ({
    label, value, onChange, show, onToggle, placeholder
  }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string }) => (
    <div>
      <label className={`block text-sm font-bold mb-2 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none"><Lock size={16} /></span>
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
        <button type="button" onClick={onToggle} className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className={`text-2xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>الإعدادات</h2>
        <p className={`text-sm mt-0.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>إدارة إعدادات التطبيق والأمان</p>
      </div>

      {/* Change Password */}
      <div className={cardClass}>
        <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          <Lock className="text-violet-600" size={20} />
          تغيير كلمة المرور
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordField label="كلمة المرور الحالية" value={currentPass} onChange={setCurrentPass} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} placeholder="أدخل كلمة المرور الحالية" />
          <PasswordField label="كلمة المرور الجديدة" value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="أدخل كلمة المرور الجديدة (4 أحرف على الأقل)" />
          <PasswordField label="تأكيد كلمة المرور الجديدة" value={confirmPass} onChange={setConfirmPass} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="أعد إدخال كلمة المرور الجديدة" />
          {passError && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${theme === "dark" ? "bg-red-950/20 border border-red-900/30 text-red-400" : "bg-red-50 border border-red-200 text-red-700"}`}>
              <AlertTriangle size={15} />
              {passError}
            </div>
          )}
          <button type="submit" className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm cursor-pointer transition-all active:scale-95">
            حفظ كلمة المرور الجديدة
          </button>
        </form>
      </div>

      {/* Display Settings */}
      <div className={cardClass}>
        <h3 className={`text-lg font-bold mb-4 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>خيارات العرض</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>إظهار عدد العملاء في الشريط الجانبي</p>
            <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>يعرض الأرقام بجانب كل قسم في القائمة</p>
          </div>
          <button onClick={onToggleShowCounts} className="cursor-pointer transition-all hover:scale-105 active:scale-95">
            {showCountsInSidebar
              ? <ToggleRight size={36} className="text-violet-600" />
              : <ToggleLeft size={36} className={theme === "dark" ? "text-slate-600" : "text-slate-400"} />
            }
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={`p-6 rounded-2xl border ${theme === "dark" ? "bg-red-950/10 border-red-900/30" : "bg-red-50 border-red-200"}`}>
        <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${theme === "dark" ? "text-red-400" : "text-red-700"}`}>
          <AlertTriangle size={20} />
          منطقة الخطر
        </h3>
        <p className={`text-sm mb-4 ${theme === "dark" ? "text-red-400/70" : "text-red-600/80"}`}>
          مسح جميع البيانات وإعادة التطبيق إلى الحالة الافتراضية. لا يمكن التراجع عن هذا الإجراء.
        </p>
        <button
          onClick={() => setResetStep(1)}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm cursor-pointer transition-all active:scale-95 flex items-center gap-2"
        >
          <Trash2 size={16} />
          مسح جميع البيانات
        </button>
      </div>

      {/* Reset Step 1 */}
      {resetStep === 1 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-right">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-extrabold">هل أنت متأكد؟</h3>
              <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                هذا سيمسح جميع العملاء والإعدادات وسلة المهملات. لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="mt-6 flex flex-row-reverse gap-3">
              <button onClick={() => setResetStep(2)} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm cursor-pointer">متابعة</button>
              <button onClick={() => setResetStep(0)} className={`flex-1 py-3 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Step 2 */}
      {resetStep === 2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-right">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-600 text-white rounded-2xl animate-bounce"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-black text-red-600">تنبيه نهائي!</h3>
              <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                هذا الإجراء <span className="font-bold text-red-600 underline">لا يمكن الرجوع عنه أبداً</span> وسيؤدي لخسارة تامة لكافة البيانات غير المحفوظة خارجياً.
              </p>
            </div>
            <div className="mt-6 flex flex-row-reverse gap-3">
              <button
                onClick={() => { onResetAllData(); triggerToast("تم مسح جميع البيانات وإعادة الضبط.", "error"); setResetStep(0); }}
                className="flex-1 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-black text-sm cursor-pointer"
              >
                نعم، امسح كل شيء
              </button>
              <button onClick={() => setResetStep(0)} className={`flex-1 py-3 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>تراجع</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
