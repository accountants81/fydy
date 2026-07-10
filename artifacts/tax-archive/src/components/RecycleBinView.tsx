import React, { useState } from "react";
import { Trash2, RotateCcw, X, Search, AlertTriangle, XCircle } from "lucide-react";
import { Customer, AppTheme } from "../types";

interface RecycleBinViewProps {
  trash: Customer[];
  onRestoreCustomer: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onClearTrash: () => void;
  theme: AppTheme;
  triggerToast: (message: string, type?: "success" | "error") => void;
}

export default function RecycleBinView({
  trash,
  onRestoreCustomer,
  onPermanentDelete,
  onClearTrash,
  theme,
  triggerToast
}: RecycleBinViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredTrash = trash.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className={`text-2xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            سلة المهملات
          </h2>
          <p className={`text-sm mt-0.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            {trash.length} عميل في سلة المهملات
          </p>
        </div>
        {trash.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <XCircle size={16} />
            تفريغ السلة بالكامل
          </button>
        )}
      </div>

      <div className={`p-3 rounded-2xl border flex items-start gap-3 ${
        theme === "dark" ? "bg-red-950/10 border-red-950/40 text-red-400" : "bg-red-50 border-red-100 text-red-800"
      }`}>
        <AlertTriangle className="shrink-0 text-red-600 mt-0.5" size={18} />
        <p className="text-sm leading-relaxed">
          <span className="font-bold">تنبيه: </span>
          العملاء هنا عُزِلوا فقط — الحذف النهائي من هذا القسم يمسحهم تماماً ولا يمكن التراجع عنه.
        </p>
      </div>

      <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="relative">
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف في سلة المهملات..."
            className={`w-full pr-10 pl-4 py-2.5 rounded-xl border text-right text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
              theme === "dark"
                ? "bg-slate-950 border-slate-800 text-white focus:border-red-500"
                : "bg-slate-50 border-slate-200 text-slate-900 focus:border-red-500"
            }`}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${theme === "dark" ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
                <th className="p-4 text-center w-16">مسلسل</th>
                <th className="p-4">الاسم بالكامل</th>
                <th className="p-4">رقم الموبايل</th>
                <th className="p-4">الرقم القومي</th>
                <th className="p-4">المدينة/القرية</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${theme === "dark" ? "divide-slate-800/60" : "divide-slate-100"}`}>
              {filteredTrash.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    {trash.length === 0 ? "سلة المهملات فارغة تماماً." : "لا يوجد نتائج مطابقة للبحث."}
                  </td>
                </tr>
              ) : filteredTrash.map((c) => (
                <tr key={c.id} className={`transition-colors ${theme === "dark" ? "hover:bg-slate-900/40" : "hover:bg-slate-50/80"}`}>
                  <td className={`p-4 text-center font-mono font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`}>{c.serial}</td>
                  <td className={`p-4 font-bold ${theme === "dark" ? "text-slate-200 line-through opacity-60" : "text-slate-700 line-through opacity-60"}`}>{c.fullName}</td>
                  <td className={`p-4 font-mono ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{c.mobile}</td>
                  <td className={`p-4 font-mono text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{c.nationalId}</td>
                  <td className={`p-4 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{c.city || "—"}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          onRestoreCustomer(c.id);
                          triggerToast(`تم استعادة العميل "${c.fullName}" بنجاح.`);
                        }}
                        title="استعادة العميل"
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        onClick={() => setCustomerToDelete(c)}
                        title="حذف نهائي"
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors cursor-pointer"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permanent Delete Confirmation */}
      {customerToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl text-right ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-600 text-white rounded-2xl">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-red-600">حذف نهائي لا رجعة منه</h3>
              <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                هل أنت متأكد من الحذف النهائي للعميل <span className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>"{customerToDelete.fullName}"</span>؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="mt-6 flex flex-row-reverse gap-3">
              <button
                onClick={() => {
                  onPermanentDelete(customerToDelete.id);
                  triggerToast(`تم حذف العميل "${customerToDelete.fullName}" نهائياً.`, "error");
                  setCustomerToDelete(null);
                }}
                className="flex-1 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                نعم، احذف نهائياً
              </button>
              <button
                onClick={() => setCustomerToDelete(null)}
                className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-colors cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"}`}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl text-right ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-600 text-white rounded-2xl animate-bounce">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-red-600">تفريغ السلة بالكامل</h3>
              <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                سيتم حذف جميع <span className="font-bold text-red-500">{trash.length}</span> عميل نهائياً. هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className="mt-6 flex flex-row-reverse gap-3">
              <button
                onClick={() => { onClearTrash(); triggerToast("تم تفريغ سلة المهملات بالكامل.", "error"); setShowClearConfirm(false); }}
                className="flex-1 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-extrabold text-sm cursor-pointer"
              >
                نعم، فرّغ السلة
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className={`flex-1 py-3 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
