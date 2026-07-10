import React, { useState, useMemo } from "react";
import {
  Search, Plus, X, Trash2, Edit3, Copy, SlidersHorizontal,
  ChevronUp, ChevronDown, Phone, Building2, FileText, Link, CheckCircle2
} from "lucide-react";
import { Customer, AppTheme } from "../types";

interface CustomerManagementViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, "id" | "serial" | "addedAt" | "lastEditedAt">) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  theme: AppTheme;
  isAddEditModalOpen: boolean;
  setIsAddEditModalOpen: (open: boolean) => void;
  selectedCustomerForEdit: Customer | null;
  setSelectedCustomerForEdit: (c: Customer | null) => void;
  triggerToast: (message: string, type?: "success" | "error") => void;
}

type SortField = "serial" | "fullName" | "mobile" | "city" | "buildingsCount" | "addedAt";
type SortDir = "asc" | "desc";

const COLOR_OPTIONS = [
  { value: "green", label: "أخضر (عادي)", class: "bg-emerald-500" },
  { value: "blue", label: "أزرق (مستقر)", class: "bg-blue-500" },
  { value: "red", label: "أحمر (هام جداً)", class: "bg-red-500" },
  { value: "yellow", label: "أصفر (مراجعة)", class: "bg-amber-500" },
  { value: "gray", label: "رمادي (أرشيف)", class: "bg-slate-400" },
];

const colorBadge: Record<string, string> = {
  green: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  blue: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  red: "bg-red-500/10 text-red-700 border-red-500/30",
  yellow: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  gray: "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

const colorDot: Record<string, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
  yellow: "bg-amber-500",
  gray: "bg-slate-400",
};

const emptyForm = () => ({
  fullName: "", mobile: "", nationalId: "", password: "",
  city: "", detailedAddress: "", buildingsCount: "" as string | number,
  notes: "", gender: "" as "" | "ذكر" | "أنثى",
  altNumbers: [""] as string[], declarationLink: "", color: "" as Customer["color"] | "",
});

