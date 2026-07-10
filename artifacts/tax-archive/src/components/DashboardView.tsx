import { Customer, AppTheme } from "../types";
import { Users, UserCheck, UserPlus, MapPin, ClipboardList, Calendar, TrendingUp } from "lucide-react";

interface DashboardViewProps {
  customers: Customer[];
  setView: (view: any) => void;
  setSelectedCustomerForEdit: (customer: Customer | null) => void;
  setIsAddEditModalOpen: (isOpen: boolean) => void;
  theme: AppTheme;
}

export default function DashboardView({
  customers,
  setView,
  theme
}: DashboardViewProps) {

  const totalCount = customers.length;
  const malesCount = customers.filter(c => c.gender === "ذكر").length;
  const femalesCount = customers.filter(c => c.gender === "أنثى").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const addedTodayCount = customers.filter(c => {
    if (!c.addedAt) return false;
    return c.addedAt.split("T")[0] === todayStr;
  }).length;

  const cityCounts: { [key: string]: number } = {};
  customers.forEach(c => {
    const city = c.city?.trim() || "غير محدد";
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  const cityList = Object.entries(cityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const lastFiveCustomers = [...customers]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return dateString; }
  };

  const colorMap: Record<string, string> = {
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    yellow: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    gray: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };

  const colorNameMap: Record<string, string> = {
    green: "أخضر",
    blue: "أزرق",
    red: "أحمر",
    yellow: "أصفر",
    gray: "رمادي",
  };

  const statCards = [
    { label: "إجمالي العملاء", value: totalCount, icon: <Users size={22} />, color: "from-emerald-600 to-teal-600", bg: "bg-emerald-500/10 text-emerald-600" },
    { label: "مضاف اليوم", value: addedTodayCount, icon: <UserPlus size={22} />, color: "from-blue-600 to-indigo-600", bg: "bg-blue-500/10 text-blue-600" },
    { label: "العملاء الذكور", value: malesCount, icon: <UserCheck size={22} />, color: "from-violet-600 to-purple-600", bg: "bg-violet-500/10 text-violet-600" },
    { label: "العملاء الإناث", value: femalesCount, icon: <UserCheck size={22} />, color: "from-pink-600 to-rose-600", bg: "bg-pink-500/10 text-pink-600" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border relative overflow-hidden ${
        theme === "dark"
          ? "bg-gradient-to-l from-slate-900 to-slate-950 border-slate-800"
          : "bg-gradient-to-l from-white to-slate-50 border-slate-100"
      }`}>
        <div className="absolute inset-0 bg-gradient-to-l from-emerald-600/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className={`text-2xl md:text-3xl font-extrabold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            مرحباً بك في لوحة تحكم أرشيف الضرائب 👋
          </h1>
          <p className={`text-sm md:text-base leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            استمتع بإدارة كاملة وسلسة لأرشيف العملاء والتحليل الذكي للبيانات. جميع بياناتك تُخزَّن محلياً على جهازك.
          </p>
          <button
            onClick={() => setView("customers")}
            className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-2 w-fit"
          >
            <Users size={16} />
            إدارة العملاء
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border transition-all duration-300 group ${
              theme === "dark"
                ? "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                : "bg-white border-slate-100 shadow-sm hover:shadow-md"
            }`}
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${card.bg}`}>
              {card.icon}
            </div>
            <p className={`text-xs font-semibold mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              {card.label}
            </p>
            <p className={`text-3xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Last 5 Customers */}
        <div className={`p-6 rounded-2xl border ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
          <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
            <Calendar className="text-emerald-600" size={20} />
            آخر 5 عملاء مُضافين
          </h3>
          {lastFiveCustomers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">لا يوجد عملاء بعد.</div>
          ) : (
            <div className="space-y-3">
              {lastFiveCustomers.map((c) => (
                <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${theme === "dark" ? "bg-slate-950/60" : "bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black border ${colorMap[c.color || "gray"] || colorMap.gray}`}>
                      {colorNameMap[c.color || "gray"]?.[0] || "—"}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{c.fullName}</p>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{c.city || "—"}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    {formatDate(c.addedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* City Distribution */}
        <div className={`p-6 rounded-2xl border ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
          <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
            <MapPin className="text-emerald-600" size={20} />
            العملاء حسب المدينة / القرية
          </h3>
          {cityList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">لا توجد بيانات مدن لعرضها.</div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {cityList.map((city, index) => {
                const percentage = totalCount > 0 ? Math.round((city.count / totalCount) * 100) : 0;
                const barColors = ["bg-emerald-600", "bg-emerald-500", "bg-emerald-400", "bg-slate-400"];
                return (
                  <div key={city.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{city.name}</span>
                      <span className={`font-mono text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{city.count} عملاء ({percentage}%)</span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColors[Math.min(index, barColors.length - 1)]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className={`p-4 rounded-2xl border flex items-center gap-3 ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
        <TrendingUp className="text-emerald-600 shrink-0" size={20} />
        <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
          إجمالي المنشآت / البيوت: <span className="font-black text-emerald-600">{customers.reduce((acc, c) => acc + (c.buildingsCount || 0), 0)}</span> منشأة عبر جميع العملاء.
        </p>
      </div>
    </div>
  );
}
