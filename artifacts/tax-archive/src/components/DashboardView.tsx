import { Customer, Reminder, AppTheme } from "../types";
import { Users, UserCheck, UserPlus, MapPin, TrendingUp, Building2, Bell, AlertTriangle, BarChart3, CalendarDays } from "lucide-react";

interface DashboardViewProps {
  customers: Customer[];
  reminders: Reminder[];
  setView: (view: any) => void;
  setSelectedCustomerForEdit: (customer: Customer | null) => void;
  setIsAddEditModalOpen: (isOpen: boolean) => void;
  theme: AppTheme;
}

export default function DashboardView({ customers, reminders, setView, theme }: DashboardViewProps) {

  const totalCount    = customers.length;
  const malesCount    = customers.filter(c => c.gender === "ذكر").length;
  const femalesCount  = customers.filter(c => c.gender === "أنثى").length;
  const totalBuildings = customers.reduce((acc, c) => acc + (c.buildingsCount || 0), 0);

  const todayStr  = new Date().toISOString().split("T")[0];
  const thisMonth = todayStr.slice(0, 7);
  const thisYear  = todayStr.slice(0, 4);

  const addedToday     = customers.filter(c => c.addedAt?.split("T")[0] === todayStr).length;
  const addedThisMonth = customers.filter(c => c.addedAt?.startsWith(thisMonth)).length;
  const addedThisYear  = customers.filter(c => c.addedAt?.startsWith(thisYear)).length;

  const pendingReminders = reminders.filter(r => !r.done);
  const overdueReminders = reminders.filter(r => !r.done && r.dueDate < todayStr);
  const upcomingReminders = reminders
    .filter(r => !r.done && r.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const cityCounts: Record<string, number> = {};
  customers.forEach(c => {
    const city = c.city?.trim() || "غير محدد";
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  const cityList = Object.entries(cityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Color distribution
  const colorCounts: Record<string, number> = { green: 0, blue: 0, red: 0, yellow: 0, gray: 0, none: 0 };
  customers.forEach(c => { colorCounts[c.color || "none"] = (colorCounts[c.color || "none"] || 0) + 1; });

  // Top buildings customers
  const topByBuildings = [...customers]
    .filter(c => c.buildingsCount && c.buildingsCount > 0)
    .sort((a, b) => (b.buildingsCount || 0) - (a.buildingsCount || 0))
    .slice(0, 5);

  const lastFive = [...customers]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 5);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };

  const formatReminderDate = (d: string) => {
    try { return new Date(d + "T00:00:00").toLocaleDateString("ar-EG", { month: "short", day: "numeric" }); }
    catch { return d; }
  };

  const colorDot: Record<string, string> = { green: "bg-emerald-500", blue: "bg-blue-500", red: "bg-red-500", yellow: "bg-amber-500", gray: "bg-slate-400", none: "bg-slate-300" };
  const colorLabel: Record<string, string> = { green: "أخضر", blue: "أزرق", red: "أحمر", yellow: "أصفر", gray: "رمادي", none: "بدون لون" };

  const card = (dark: string, light: string) => theme === "dark" ? dark : light;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Welcome Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border relative overflow-hidden ${card("bg-gradient-to-l from-slate-900 to-slate-950 border-slate-800", "bg-gradient-to-l from-white to-slate-50 border-slate-100")}`}>
        <div className="absolute inset-0 bg-gradient-to-l from-violet-600/5 via-emerald-600/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold mb-1 ${card("text-white","text-slate-900")}`}>مرحباً بك في أرشيف الضرائب 👋</h1>
            <p className={`text-sm leading-relaxed ${card("text-slate-400","text-slate-500")}`}>
              إدارة كاملة لأرشيف العملاء الضريبي — جميع بياناتك محفوظة محلياً على جهازك.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setView("customers")} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95">
              <Users size={15}/> إدارة العملاء
            </button>
            <button onClick={() => setView("reminders")} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 border ${card("border-slate-700 hover:bg-slate-800 text-slate-300","border-slate-200 hover:bg-slate-50 text-slate-700")}`}>
              <Bell size={15}/> التذكيرات
              {overdueReminders.length > 0 && <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{overdueReminders.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي العملاء",  value: totalCount,      icon: <Users size={20}/>,      color: "from-violet-600 to-purple-600", bg: "bg-violet-500/10 text-violet-600" },
          { label: "مضاف هذا الشهر", value: addedThisMonth,  icon: <UserPlus size={20}/>,   color: "from-emerald-600 to-teal-600", bg: "bg-emerald-500/10 text-emerald-600" },
          { label: "إجمالي المنشآت", value: totalBuildings,  icon: <Building2 size={20}/>,  color: "from-blue-600 to-indigo-600",  bg: "bg-blue-500/10 text-blue-600" },
          { label: "تذكيرات معلقة",  value: pendingReminders.length, icon: <Bell size={20}/>, color: "from-amber-600 to-orange-600", bg: overdueReminders.length ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600" },
        ].map((s, i) => (
          <div key={i} className={`p-5 rounded-2xl border transition-all duration-300 ${card("bg-slate-900/40 border-slate-800 hover:border-slate-700","bg-white border-slate-100 shadow-sm hover:shadow-md")}`}>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${s.bg}`}>{s.icon}</div>
            <p className={`text-xs font-semibold mb-1 ${card("text-slate-400","text-slate-500")}`}>{s.label}</p>
            <p className={`text-3xl font-black ${card("text-white","text-slate-900")}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "مضاف اليوم",   value: addedToday,    sub: "عملاء" },
          { label: "هذا العام",    value: addedThisYear, sub: "عملاء" },
          { label: "ذكور",         value: malesCount,    sub: "عميل" },
          { label: "إناث",         value: femalesCount,  sub: "عميلة" },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border text-center ${card("bg-slate-900/30 border-slate-800","bg-white border-slate-100 shadow-sm")}`}>
            <p className={`text-2xl font-black ${card("text-white","text-slate-900")}`}>{s.value}</p>
            <p className={`text-xs font-semibold mt-0.5 ${card("text-slate-400","text-slate-500")}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* City Distribution */}
        <div className={`p-6 rounded-2xl border ${card("bg-slate-900/40 border-slate-800","bg-white border-slate-100 shadow-sm")}`}>
          <h3 className={`text-base font-bold mb-5 flex items-center gap-2 ${card("text-slate-100","text-slate-800")}`}>
            <MapPin className="text-violet-500" size={18}/> العملاء حسب المدينة
          </h3>
          {cityList.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات مدن.</p>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {cityList.map((city, i) => {
                const pct = totalCount > 0 ? Math.round((city.count / totalCount) * 100) : 0;
                const barCls = i === 0 ? "bg-violet-600" : i === 1 ? "bg-violet-500" : i === 2 ? "bg-violet-400" : "bg-slate-400";
                return (
                  <div key={city.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={card("text-slate-300","text-slate-700")}>{city.name}</span>
                      <span className={card("text-slate-500","text-slate-400")}>{city.count} ({pct}%)</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full ${card("bg-slate-800","bg-slate-100")}`}>
                      <div className={`h-full rounded-full transition-all duration-500 ${barCls}`} style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className={`p-6 rounded-2xl border ${card("bg-slate-900/40 border-slate-800","bg-white border-slate-100 shadow-sm")}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-base font-bold flex items-center gap-2 ${card("text-slate-100","text-slate-800")}`}>
              <Bell className="text-amber-500" size={18}/> تذكيرات قادمة
            </h3>
            <button onClick={() => setView("reminders")} className="text-xs font-bold text-violet-500 hover:text-violet-400 cursor-pointer">عرض الكل</button>
          </div>
          {overdueReminders.length > 0 && (
            <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 text-xs font-bold text-red-600 ${card("bg-red-500/10","bg-red-50")}`}>
              <AlertTriangle size={14}/> {overdueReminders.length} تذكير متأخر!
            </div>
          )}
          {upcomingReminders.length === 0 && overdueReminders.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">لا توجد تذكيرات معلقة.</p>
          ) : (
            <div className="space-y-2">
              {upcomingReminders.map(r => {
                const isToday = r.dueDate === todayStr;
                return (
                  <div key={r.id} className={`flex items-center justify-between p-3 rounded-xl ${card("bg-slate-950/60","bg-slate-50")}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${r.priority === "high" ? "bg-red-500" : r.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"}`}/>
                      <p className={`text-sm font-semibold truncate ${card("text-slate-200","text-slate-700")}`}>{r.title}</p>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ml-2 ${isToday ? "text-amber-500" : card("text-slate-500","text-slate-400")}`}>
                      {isToday ? "اليوم" : formatReminderDate(r.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Customers by Buildings */}
        <div className={`p-6 rounded-2xl border ${card("bg-slate-900/40 border-slate-800","bg-white border-slate-100 shadow-sm")}`}>
          <h3 className={`text-base font-bold mb-5 flex items-center gap-2 ${card("text-slate-100","text-slate-800")}`}>
            <Building2 className="text-blue-500" size={18}/> أعلى 5 عملاء بالمنشآت
          </h3>
          {topByBuildings.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">لم يُسجَّل بعد عملاء بمنشآت.</p>
          ) : (
            <div className="space-y-2.5">
              {topByBuildings.map((c, i) => {
                const maxB = topByBuildings[0].buildingsCount || 1;
                const pct = Math.round(((c.buildingsCount || 0) / maxB) * 100);
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs w-5 text-center ${card("text-slate-500","text-slate-400")}`}>{i+1}</span>
                        <span className={`font-semibold ${card("text-slate-200","text-slate-700")}`}>{c.fullName}</span>
                        {c.city && <span className={`text-xs ${card("text-slate-500","text-slate-400")}`}>({c.city})</span>}
                      </div>
                      <span className={`font-black text-blue-600`}>{c.buildingsCount}</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full ${card("bg-slate-800","bg-slate-100")}`}>
                      <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Additions */}
        <div className={`p-6 rounded-2xl border ${card("bg-slate-900/40 border-slate-800","bg-white border-slate-100 shadow-sm")}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-base font-bold flex items-center gap-2 ${card("text-slate-100","text-slate-800")}`}>
              <CalendarDays className="text-emerald-500" size={18}/> آخر 5 عملاء مُضافين
            </h3>
            <button onClick={() => setView("customers")} className="text-xs font-bold text-violet-500 hover:text-violet-400 cursor-pointer">عرض الكل</button>
          </div>
          {lastFive.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">لا يوجد عملاء بعد.</p>
          ) : (
            <div className="space-y-2.5">
              {lastFive.map(c => (
                <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${card("bg-slate-950/60","bg-slate-50")}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {c.color && <span className={`w-2 h-2 rounded-full shrink-0 ${colorDot[c.color]}`}/>}
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${card("text-slate-100","text-slate-800")}`}>{c.fullName}</p>
                      <p className={`text-xs ${card("text-slate-500","text-slate-400")}`}>{c.city || "—"}</p>
                    </div>
                  </div>
                  <span className={`text-xs shrink-0 ml-2 font-mono ${card("text-slate-500","text-slate-400")}`}>{formatDate(c.addedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Color Distribution */}
      {totalCount > 0 && (
        <div className={`p-6 rounded-2xl border ${card("bg-slate-900/40 border-slate-800","bg-white border-slate-100 shadow-sm")}`}>
          <h3 className={`text-base font-bold mb-5 flex items-center gap-2 ${card("text-slate-100","text-slate-800")}`}>
            <BarChart3 className="text-violet-500" size={18}/> توزيع العملاء حسب التصنيف
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(colorCounts).filter(([, v]) => v > 0).map(([key, cnt]) => (
              <div key={key} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${card("bg-slate-950/60 border-slate-800","bg-slate-50 border-slate-100")}`}>
                <span className={`w-3 h-3 rounded-full ${colorDot[key]}`}/>
                <span className={`text-sm font-semibold ${card("text-slate-300","text-slate-700")}`}>{colorLabel[key]}</span>
                <span className={`text-sm font-black ${card("text-white","text-slate-900")}`}>{cnt}</span>
                <span className={`text-xs ${card("text-slate-500","text-slate-400")}`}>({Math.round((cnt/totalCount)*100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Stat */}
      <div className={`p-4 rounded-2xl border flex items-center gap-3 ${card("bg-slate-900/40 border-slate-800","bg-white border-slate-100 shadow-sm")}`}>
        <TrendingUp className="text-emerald-600 shrink-0" size={20}/>
        <p className={`text-sm ${card("text-slate-400","text-slate-600")}`}>
          إجمالي المنشآت: <span className="font-black text-emerald-600">{totalBuildings}</span> منشأة عبر جميع العملاء.
          {totalCount > 0 && <> · متوسط المنشآت للعميل: <span className="font-black text-blue-600">{(totalBuildings / totalCount).toFixed(1)}</span></>}
        </p>
      </div>
    </div>
  );
}