export default function CustomerManagementView({
  customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer,
  theme, isAddEditModalOpen, setIsAddEditModalOpen,
  selectedCustomerForEdit, setSelectedCustomerForEdit, triggerToast
}: CustomerManagementViewProps) {

  const [quickSearch, setQuickSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("serial");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isAdvFilterActive, setIsAdvFilterActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Advanced filters
  const [advName, setAdvName] = useState("");
  const [advMobile, setAdvMobile] = useState("");
  const [advCity, setAdvCity] = useState("");
  const [advNotes, setAdvNotes] = useState("");
  const [advGender, setAdvGender] = useState<"الكل" | "ذكر" | "أنثى">("الكل");
  const [advBuildingsOp, setAdvBuildingsOp] = useState<"الكل" | ">" | "<" | "=">("الكل");
  const [advBuildingsVal, setAdvBuildingsVal] = useState("");
  const [advDateFrom, setAdvDateFrom] = useState("");
  const [advDateTo, setAdvDateTo] = useState("");

  const openAdd = () => {
    setSelectedCustomerForEdit(null);
    setForm(emptyForm());
    setErrors({});
    setIsAddEditModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setSelectedCustomerForEdit(c);
    setForm({
      fullName: c.fullName, mobile: c.mobile, nationalId: c.nationalId, password: c.password,
      city: c.city || "", detailedAddress: c.detailedAddress || "",
      buildingsCount: c.buildingsCount ?? "",
      notes: c.notes || "", gender: c.gender || "",
      altNumbers: c.altNumbers?.length ? c.altNumbers : [""],
      declarationLink: c.declarationLink || "", color: c.color || "",
    });
    setErrors({});
    setIsAddEditModalOpen(true);
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "الاسم بالكامل مطلوب.";
    const mobileRegex = /^(010|011|012|015)\d{8}$/;
    if (!form.mobile.trim()) e.mobile = "رقم الموبايل مطلوب.";
    else if (!mobileRegex.test(form.mobile.trim())) e.mobile = "رقم غير صحيح. يجب أن يكون 11 رقماً ويبدأ بـ 010/011/012/015.";
    if (!form.nationalId.trim()) e.nationalId = "الرقم القومي مطلوب.";
    else if (!/^\d{14}$/.test(form.nationalId.trim())) e.nationalId = "الرقم القومي يجب أن يكون 14 رقماً بالضبط.";
    if (!form.password.trim()) e.password = "كلمة السر مطلوبة.";
    return e;
  };

  const handleSave = () => {
    const e = validateForm();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const data = {
      fullName: form.fullName.trim(),
      mobile: form.mobile.trim(),
      nationalId: form.nationalId.trim(),
      password: form.password.trim(),
      city: form.city.trim() || undefined,
      detailedAddress: form.detailedAddress.trim() || undefined,
      buildingsCount: form.buildingsCount !== "" ? Number(form.buildingsCount) : undefined,
      notes: form.notes.trim() || undefined,
      gender: (form.gender || undefined) as Customer["gender"],
      altNumbers: form.altNumbers.filter(n => n.trim()),
      declarationLink: form.declarationLink.trim() || undefined,
      color: (form.color || undefined) as Customer["color"],
    };

    if (selectedCustomerForEdit) {
      onUpdateCustomer(selectedCustomerForEdit.id, data);
      triggerToast(`تم تعديل بيانات "${data.fullName}" بنجاح ✅`);
    } else {
      onAddCustomer(data);
      triggerToast(`تم إضافة العميل "${data.fullName}" بنجاح ✅`);
    }
    setIsAddEditModalOpen(false);
    setSelectedCustomerForEdit(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const copyCustomer = (c: Customer) => {
    const text = [
      `الاسم: ${c.fullName}`,
      `الموبايل: ${c.mobile}`,
      `الرقم القومي: ${c.nationalId}`,
      c.city ? `المدينة: ${c.city}` : null,
      c.detailedAddress ? `العنوان: ${c.detailedAddress}` : null,
      c.buildingsCount ? `المنشآت: ${c.buildingsCount}` : null,
      c.gender ? `النوع: ${c.gender}` : null,
      c.notes ? `الملاحظة: ${c.notes}` : null,
      c.altNumbers?.length ? `أرقام إضافية: ${c.altNumbers.join(", ")}` : null,
      c.declarationLink ? `رابط الإقرار: ${c.declarationLink}` : null,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(c.id);
      triggerToast("تم نسخ بيانات العميل ✅");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (quickSearch.trim()) {
      const q = quickSearch.toLowerCase();
      list = list.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.notes || "").toLowerCase().includes(q)
      );
    }
    if (isAdvFilterActive) {
      if (advName) list = list.filter(c => c.fullName.toLowerCase().includes(advName.toLowerCase()));
      if (advMobile) list = list.filter(c => c.mobile.includes(advMobile));
      if (advCity) list = list.filter(c => (c.city || "").toLowerCase().includes(advCity.toLowerCase()));
      if (advNotes) list = list.filter(c => (c.notes || "").toLowerCase().includes(advNotes.toLowerCase()));
      if (advGender !== "الكل") list = list.filter(c => c.gender === advGender);
      if (advBuildingsOp !== "الكل" && advBuildingsVal !== "") {
        const val = Number(advBuildingsVal);
        list = list.filter(c => {
          const bc = c.buildingsCount ?? 0;
          if (advBuildingsOp === ">") return bc > val;
          if (advBuildingsOp === "<") return bc < val;
          if (advBuildingsOp === "=") return bc === val;
          return true;
        });
      }
      if (advDateFrom) list = list.filter(c => c.addedAt >= advDateFrom);
      if (advDateTo) list = list.filter(c => c.addedAt <= advDateTo + "T23:59:59");
    }
    list.sort((a, b) => {
      let av: any = a[sortField] ?? "";
      let bv: any = b[sortField] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [customers, quickSearch, isAdvFilterActive, advName, advMobile, advCity, advNotes, advGender, advBuildingsOp, advBuildingsVal, advDateFrom, advDateTo, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={14} className="opacity-20" />;
    return sortDir === "asc" ? <ChevronUp size={14} className="text-violet-500" /> : <ChevronDown size={14} className="text-violet-500" />;
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-right ${
    theme === "dark" ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-500"
  }`;

  const fieldErr = (key: string) => errors[key] ? (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><X size={11} />{errors[key]}</p>
  ) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className={`text-2xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>إدارة العملاء</h2>
          <p className={`text-sm mt-0.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            {filteredCustomers.length} من {customers.length} عميل
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} />
          إضافة عميل جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="flex gap-3 flex-wrap md:flex-nowrap">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none"><Search size={16} /></span>
            <input
              type="text"
              value={quickSearch}
              onChange={e => setQuickSearch(e.target.value)}
              placeholder="البحث بالاسم، رقم الموبايل، المدينة أو الملاحظات..."
              className={`w-full pr-10 pl-4 py-2.5 rounded-xl border text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${
                theme === "dark" ? "bg-slate-950 border-slate-800 text-white focus:border-violet-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-500"
              }`}
            />
            {quickSearch && <button onClick={() => setQuickSearch("")} className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"><X size={15} /></button>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdvancedSearchOpen(true)}
              className={`px-4 py-2.5 rounded-xl border font-bold text-sm flex items-center gap-2 cursor-pointer transition-all ${
                isAdvFilterActive
                  ? "bg-violet-600 border-violet-600 text-white"
                  : theme === "dark" ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal size={15} />
              بحث متقدم
              {isAdvFilterActive && <span className="bg-white text-violet-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>}
            </button>
            {isAdvFilterActive && (
              <button
                onClick={() => { setIsAdvFilterActive(false); setAdvName(""); setAdvMobile(""); setAdvCity(""); setAdvNotes(""); setAdvGender("الكل"); setAdvBuildingsOp("الكل"); setAdvBuildingsVal(""); setAdvDateFrom(""); setAdvDateTo(""); }}
                className="px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 text-sm font-semibold cursor-pointer"
              >
                إلغاء الفلتر
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${theme === "dark" ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold text-slate-400 uppercase ${theme === "dark" ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}>
                {[
                  { field: "serial" as SortField, label: "#", cls: "p-4 text-center w-12" },
                  { field: "fullName" as SortField, label: "الاسم بالكامل", cls: "p-4" },
                  { field: "mobile" as SortField, label: "رقم الموبايل", cls: "p-4" },
                  { field: "city" as SortField, label: "المدينة/القرية", cls: "p-4" },
                  { field: "buildingsCount" as SortField, label: "المنشآت", cls: "p-4 text-center" },
                  { field: "addedAt" as SortField, label: "تاريخ الإضافة", cls: "p-4" },
                ].map((col, i) => (
                  <th key={i} onClick={() => handleSort(col.field)} className={`${col.cls} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none`}>
                    <div className="flex items-center gap-1 justify-center">
                      <span>{col.label}</span>
                      <SortIcon field={col.field} />
                    </div>
                  </th>
                ))}
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${theme === "dark" ? "divide-slate-800/60" : "divide-slate-100"}`}>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    {customers.length === 0 ? "لا يوجد عملاء. اضغط 'إضافة عميل جديد' للبدء." : "لا توجد نتائج مطابقة للبحث."}
                  </td>
                </tr>
              ) : filteredCustomers.map((c) => (
                <tr key={c.id} className={`transition-colors ${theme === "dark" ? "hover:bg-slate-900/40" : "hover:bg-slate-50/80"}`}>
                  <td className={`p-4 text-center font-mono font-medium text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`}>{c.serial}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {c.color && <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorDot[c.color]}`} />}
                      <span className={`font-bold ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{c.fullName}</span>
                    </div>
                    {c.gender && <span className={`text-xs mt-0.5 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{c.gender}</span>}
                  </td>
                  <td className={`p-4 font-mono text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{c.mobile}</td>
                  <td className={`p-4 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{c.city || <span className="text-slate-300">—</span>}</td>
                  <td className={`p-4 text-center font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{c.buildingsCount ?? "—"}</td>
                  <td className={`p-4 text-xs font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    {new Date(c.addedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => openEdit(c)} title="تعديل" className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors cursor-pointer"><Edit3 size={14} /></button>
                      <button onClick={() => setCustomerToDelete(c)} title="حذف إلى سلة المهملات" className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                      <button onClick={() => copyCustomer(c)} title="نسخ البيانات" className={`p-2 rounded-lg transition-colors cursor-pointer ${copiedId === c.id ? "bg-violet-500/20 text-violet-600" : "bg-slate-500/10 hover:bg-slate-500/20 text-slate-600"}`}>
                        {copiedId === c.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[20px] bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl text-right flex flex-col mb-8 max-h-[calc(100dvh-90px)] ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <div className={`flex items-center justify-between p-6 border-b shrink-0 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <h3 className={`text-xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                {selectedCustomerForEdit ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
              </h3>
              <button onClick={() => setIsAddEditModalOpen(false)} className={`p-2 rounded-xl transition-colors cursor-pointer ${theme === "dark" ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme === "dark" ? "text-violet-400" : "text-violet-600"}`}>
                البيانات الإجبارية
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>الاسم بالكامل *</label>
                  <input type="text" value={form.fullName} onChange={e => { setForm(f => ({ ...f, fullName: e.target.value })); setErrors(er => ({ ...er, fullName: "" })); }} placeholder="مثال: أحمد محمد علي" className={inputCls} />
                  {fieldErr("fullName")}
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>رقم الموبايل *</label>
                  <input type="tel" value={form.mobile} onChange={e => { setForm(f => ({ ...f, mobile: e.target.value })); setErrors(er => ({ ...er, mobile: "" })); }} placeholder="01012345678" className={inputCls} dir="ltr" />
                  {fieldErr("mobile")}
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>الرقم القومي * (14 رقماً)</label>
                  <input type="text" value={form.nationalId} onChange={e => { setForm(f => ({ ...f, nationalId: e.target.value })); setErrors(er => ({ ...er, nationalId: "" })); }} placeholder="12345678901234" className={inputCls} dir="ltr" maxLength={14} />
                  {fieldErr("nationalId")}
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>كلمة السر *</label>
                  <input type="text" value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: "" })); }} placeholder="كلمة السر للعميل" className={inputCls} />
                  {fieldErr("password")}
                </div>
              </div>

              <div className={`border-t pt-4 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>البيانات الاختيارية</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>المدينة / القرية</label>
                    <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="مثال: بركة السبع، ميت غمر" className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>عدد المنشآت / البيوت</label>
                    <input type="number" min={0} value={form.buildingsCount} onChange={e => setForm(f => ({ ...f, buildingsCount: e.target.value }))} placeholder="مثال: 3" className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>النوع</label>
                    <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))} className={inputCls}>
                      <option value="">اختر النوع</option>
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>تحديد اللون / الأهمية</label>
                    <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value as any }))} className={inputCls}>
                      <option value="">اختر اللون</option>
                      {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>العنوان بالتفصيل</label>
                    <input type="text" value={form.detailedAddress} onChange={e => setForm(f => ({ ...f, detailedAddress: e.target.value }))} placeholder="مثال: شارع الجمهورية، بجوار مسجد النور" className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>رابط الإقرار</label>
                    <input type="url" value={form.declarationLink} onChange={e => setForm(f => ({ ...f, declarationLink: e.target.value }))} placeholder="https://..." className={inputCls} dir="ltr" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>الملاحظة</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات خاصة بالعميل..." rows={2} className={`${inputCls} resize-none`} />
                  </div>

                  {/* Alternative Numbers */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>أرقام بديلة</label>
                    <div className="space-y-2">
                      {form.altNumbers.map((num, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="tel"
                            value={num}
                            onChange={e => {
                              const arr = [...form.altNumbers];
                              arr[idx] = e.target.value;
                              setForm(f => ({ ...f, altNumbers: arr }));
                            }}
                            placeholder={`رقم بديل ${idx + 1}`}
                            className={`${inputCls} flex-1`}
                            dir="ltr"
                          />
                          {form.altNumbers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, altNumbers: f.altNumbers.filter((_, i) => i !== idx) }))}
                              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 cursor-pointer shrink-0"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, altNumbers: [...f.altNumbers, ""] }))}
                        className={`text-sm font-bold flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-xl border ${theme === "dark" ? "border-slate-700 hover:bg-slate-800 text-slate-400" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                      >
                        <Plus size={14} /> إضافة رقم آخر
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 shrink-0 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <button onClick={() => setIsAddEditModalOpen(false)} className={`px-5 py-2.5 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>إلغاء</button>
              <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm cursor-pointer transition-all active:scale-95">
                {selectedCustomerForEdit ? "حفظ التعديلات" : "إضافة العميل"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl text-right ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl"><Trash2 size={32} /></div>
              <h3 className="text-xl font-extrabold">نقل العميل إلى سلة المهملات</h3>
              <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                هل أنت متأكد من نقل العميل <span className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>"{customerToDelete.fullName}"</span> إلى سلة المهملات؟
              </p>
            </div>
            <div className="mt-6 flex flex-row-reverse gap-3">
              <button
                onClick={() => {
                  onDeleteCustomer(customerToDelete.id);
                  triggerToast(`تم نقل "${customerToDelete.fullName}" إلى سلة المهملات.`, "error");
                  setCustomerToDelete(null);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm cursor-pointer"
              >
                نعم، انقل إلى السلة
              </button>
              <button onClick={() => setCustomerToDelete(null)} className={`flex-1 py-3 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      {isAdvancedSearchOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl text-right overflow-y-auto max-h-[90vh] ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <div className={`flex items-center justify-between p-5 border-b ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <h3 className={`text-lg font-extrabold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                <SlidersHorizontal size={18} className="text-violet-600" />
                البحث المتقدم والفلترة
              </h3>
              <button onClick={() => setIsAdvancedSearchOpen(false)} className="p-2 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>الاسم</label>
                  <input type="text" value={advName} onChange={e => setAdvName(e.target.value)} placeholder="ابحث بالاسم" className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>رقم الموبايل</label>
                  <input type="tel" value={advMobile} onChange={e => setAdvMobile(e.target.value)} placeholder="01x..." className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>المدينة / القرية</label>
                  <input type="text" value={advCity} onChange={e => setAdvCity(e.target.value)} placeholder="المدينة" className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>النوع</label>
                  <select value={advGender} onChange={e => setAdvGender(e.target.value as any)} className={inputCls}>
                    <option value="الكل">الكل</option>
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>عدد المنشآت</label>
                  <div className="flex gap-2">
                    <select value={advBuildingsOp} onChange={e => setAdvBuildingsOp(e.target.value as any)} className={`${inputCls} w-20 flex-none`}>
                      <option value="الكل">الكل</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="=">=</option>
                    </select>
                    <input type="number" value={advBuildingsVal} onChange={e => setAdvBuildingsVal(e.target.value)} disabled={advBuildingsOp === "الكل"} placeholder="العدد" className={`${inputCls} flex-1`} />
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>الملاحظة</label>
                  <input type="text" value={advNotes} onChange={e => setAdvNotes(e.target.value)} placeholder="ابحث في الملاحظات" className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>من تاريخ</label>
                  <input type="date" value={advDateFrom} onChange={e => setAdvDateFrom(e.target.value)} className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>إلى تاريخ</label>
                  <input type="date" value={advDateTo} onChange={e => setAdvDateTo(e.target.value)} className={inputCls} dir="ltr" />
                </div>
              </div>
            </div>
            <div className={`p-5 border-t flex gap-3 justify-end ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <button
                onClick={() => { setAdvName(""); setAdvMobile(""); setAdvCity(""); setAdvNotes(""); setAdvGender("الكل"); setAdvBuildingsOp("الكل"); setAdvBuildingsVal(""); setAdvDateFrom(""); setAdvDateTo(""); setIsAdvFilterActive(false); setIsAdvancedSearchOpen(false); }}
                className={`px-4 py-2.5 rounded-xl border text-sm font-bold cursor-pointer ${theme === "dark" ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-700"}`}
              >
                إعادة ضبط
              </button>
              <button
                onClick={() => { setIsAdvFilterActive(true); setIsAdvancedSearchOpen(false); }}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm cursor-pointer active:scale-95"
              >
                تطبيق البحث
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
