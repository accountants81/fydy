import React, { useState, useMemo } from "react";
import { Plus, X, Check, Clock, AlertTriangle, Calendar, Trash2, Edit3, Bell, CheckCircle2, Circle } from "lucide-react";
import { Reminder, AppTheme } from "../types";

interface RemindersViewProps {
  reminders: Reminder[];
  onAddReminder: (r: Omit<Reminder, "id" | "createdAt">) => void;
  onUpdateReminder: (id: string, updates: Partial<Reminder>) => void;
  onDeleteReminder: (id: string) => void;
  theme: AppTheme;
  triggerToast: (message: string, type?: "success" | "error") => void;
}

const PRIORITY_MAP = {
  high:   { label: "عاجل",   color: "text-red-600 bg-red-500/10 border-red-500/30",    dot: "bg-red-500",    icon: <AlertTriangle size={13}/> },
  medium: { label: "متوسط",  color: "text-amber-600 bg-amber-500/10 border-amber-500/30", dot: "bg-amber-500", icon: <Clock size={13}/> },
  low:    { label: "عادي",   color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-500", icon: <Bell size={13}/> },
};

const emptyForm = () => ({
  title: "", description: "", dueDate: "", priority: "medium" as Reminder["priority"], done: false,
});

export default function RemindersView({
  reminders, onAddReminder, onUpdateReminder, onDeleteReminder, theme, triggerToast
}: RemindersViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filterDone, setFilterDone] = useState<"all" | "pending" | "done">("all");

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = [...reminders];
    if (filterDone === "pending") list = list.filter(r => !r.done);
    if (filterDone === "done")    list = list.filter(r => r.done);
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [reminders, filterDone]);

  const pendingCount  = reminders.filter(r => !r.done).length;
  const overdueCount  = reminders.filter(r => !r.done && r.dueDate < today).length;
  const todayCount    = reminders.filter(r => !r.done && r.dueDate === today).length;

  const openAdd = () => {
    setEditingReminder(null);
    setForm(emptyForm());
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (r: Reminder) => {
    setEditingReminder(r);
    setForm({ title: r.title, description: r.description || "", dueDate: r.dueDate, priority: r.priority, done: r.done });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "العنوان مطلوب.";
    if (!form.dueDate)       e.dueDate = "تاريخ الاستحقاق مطلوب.";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editingReminder) {
      onUpdateReminder(editingReminder.id, { title: form.title.trim(), description: form.description.trim() || undefined, dueDate: form.dueDate, priority: form.priority, done: form.done });
      triggerToast("تم تعديل التذكير بنجاح ✅");
    } else {
      onAddReminder({ title: form.title.trim(), description: form.description.trim() || undefined, dueDate: form.dueDate, priority: form.priority, done: false });
      triggerToast("تم إضافة التذكير بنجاح ✅");
    }
    setIsModalOpen(false);
  };

  const toggleDone = (r: Reminder) => {
    onUpdateReminder(r.id, { done: !r.done });
    triggerToast(r.done ? "تم إعادة فتح التذكير" : "تم تحديد التذكير كمنجز ✅");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    } catch { return dateStr; }
  };

  const getDaysLabel = (dateStr: string, done: boolean) => {
    if (done) return null;
    const diff = Math.ceil((new Date(dateStr + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);
    if (diff < 0)  return <span className="text-xs font-bold text-red-500">متأخر بـ {Math.abs(diff)} يوم</span>;
    if (diff === 0) return <span className="text-xs font-bold text-amber-500">اليوم</span>;
    if (diff === 1) return <span className="text-xs font-bold text-amber-500">غداً</span>;
    return <span className="text-xs text-slate-400">بعد {diff} يوم</span>;
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-right ${
    theme === "dark" ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-500"
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className={`text-2xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>التذكيرات والمواعيد</h2>
          <p className={`text-sm mt-0.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            إدارة مواعيد الضرائب والتذكيرات المهمة
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} /> إضافة تذكير
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "قيد الانتظار", value: pendingCount, color: "bg-blue-500/10 text-blue-600", icon: <Clock size={18}/> },
          { label: "متأخر",        value: overdueCount, color: "bg-red-500/10 text-red-600",  icon: <AlertTriangle size={18}/> },
          { label: "اليوم",        value: todayCount,   color: "bg-amber-500/10 text-amber-600", icon: <Calendar size={18}/> },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>{s.icon}</div>
            <p className={`text-xs font-semibold mb-0.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
            <p className={`text-2xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className={`flex gap-2 p-1 rounded-xl w-fit ${theme === "dark" ? "bg-slate-900/60" : "bg-slate-100"}`}>
        {(["all", "pending", "done"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterDone(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${filterDone === f ? "bg-violet-600 text-white shadow" : theme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
          >
            {f === "all" ? "الكل" : f === "pending" ? "قيد الانتظار" : "المنجز"}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {filtered.length === 0 ? (
        <div className={`py-20 text-center rounded-2xl border ${theme === "dark" ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-white"}`}>
          <Bell className={`mx-auto mb-3 ${theme === "dark" ? "text-slate-700" : "text-slate-300"}`} size={40} />
          <p className={`font-semibold ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>لا توجد تذكيرات. اضغط "إضافة تذكير" للبدء.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const p = PRIORITY_MAP[r.priority];
            const isOverdue = !r.done && r.dueDate < today;
            return (
              <div
                key={r.id}
                className={`p-4 rounded-2xl border flex gap-4 items-start transition-all ${
                  r.done
                    ? theme === "dark" ? "bg-slate-900/20 border-slate-800/50 opacity-60" : "bg-slate-50 border-slate-100 opacity-60"
                    : isOverdue
                      ? theme === "dark" ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200"
                      : theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                }`}
              >
                {/* Checkbox */}
                <button onClick={() => toggleDone(r)} className="mt-0.5 shrink-0 cursor-pointer">
                  {r.done
                    ? <CheckCircle2 size={22} className="text-emerald-500" />
                    : <Circle size={22} className={`${theme === "dark" ? "text-slate-600" : "text-slate-300"} hover:text-violet-500 transition-colors`} />
                  }
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className={`font-bold text-sm leading-snug ${r.done ? "line-through" : ""} ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
                        {r.title}
                      </p>
                      {r.description && (
                        <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-slate-500" : "text-slate-500"}`}>{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${p.color}`}>
                        {p.icon}{p.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`flex items-center gap-1 text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                      <Calendar size={12} />
                      {formatDate(r.dueDate)}
                    </div>
                    {getDaysLabel(r.dueDate, r.done)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(r)} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}><Edit3 size={14} /></button>
                  <button onClick={() => { onDeleteReminder(r.id); triggerToast("تم حذف التذكير", "error"); }} className="p-1.5 rounded-lg cursor-pointer hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl text-right ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <div className={`flex items-center justify-between p-6 border-b ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <h3 className={`text-xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                {editingReminder ? "تعديل التذكير" : "إضافة تذكير جديد"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-xl cursor-pointer ${theme === "dark" ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>عنوان التذكير *</label>
                <input type="text" value={form.title} onChange={e => { setForm(f => ({...f, title: e.target.value})); setErrors(er => ({...er, title: ""})); }} placeholder="مثال: موعد تقديم الإقرار الضريبي" className={inputCls} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>وصف (اختياري)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="تفاصيل إضافية..." rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>تاريخ الاستحقاق *</label>
                  <input type="date" value={form.dueDate} onChange={e => { setForm(f => ({...f, dueDate: e.target.value})); setErrors(er => ({...er, dueDate: ""})); }} className={inputCls} />
                  {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>الأولوية</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value as Reminder["priority"]}))} className={inputCls}>
                    <option value="high">🔴 عاجل</option>
                    <option value="medium">🟡 متوسط</option>
                    <option value="low">🟢 عادي</option>
                  </select>
                </div>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <button onClick={() => setIsModalOpen(false)} className={`px-5 py-2.5 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>إلغاء</button>
              <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm cursor-pointer transition-all active:scale-95">
                {editingReminder ? "حفظ التعديلات" : "إضافة التذكير"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
