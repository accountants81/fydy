import React, { useState, useEffect, useCallback } from "react";
import {
  Menu, X, Sun, Moon, Search, Bot, LayoutDashboard, Users,
  Trash2, Database, Settings, LogOut, Sparkles, Bell
} from "lucide-react";
import { Customer, Reminder, AppTheme, AppView } from "./types";
import { initialCustomers } from "./data";
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import CustomerManagementView from "./components/CustomerManagementView";
import RecycleBinView from "./components/RecycleBinView";
import BackupView from "./components/BackupView";
import SettingsView from "./components/SettingsView";
import ChatbotView from "./components/ChatbotView";
import RemindersView from "./components/RemindersView";

// ─── Helpers ────────────────────────────────────────────────────────────────
const applyTheme = (t: AppTheme) => {
  if (t === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
};

const genId = () => `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const genRemId = () => `rem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Older builds had a bug where a state setter was called as a side effect
// from inside another setter's updater function; under React 18 StrictMode
// that side effect ran twice, so some users already have real duplicate-id
// records sitting in their saved localStorage data (same customer appearing
// 2-3x with an identical id, in customers and/or trash). Filtering/deleting
// by id then affects every duplicate at once, or a stray leftover duplicate
// with an id that no longer matches anything visible refuses to go away.
// This one-time cleanup on boot removes those duplicates so existing saved
// data self-heals instead of requiring every affected user to manually wipe
// their archive.
const dedupeById = (arr: Customer[]): Customer[] => {
  const seen = new Set<string>();
  const result: Customer[] = [];
  for (const c of arr) {
    if (!c || typeof c.id !== "string" || seen.has(c.id)) continue;
    seen.add(c.id);
    result.push(c);
  }
  return result;
};

// Single canonical place to clean up a (customers, trash) pair: dedupe each
// list by id, then drop any trash entry whose id already exists in
// customers. Used both on boot load and when restoring a backup file, so a
// corrupted/old backup can't reintroduce the same duplicate-id bug.
const normalizeData = (customers: Customer[], trash: Customer[]): { customers: Customer[]; trash: Customer[] } => {
  const cleanCustomers = dedupeById(customers);
  const customerIds = new Set(cleanCustomers.map(c => c.id));
  const cleanTrash = dedupeById(trash).filter(c => !customerIds.has(c.id));
  return { customers: cleanCustomers, trash: cleanTrash };
};

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [isAppLoading, setIsAppLoading]     = useState(true);
  const [isLoggedIn, setIsLoggedIn]         = useState(false);
  const [customers, setCustomers]           = useState<Customer[]>([]);
  const [trash, setTrash]                   = useState<Customer[]>([]);
  const [reminders, setReminders]           = useState<Reminder[]>([]);
  const [fixedPassword, setFixedPassword]   = useState("A12026");
  const [theme, setTheme] = useState<AppTheme>(() => {
    // Apply dark immediately to avoid flash — default to dark if no preference saved
    const saved = (localStorage.getItem("tax_theme") as AppTheme) || "dark";
    if (saved === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return saved;
  });
  const [currentView, setCurrentView]       = useState<AppView>("dashboard");

  const [isSidebarOpen, setIsSidebarOpen]       = useState(false);
  const [showCountsInSidebar, setShowCountsInSidebar] = useState(true);
  const [isQuickSearchOpen, setIsQuickSearchOpen]     = useState(false);
  const [quickSearchQuery, setQuickSearchQuery]       = useState("");
  const [isAddEditModalOpen, setIsAddEditModalOpen]   = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm]     = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = (localStorage.getItem("tax_theme") as AppTheme) || "dark";
      setTheme(savedTheme);
      applyTheme(savedTheme);

      const savedPassword = localStorage.getItem("tax_admin_password") || "A12026";
      setFixedPassword(savedPassword);

      const savedLogin = localStorage.getItem("tax_is_logged_in") === "true";
      setIsLoggedIn(savedLogin);

      const rawCustomers = localStorage.getItem("tax_customers");
      let loadedCustomers: Customer[] = [];
      try {
        const parsed = rawCustomers ? JSON.parse(rawCustomers) : [];
        loadedCustomers = Array.isArray(parsed) ? parsed : [];
      } catch {
        localStorage.removeItem("tax_customers");
        loadedCustomers = [];
      }

      const rawTrash = localStorage.getItem("tax_trash");
      let loadedTrash: Customer[] = [];
      try {
        const parsed = rawTrash ? JSON.parse(rawTrash) : [];
        loadedTrash = Array.isArray(parsed) ? parsed : [];
      } catch {
        localStorage.removeItem("tax_trash");
        loadedTrash = [];
      }

      const normalized = normalizeData(loadedCustomers, loadedTrash);
      setCustomers(normalized.customers);
      setTrash(normalized.trash);

      const rawReminders = localStorage.getItem("tax_reminders");
      try {
        const parsed = rawReminders ? JSON.parse(rawReminders) : [];
        setReminders(Array.isArray(parsed) ? parsed : []);
      } catch {
        localStorage.removeItem("tax_reminders");
        setReminders([]);
      }

      const rawShowCounts = localStorage.getItem("tax_show_counts");
      setShowCountsInSidebar(rawShowCounts !== "false");

      setIsAppLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // ─── Persist ───────────────────────────────────────────────────────────────
  // Guarded by isAppLoading: without this, these effects fire on first mount
  // with the initial empty state (before the boot effect has a chance to read
  // the saved data back from localStorage), silently overwriting real saved
  // customers/trash with "[]" on every page load/refresh.
  useEffect(() => {
    if (isAppLoading) return;
    localStorage.setItem("tax_customers", JSON.stringify(customers));
  }, [customers, isAppLoading]);

  useEffect(() => {
    if (isAppLoading) return;
    localStorage.setItem("tax_trash", JSON.stringify(trash));
  }, [trash, isAppLoading]);

  useEffect(() => {
    if (isAppLoading) return;
    localStorage.setItem("tax_reminders", JSON.stringify(reminders));
  }, [reminders, isAppLoading]);

  // ─── Theme ─────────────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem("tax_theme", next);
      return next;
    });
  }, []);

  // ─── Toast ─────────────────────────────────────────────────────────────────
  const triggerToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Customer CRUD ──────────────────────────────────────────────────────────
  const addCustomer = useCallback((data: Omit<Customer, "id" | "serial" | "addedAt" | "lastEditedAt">) => {
    setCustomers(prev => {
      const maxSerial = prev.length > 0 ? Math.max(...prev.map(c => c.serial)) : 0;
      const now = new Date().toISOString();
      const existingIds = new Set(prev.map(c => c.id));
      let id = genId();
      while (existingIds.has(id)) id = genId(); // guard against the astronomically unlikely id collision
      const newC: Customer = { ...data, id, serial: maxSerial + 1, addedAt: now, lastEditedAt: now };
      return [...prev, newC];
    });
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates, lastEditedAt: new Date().toISOString() } : c));
  }, []);

  // Note: deleteCustomer/restoreCustomer must NOT call one state setter as a
  // side effect from inside the other's updater function (e.g. calling
  // setTrash(...) inside setCustomers(prev => {...})). React 18 StrictMode
  // intentionally double-invokes updater functions to detect exactly this
  // kind of impurity, which was actually running the side effect twice —
  // producing two copies of the deleted customer in the trash, restoring
  // both, and deleting both together afterwards. Each setter below only
  // updates its own state, and the "some" checks make them idempotent as
  // extra protection against any double-invocation.
  const deleteCustomer = useCallback((id: string) => {
    const target = customers.find(c => c.id === id);
    if (!target) return;
    setCustomers(prev => prev.filter(c => c.id !== id));
    setTrash(prev => (prev.some(c => c.id === id) ? prev : [...prev, target]));
  }, [customers]);

  const restoreCustomer = useCallback((id: string) => {
    const target = trash.find(c => c.id === id);
    if (!target) return;
    setTrash(prev => prev.filter(c => c.id !== id));
    setCustomers(prev => (prev.some(c => c.id === id) ? prev : [...prev, target]));
  }, [trash]);

  const permanentDelete = useCallback((id: string) => {
    setTrash(prev => prev.filter(c => c.id !== id));
  }, []);

  const clearTrash = useCallback(() => setTrash([]), []);

  const changePassword = useCallback((newPass: string) => {
    setFixedPassword(newPass);
    localStorage.setItem("tax_admin_password", newPass);
  }, []);

  const resetAllData = useCallback(() => {
    setCustomers([]);
    setTrash([]);
    setReminders([]);
    localStorage.removeItem("tax_customers");
    localStorage.removeItem("tax_trash");
    localStorage.removeItem("tax_reminders");
  }, []);

  const restoreBackup = useCallback((data: { customers: Customer[]; trash: Customer[]; reminders?: Reminder[] }) => {
    // Normalize here too: an old backup file exported while the historical
    // duplicate-id bug was live could reintroduce the same corruption.
    const normalized = normalizeData(data.customers, data.trash);
    setCustomers(normalized.customers);
    setTrash(normalized.trash);
    if (data.reminders && Array.isArray(data.reminders)) setReminders(data.reminders);
  }, []);

  // ─── Reminders CRUD ────────────────────────────────────────────────────────
  const addReminder = useCallback((data: Omit<Reminder, "id" | "createdAt">) => {
    setReminders(prev => [...prev, { ...data, id: genRemId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateReminder = useCallback((id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  // ─── Quick search results ──────────────────────────────────────────────────
  const quickResults = customers.filter(c =>
    quickSearchQuery.trim() &&
    (c.fullName.toLowerCase().includes(quickSearchQuery.toLowerCase()) ||
     c.mobile.includes(quickSearchQuery) ||
     c.nationalId.includes(quickSearchQuery) ||
     (c.city || "").toLowerCase().includes(quickSearchQuery.toLowerCase()))
  ).slice(0, 8);

  // ─── Overdue reminders count (for badge) ──────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const overdueCount = reminders.filter(r => !r.done && r.dueDate < today).length;
  const pendingRemCount = reminders.filter(r => !r.done).length;

  // ─── Loading Screen ────────────────────────────────────────────────────────
  if (isAppLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-6 ${
        theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}>
        <div className="relative">
          <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full scale-150"></div>
          <img
            src="/logo.jpg"
            alt="logo"
            className="w-20 h-20 rounded-3xl border-2 border-violet-500 object-cover shadow-2xl relative z-10"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold">أرشيف الضرائب</h1>
          <p className={`text-sm mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>جاري التحميل...</p>
        </div>
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <LoginView
        onLogin={() => { setIsLoggedIn(true); localStorage.setItem("tax_is_logged_in", "true"); }}
        theme={theme}
        toggleTheme={toggleTheme}
        fixedPassword={fixedPassword}
      />
    );
  }

  // ─── Sidebar nav items ────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard"  as AppView, label: "لوحة التحكم",     icon: <LayoutDashboard size={18}/>, count: null },
    { id: "customers"  as AppView, label: "إدارة العملاء",   icon: <Users size={18}/>,           count: customers.length },
    { id: "reminders"  as AppView, label: "التذكيرات",       icon: <Bell size={18}/>,            count: pendingRemCount },
    { id: "trash"      as AppView, label: "سلة المهملات",    icon: <Trash2 size={18}/>,          count: trash.length },
    { id: "backup"     as AppView, label: "النسخ الاحتياطي", icon: <Database size={18}/>,        count: null },
    { id: "settings"   as AppView, label: "الإعدادات",       icon: <Settings size={18}/>,        count: null },
    { id: "chatbot"    as AppView, label: "الذكاء الاصطناعي",icon: <Bot size={18}/>,             count: null },
  ];

  const viewTitles: Record<AppView, string> = {
    dashboard:  "لوحة التحكم",
    customers:  "إدارة العملاء",
    reminders:  "التذكيرات والمواعيد",
    trash:      "سلة المهملات",
    backup:     "النسخ الاحتياطي",
    settings:   "الإعدادات",
    chatbot:    "المساعد الذكي",
  };

  const bgClass      = theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900";
  const sidebarClass = theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200";
  const topbarClass  = theme === "dark" ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-slate-200";
  const btnGhostClass = theme === "dark"
    ? "border-slate-800 hover:bg-slate-800 text-slate-300"
    : "border-slate-200 hover:bg-slate-100 text-slate-600";

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>

      {/* ── Sidebar Overlay (mobile) ──────────────────────────────────────── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 right-0 h-full w-72 border-l z-50 flex flex-col transform transition-transform duration-300 ${sidebarClass} ${
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      } lg:translate-x-0 lg:z-30`}>
        {/* Sidebar Header */}
        <div className={`flex items-center justify-between p-5 border-b ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg" alt="logo"
              className="w-10 h-10 rounded-2xl border-2 border-violet-500 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <h1 className={`text-base font-extrabold leading-none ${theme === "dark" ? "text-white" : "text-slate-900"}`}>أرشيف الضرائب</h1>
              <p className="text-xs text-violet-500 font-semibold flex items-center gap-1 mt-0.5"><Sparkles size={10}/>Tax Archive</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className={`p-2 rounded-xl cursor-pointer lg:hidden ${btnGhostClass} border`}><X size={18}/></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer group ${
                currentView === item.id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={currentView === item.id ? "text-white" : "text-violet-500"}>{item.icon}</span>
                {item.label}
              </div>
              {showCountsInSidebar && item.count !== null && item.count > 0 && (
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  currentView === item.id
                    ? "bg-white/20 text-white"
                    : item.id === "reminders" && overdueCount > 0
                      ? "bg-red-500 text-white"
                      : theme === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                }`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className={`p-4 border-t ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer text-red-500 ${
              theme === "dark" ? "hover:bg-red-950/30" : "hover:bg-red-50"
            }`}
          >
            <LogOut size={18}/>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 lg:right-72 z-20 border-b backdrop-blur-md flex items-center gap-3 px-4 py-3 ${topbarClass}`}>
        <button onClick={() => setIsSidebarOpen(true)} className={`p-2.5 rounded-xl border cursor-pointer transition-all lg:hidden ${btnGhostClass}`}>
          <Menu size={18}/>
        </button>

        <h2 className={`text-base font-extrabold flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          {viewTitles[currentView]}
        </h2>

        <div className="flex items-center gap-2">
          {/* Reminders bell with badge */}
          <button
            onClick={() => setCurrentView("reminders")}
            className={`relative p-2.5 rounded-xl border cursor-pointer transition-all ${
              currentView === "reminders" ? "bg-violet-600 border-violet-600 text-white" : btnGhostClass
            }`}
            title="التذكيرات"
          >
            <Bell size={18}/>
            {overdueCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">{overdueCount}</span>
            )}
          </button>

          {/* Quick search */}
          <button
            onClick={() => { setIsQuickSearchOpen(true); setQuickSearchQuery(""); }}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${btnGhostClass}`}
            title="بحث سريع"
          >
            <Search size={18}/>
          </button>

          {/* AI */}
          <button
            onClick={() => setCurrentView("chatbot")}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              currentView === "chatbot" ? "bg-violet-600 border-violet-600 text-white" : btnGhostClass
            }`}
            title="المساعد الذكي"
          >
            <Bot size={18}/>
          </button>

          {/* Theme */}
          <button onClick={toggleTheme} className={`p-2.5 rounded-xl border cursor-pointer transition-all ${btnGhostClass}`} title="تبديل الثيم">
            {theme === "dark" ? <Sun size={18} className="text-amber-400"/> : <Moon size={18}/>}
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="lg:mr-72 pt-16">
        {currentView === "chatbot" ? (
          <div className="h-[calc(100dvh-4rem)] p-3 md:p-4 flex flex-col">
            <ChatbotView
              customers={customers} trash={trash}
              onAddCustomer={addCustomer} onUpdateCustomer={updateCustomer} onDeleteCustomer={deleteCustomer}
              theme={theme}
            />
          </div>
        ) : (
          <div className="p-4 md:p-6 max-w-6xl mx-auto">
            {currentView === "dashboard" && (
              <DashboardView
                customers={customers} reminders={reminders}
                setView={setCurrentView}
                setSelectedCustomerForEdit={setSelectedCustomerForEdit}
                setIsAddEditModalOpen={setIsAddEditModalOpen}
                theme={theme}
              />
            )}
            {currentView === "customers" && (
              <CustomerManagementView
                customers={customers}
                onAddCustomer={addCustomer} onUpdateCustomer={updateCustomer} onDeleteCustomer={deleteCustomer}
                theme={theme}
                isAddEditModalOpen={isAddEditModalOpen} setIsAddEditModalOpen={setIsAddEditModalOpen}
                selectedCustomerForEdit={selectedCustomerForEdit} setSelectedCustomerForEdit={setSelectedCustomerForEdit}
                triggerToast={triggerToast}
              />
            )}
            {currentView === "reminders" && (
              <RemindersView
                reminders={reminders}
                onAddReminder={addReminder} onUpdateReminder={updateReminder} onDeleteReminder={deleteReminder}
                theme={theme} triggerToast={triggerToast}
              />
            )}
            {currentView === "trash" && (
              <RecycleBinView
                trash={trash} onRestoreCustomer={restoreCustomer}
                onPermanentDelete={permanentDelete} onClearTrash={clearTrash}
                theme={theme} triggerToast={triggerToast}
              />
            )}
            {currentView === "backup" && (
              <BackupView
                customers={customers} trash={trash} reminders={reminders}
                onRestoreBackup={restoreBackup}
                theme={theme} triggerToast={triggerToast}
              />
            )}
            {currentView === "settings" && (
              <SettingsView
                theme={theme} fixedPassword={fixedPassword}
                onChangePassword={changePassword} onResetAllData={resetAllData}
                showCountsInSidebar={showCountsInSidebar}
                onToggleShowCounts={() => {
                  const next = !showCountsInSidebar;
                  setShowCountsInSidebar(next);
                  localStorage.setItem("tax_show_counts", String(next));
                }}
                triggerToast={triggerToast}
              />
            )}
          </div>
        )}
      </main>

      {/* ── Quick Search Modal ────────────────────────────────────────────── */}
      {isQuickSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden ${theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
              <Search size={18} className="text-slate-400 shrink-0"/>
              <input
                autoFocus
                type="text" value={quickSearchQuery}
                onChange={e => setQuickSearchQuery(e.target.value)}
                placeholder="ابحث عن عميل بالاسم، الموبايل، الرقم القومي أو المدينة..."
                className={`flex-1 text-sm focus:outline-none text-right bg-transparent ${theme === "dark" ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
              />
              <button onClick={() => setIsQuickSearchOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16}/></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {quickSearchQuery.trim() === "" && (
                <p className={`p-6 text-center text-sm ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>اكتب للبحث...</p>
              )}
              {quickSearchQuery.trim() !== "" && quickResults.length === 0 && (
                <p className={`p-6 text-center text-sm ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>لا توجد نتائج مطابقة.</p>
              )}
              {quickResults.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomerForEdit(c);
                    setCurrentView("customers");
                    setIsAddEditModalOpen(true);
                    setIsQuickSearchOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors cursor-pointer ${
                    theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    theme === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}>{c.serial}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{c.fullName}</p>
                    <p className={`text-xs font-mono ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{c.mobile} · {c.city || "—"}</p>
                  </div>
                  {c.color && <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${{ green:"bg-emerald-500", blue:"bg-blue-500", red:"bg-red-500", yellow:"bg-amber-500", gray:"bg-slate-400" }[c.color]}`}/>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-in pointer-events-none">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2 ${
            toast.type === "error"
              ? "bg-red-600 border-red-700 text-white"
              : "bg-violet-600 border-violet-700 text-white"
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* ── Logout Confirm ────────────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-right">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl"><LogOut size={32}/></div>
              <h3 className="text-xl font-extrabold">تسجيل الخروج</h3>
              <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>هل أنت متأكد من تسجيل الخروج؟</p>
            </div>
            <div className="mt-6 flex flex-row-reverse gap-3">
              <button
                onClick={() => { setIsLoggedIn(false); localStorage.setItem("tax_is_logged_in", "false"); setShowLogoutConfirm(false); }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm cursor-pointer"
              >نعم، خروج</button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 py-3 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}
              >إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
