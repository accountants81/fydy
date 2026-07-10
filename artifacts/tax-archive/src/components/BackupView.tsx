import React, { useState, useRef } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2, Database, FileText } from "lucide-react";
import { Customer, AppTheme } from "../types";

interface BackupViewProps {
  customers: Customer[];
  trash: Customer[];
  onRestoreBackup: (data: { customers: Customer[]; trash: Customer[] }) => void;
  theme: AppTheme;
  triggerToast: (message: string, type?: "success" | "error") => void;
}

export default function BackupView({ customers, trash, onRestoreBackup, theme, triggerToast }: BackupViewProps) {
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<{ customers: Customer[]; trash: Customer[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      customers,
      trash,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    a.download = `archive-tax-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast("تم تحميل النسخة الاحتياطية بنجاح ✅");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      triggerToast("يرجى اختيار ملف JSON صالح.", "error");
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed.customers)) {
          triggerToast("الملف المختار غير صالح أو تالف.", "error");
          setIsLoading(false);
          return;
        }
        if (!Array.isArray(parsed.trash)) {
          parsed.trash = [];
        }
        // Validate each customer has the required fields
        const validCustomers = parsed.customers.filter(
          (c: any) => c && typeof c === "object" && typeof c.fullName === "string" && typeof c.mobile === "string"
        );
        const validTrash = parsed.trash.filter(
          (c: any) => c && typeof c === "object" && typeof c.fullName === "string" && typeof c.mobile === "string"
        );
        if (validCustomers.length !== parsed.customers.length) {
          triggerToast(`تم تصفية ${parsed.customers.length - validCustomers.length} سجل تالف من الملف.`, "error");
        }
        setPendingData({ customers: validCustomers, trash: validTrash });
        setRestoreConfirm(true);
      } catch {
        triggerToast("فشل قراءة الملف. تأكد أنه ملف JSON صالح.", "error");
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    if (!pendingData) return;
    setIsLoading(true);
    setTimeout(() => {
      onRestoreBackup(pendingData);
      setRestoreConfirm(false);
      setPendingData(null);
      setIsLoading(false);
      triggerToast("تم استعادة البيانات بنجاح ✅");
    }, 800);
  };

  const cardClass = `p-6 md:p-8 rounded-3xl border transition-all duration-300 ${
    theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className={`text-2xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          النسخ الاحتياطي
        </h2>
        <p className={`text-sm mt-0.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
          حافظ على بياناتك بنسخ احتياطية دورية
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Database size={20} />
          </div>
          <div>
            <p className={`text-xs font-semibold ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>إجمالي العملاء</p>
            <p className={`text-2xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{customers.length}</p>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-600">
            <FileText size={20} />
          </div>
          <div>
            <p className={`text-xs font-semibold ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>في سلة المهملات</p>
            <p className={`text-2xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{trash.length}</p>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className={cardClass}>
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <Download size={24} />
          </div>
          <div>
            <h3 className={`text-lg font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>تحميل نسخة احتياطية</h3>
            <p className={`text-sm mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              تصدير جميع بيانات التطبيق (العملاء + سلة المهملات) إلى ملف JSON
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="w-full md:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all cursor-pointer active:scale-95 flex items-center gap-2"
        >
          <Download size={18} />
          تحميل النسخة الاحتياطية الآن
        </button>
      </div>

      {/* Import */}
      <div className={cardClass}>
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0">
            <Upload size={24} />
          </div>
          <div>
            <h3 className={`text-lg font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>استعادة نسخة احتياطية</h3>
            <p className={`text-sm mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              استيراد ملف JSON لاستعادة البيانات — سيتم استبدال البيانات الحالية
            </p>
          </div>
        </div>
        <div className={`p-4 rounded-xl border mb-4 flex items-start gap-2 ${theme === "dark" ? "bg-amber-950/10 border-amber-900/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm">سيتم استبدال جميع البيانات الحالية بمحتوى الملف المستورد. تأكد من تحميل نسخة احتياطية أولاً.</p>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`w-full md:w-auto px-8 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer active:scale-95 flex items-center gap-2 ${
            isLoading
              ? "bg-blue-500/50 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري القراءة...</>
          ) : (
            <><Upload size={18} /> اختيار ملف الاستعادة</>
          )}
        </button>
      </div>

      {/* Confirm Restore Modal */}
      {restoreConfirm && pendingData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl text-right ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-extrabold">تأكيد الاستعادة</h3>
              <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                الملف يحتوي على <span className="font-bold text-blue-600">{pendingData.customers.length}</span> عميل و<span className="font-bold text-red-500">{pendingData.trash.length}</span> في السلة.
                هل تريد استبدال جميع البيانات الحالية؟
              </p>
            </div>
            <div className="mt-6 flex flex-row-reverse gap-3">
              <button onClick={confirmRestore} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm cursor-pointer">
                {isLoading ? "جاري الاستعادة..." : "نعم، استعد البيانات"}
              </button>
              <button onClick={() => { setRestoreConfirm(false); setPendingData(null); }} className={`flex-1 py-3 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
