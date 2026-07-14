import React from "react";
import {
  X, Phone, MapPin, Building2, User, CreditCard, Lock,
  FileText, Link, Calendar, Edit3, Printer
} from "lucide-react";
import { Customer, AppTheme } from "../types";

interface CustomerDetailModalProps {
  customer: Customer;
  theme: AppTheme;
  onClose: () => void;
  onEdit: (c: Customer) => void;
}

const colorMap: Record<string, { badge: string; label: string }> = {
  green:  { badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", label: "أخضر (عادي)" },
  blue:   { badge: "bg-blue-500/10 text-blue-600 border-blue-500/30",         label: "أزرق (مستقر)" },
  red:    { badge: "bg-red-500/10 text-red-600 border-red-500/30",             label: "أحمر (هام جداً)" },
  yellow: { badge: "bg-amber-500/10 text-amber-600 border-amber-500/30",       label: "أصفر (مراجعة)" },
  gray:   { badge: "bg-slate-500/10 text-slate-600 border-slate-500/30",       label: "رمادي (أرشيف)" },
};

const Row = ({ icon, label, value, theme, mono = false }: { icon: React.ReactNode; label: string; value?: string | number; theme: AppTheme; mono?: boolean }) => {
  if (!value && value !== 0) return null;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"}`}>
      <span className={`mt-0.5 shrink-0 ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold mb-0.5 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
        <p className={`text-sm font-bold break-all ${mono ? "font-mono" : ""} ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{value}</p>
      </div>
    </div>
  );
};

export default function CustomerDetailModal({ customer: c, theme, onClose, onEdit }: CustomerDetailModalProps) {
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return d; }
  };

  const handlePrint = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <meta charset="UTF-8"/>
          <title>بيانات العميل - ${c.fullName}</title>
          <style>
            body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; padding: 30px; color: #1e293b; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 13px; }
            td:first-child { background: #f8fafc; font-weight: bold; width: 140px; color: #475569; }
            .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>${c.fullName}</h1>
          <p class="sub">رقم مسلسل: ${c.serial} | تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}</p>
          <table>
            <tr><td>رقم الموبايل</td><td>${c.mobile}</td></tr>
            <tr><td>الرقم القومي</td><td>${c.nationalId}</td></tr>
            <tr><td>كلمة السر</td><td>${c.password}</td></tr>
            ${c.gender ? `<tr><td>النوع</td><td>${c.gender}</td></tr>` : ""}
            ${c.city ? `<tr><td>المدينة/القرية</td><td>${c.city}</td></tr>` : ""}
            ${c.detailedAddress ? `<tr><td>العنوان بالتفصيل</td><td>${c.detailedAddress}</td></tr>` : ""}
            ${c.buildingsCount !== undefined ? `<tr><td>عدد المنشآت</td><td>${c.buildingsCount}</td></tr>` : ""}
            ${c.altNumbers?.filter(Boolean).length ? `<tr><td>أرقام بديلة</td><td>${c.altNumbers!.filter(Boolean).join(" - ")}</td></tr>` : ""}
            ${c.declarationLink ? `<tr><td>رابط الإقرار</td><td>${c.declarationLink}</td></tr>` : ""}
            ${c.notes ? `<tr><td>الملاحظات</td><td>${c.notes}</td></tr>` : ""}
            <tr><td>تاريخ الإضافة</td><td>${formatDate(c.addedAt)}</td></tr>
            <tr><td>آخر تعديل</td><td>${formatDate(c.lastEditedAt)}</td></tr>
          </table>
          <p class="footer">أرشيف الضرائب — طُبع بتاريخ ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
        </body>
      </html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(printContent);
    w.document.close();
    w.print();
  };

  const col = c.color ? colorMap[c.color] : null;

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 pt-[20px] bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl text-right flex flex-col max-h-[calc(100dvh-50px)] ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b shrink-0 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${theme === "dark" ? "bg-violet-500/20 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
              {c.fullName[0]}
            </div>
            <div>
              <h3 className={`text-xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{c.fullName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>#{c.serial}</span>
                {col && <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${col.badge}`}>{col.label}</span>}
                {c.gender && <span className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{c.gender}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} title="طباعة" className={`p-2 rounded-xl cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}><Printer size={18}/></button>
            <button onClick={() => onEdit(c)} title="تعديل" className="p-2 rounded-xl cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors"><Edit3 size={18}/></button>
            <button onClick={onClose} className={`p-2 rounded-xl cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}><X size={20}/></button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === "dark" ? "text-violet-400" : "text-violet-600"}`}>البيانات الأساسية</p>
          <Row icon={<Phone size={15}/>}    label="رقم الموبايل"    value={c.mobile}      theme={theme} mono />
          <Row icon={<CreditCard size={15}/>} label="الرقم القومي"  value={c.nationalId}  theme={theme} mono />
          <Row icon={<Lock size={15}/>}     label="كلمة السر"      value={c.password}    theme={theme} />
          <Row icon={<User size={15}/>}     label="النوع"          value={c.gender}      theme={theme} />

          {(c.city || c.detailedAddress || c.buildingsCount !== undefined) && (
            <>
              <p className={`text-xs font-bold uppercase tracking-widest mt-4 mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>بيانات إضافية</p>
              <Row icon={<MapPin size={15}/>}     label="المدينة / القرية"     value={c.city}            theme={theme} />
              <Row icon={<MapPin size={15}/>}     label="العنوان بالتفصيل"    value={c.detailedAddress} theme={theme} />
              <Row icon={<Building2 size={15}/>}  label="عدد المنشآت / البيوت" value={c.buildingsCount}  theme={theme} />
            </>
          )}

          {c.altNumbers?.filter(Boolean).length ? (
            <>
              <p className={`text-xs font-bold uppercase tracking-widest mt-4 mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>أرقام بديلة</p>
              {c.altNumbers!.filter(Boolean).map((n, i) => (
                <Row key={i} icon={<Phone size={15}/>} label={`رقم بديل ${i + 1}`} value={n} theme={theme} mono />
              ))}
            </>
          ) : null}

          {(c.declarationLink || c.notes) && (
            <>
              <p className={`text-xs font-bold uppercase tracking-widest mt-4 mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>روابط وملاحظات</p>
              {c.declarationLink && (
                <div className={`flex items-start gap-3 p-3 rounded-xl ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"}`}>
                  <Link size={15} className={`mt-0.5 shrink-0 ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`}/>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold mb-0.5 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>رابط الإقرار</p>
                    <a href={c.declarationLink} target="_blank" rel="noreferrer" className="text-sm font-bold text-violet-500 hover:underline break-all">{c.declarationLink}</a>
                  </div>
                </div>
              )}
              <Row icon={<FileText size={15}/>} label="الملاحظات" value={c.notes} theme={theme} />
            </>
          )}

          <p className={`text-xs font-bold uppercase tracking-widest mt-4 mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>تواريخ</p>
          <Row icon={<Calendar size={15}/>} label="تاريخ الإضافة" value={formatDate(c.addedAt)}       theme={theme} />
          <Row icon={<Calendar size={15}/>} label="آخر تعديل"     value={formatDate(c.lastEditedAt)}  theme={theme} />
        </div>
      </div>
    </div>
  );
}
