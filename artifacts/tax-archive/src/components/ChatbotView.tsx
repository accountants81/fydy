import React, { useState, useEffect, useRef } from "react";
import {
  Send, Bot, User, RefreshCw, Sparkles, Trash2, Cpu,
  CheckCircle2, XCircle, PlusCircle, Edit3, UserMinus
} from "lucide-react";
import { Customer, ChatMsg, AppTheme } from "../types";

interface ChatbotViewProps {
  customers: Customer[];
  trash: Customer[];
  onAddCustomer: (customer: Omit<Customer, "id" | "serial" | "addedAt" | "lastEditedAt">) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  theme: AppTheme;
}

const QUICK_SUGGESTIONS = [
  "كم عدد العملاء الإجمالي؟",
  "كم عدد الذكور والإناث؟",
  "ما هي المدن في الأرشيف؟",
  "أضف عميل: أحمد محمد — 01012345678",
  "إجمالي المنشآت لجميع العملاء",
  "من أُضيف اليوم؟",
];

// ────────────────────────────────────────────────────────────────────────────
// Smart Local AI Engine
// ────────────────────────────────────────────────────────────────────────────
interface BotResult {
  text: string;
  action?: {
    type: "ADD" | "EDIT" | "DELETE";
    data?: Omit<Customer, "id" | "serial" | "addedAt" | "lastEditedAt">;
    targetId?: string;
    updates?: Partial<Customer>;
    customerName?: string;
  };
}

function extractMobile(text: string): string | null {
  const m = text.match(/0(10|11|12|15)\d{8}/);
  return m ? m[0] : null;
}

function extractNationalId(text: string): string | null {
  const m = text.match(/\b\d{14}\b/);
  return m ? m[0] : null;
}

function extractNumber(text: string, label: string): number | null {
  const pattern = new RegExp(`${label}[:\\s]*([\\d]+)`, "u");
  const m = text.match(pattern);
  return m ? Number(m[1]) : null;
}

function extractField(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const pattern = new RegExp(`(?:${label})[:\\s]+([^،,\\n]+)`, "u");
    const m = text.match(pattern);
    if (m) return m[1].trim();
  }
  return null;
}

function findCustomer(query: string, customers: Customer[]): Customer | null {
  const q = query.trim().toLowerCase();
  // Exact name match first
  let found = customers.find(c => c.fullName.toLowerCase() === q);
  if (found) return found;
  // Mobile match
  const mobile = extractMobile(query);
  if (mobile) {
    found = customers.find(c => c.mobile === mobile || c.altNumbers?.includes(mobile));
    if (found) return found;
  }
  // Partial name match
  found = customers.find(c => c.fullName.toLowerCase().includes(q) || q.includes(c.fullName.toLowerCase().split(" ")[0]));
  return found || null;
}

function processCommand(message: string, customers: Customer[], trash: Customer[]): BotResult {
  const q = message.trim();
  const qLow = q.toLowerCase();

  // ── ADD CUSTOMER ─────────────────────────────────────────────────────────
  const isAdd = /^(أضف|اضف|اضافة|إضافة|سجل|أنشئ|انشئ|ادخل|خزن)\s*(عميل|زبون|شخص)?/u.test(q);
  if (isAdd) {
    const mobile = extractMobile(q);
    const nationalId = extractNationalId(q);
    const city = extractField(q, ["المدينة", "القرية", "من", "سكان"]);
    const gender = /أنثى|بنت|ست|سيدة|امرأة/u.test(q) ? "أنثى" as const
      : /ذكر|رجل|شاب|ولد/u.test(q) ? "ذكر" as const : undefined;
    const buildingsCount = extractNumber(q, "(?:منشآت?|بيوت?|عدد المنشآت?)");
    const notes = extractField(q, ["ملاحظة", "ملاحظات", "ملاحظه"]);

    // Extract name — remove known tokens to isolate name
    let nameRaw = q
      .replace(/^(أضف|اضف|اضافة|إضافة|سجل|أنشئ|انشئ|ادخل|خزن)\s*(عميل|زبون|شخص)?\s*/u, "")
      .replace(/(?:اسمه?|الاسم)[:\s]*/u, "")
      .replace(mobile || "NOMOBILE", "")
      .replace(nationalId || "NONID", "")
      .replace(/(?:رقمه?|موبايله?|تليفونه?|جواله?)[:\s]*(01\d{9})?/gu, "")
      .replace(/(?:المدينة|القرية|من|سكان)[:\s]*[^\s،,\n]+/gu, "")
      .replace(/(?:أنثى|بنت|ست|سيدة|امرأة|ذكر|رجل|شاب|ولد)/gu, "")
      .replace(/(?:منشآت?|بيوت?)[:\s]*\d+/gu, "")
      .replace(/(?:ملاحظة|ملاحظات?)[:\s]*[^\n]*/gu, "")
      .replace(/[—\-–:,،]/g, " ")
      .trim();

    // Clean name — take only Arabic words
    const nameWords = nameRaw.match(/[\u0600-\u06FF]+/gu) || [];
    const fullName = nameWords.slice(0, 4).join(" ").trim();

    if (!fullName) {
      return { text: "❌ لم أتمكن من استخراج اسم العميل. المثال:\n«أضف عميل: محمد أحمد علي — رقمه 01012345678»" };
    }
    if (!mobile) {
      return { text: `❓ لاحظت الاسم: **${fullName}**\nلكن ينقصني رقم الموبايل (11 رقم يبدأ بـ 010/011/012/015).\n\nأعد الرسالة بصيغة:\n«أضف عميل: ${fullName} — رقمه 010XXXXXXXX»` };
    }

    // Validate mobile
    if (!/^(010|011|012|015)\d{8}$/.test(mobile)) {
      return { text: "❌ رقم الموبايل غير صحيح. يجب أن يكون 11 رقمًا ويبدأ بـ 010/011/012/015." };
    }

    // Check duplicate mobile
    const dup = customers.find(c => c.mobile === mobile);
    if (dup) {
      return { text: `⚠️ يوجد عميل مسجل بنفس الرقم: **${dup.fullName}** (مسلسل #${dup.serial}).\nهل تقصد تعديله؟ قل: «عدل ${dup.fullName} ...»` };
    }

    const customerData: Omit<Customer, "id" | "serial" | "addedAt" | "lastEditedAt"> = {
      fullName,
      mobile,
      nationalId: nationalId || `00000000000000`,
      password: mobile.slice(-4),
      city: city || undefined,
      gender,
      buildingsCount: buildingsCount || undefined,
      notes: notes || undefined,
    };

    return {
      text: `✅ تم إضافة العميل بنجاح!\n\n👤 **${fullName}**\n📱 ${mobile}${city ? `\n📍 ${city}` : ""}${gender ? `\n🔹 ${gender}` : ""}${buildingsCount ? `\n🏗️ ${buildingsCount} منشأة` : ""}${nationalId ? "" : "\n⚠️ الرقم القومي لم يُذكر — تم وضع رقم مؤقت. عدّله لاحقاً."}`,
      action: { type: "ADD", data: customerData },
    };
  }

  // ── DELETE CUSTOMER ──────────────────────────────────────────────────────
  const isDelete = /^(احذف|امسح|شيل|ازيل|إزالة|حذف|مسح)\s*(العميل|عميل|الزبون)?/u.test(q);
  if (isDelete) {
    const query = q.replace(/^(احذف|امسح|شيل|ازيل|إزالة|حذف|مسح)\s*(العميل|عميل|الزبون)?\s*/u, "").trim();
    if (!query) return { text: "❓ من تريد حذفه؟ مثال:\n«احذف العميل محمد أحمد»\nأو «احذف 01012345678»" };

    const found = findCustomer(query, customers);
    if (!found) {
      return { text: `❌ لم أجد عميلاً يطابق: "${query}"\n\nجرّب البحث أولاً: «ابحث عن ${query}»` };
    }

    return {
      text: `🗑️ تم نقل العميل **${found.fullName}** إلى سلة المهملات.\nيمكنك استعادته من قسم «سلة المهملات».`,
      action: { type: "DELETE", targetId: found.id, customerName: found.fullName },
    };
  }

  // ── EDIT CUSTOMER ────────────────────────────────────────────────────────
  const isEdit = /^(عدل|غير|بدل|حدّث|حدث|عدّل|تعديل|تحديث)\s*(العميل|عميل|بيانات|معلومات)?/u.test(q);
  if (isEdit) {
    const afterCmd = q.replace(/^(عدل|غير|بدل|حدّث|حدث|عدّل|تعديل|تحديث)\s*(العميل|عميل|بيانات|معلومات)?\s*/u, "").trim();

    // Try to extract target name (before dash or colon)
    const targetName = afterCmd.split(/[—\-–:،]/)[0].trim();
    const found = findCustomer(targetName, customers);

    if (!found) {
      return { text: `❌ لم أجد عميلاً يطابق: "${targetName}"\n\nالصيغة الصحيحة:\n«عدل [اسم العميل] — المدينة: القاهرة»` };
    }

    const rest = afterCmd.slice(targetName.length).replace(/^[—\-–:،\s]+/, "");
    const updates: Partial<Customer> = {};

    const newMobile = extractMobile(rest);
    if (newMobile) updates.mobile = newMobile;

    const newCity = extractField(rest, ["المدينة", "القرية", "مدينته?", "قريته?"]);
    if (newCity) updates.city = newCity;

    const newGender = /أنثى|بنت|ست|سيدة/u.test(rest) ? "أنثى" as const
      : /ذكر|رجل|شاب/u.test(rest) ? "ذكر" as const : undefined;
    if (newGender) updates.gender = newGender;

    const newBuildings = extractNumber(rest, "(?:منشآت?|بيوت?|عدد)");
    if (newBuildings !== null) updates.buildingsCount = newBuildings;

    const newNotes = extractField(rest, ["ملاحظة", "ملاحظات?"]);
    if (newNotes) updates.notes = newNotes;

    const newNationalId = extractNationalId(rest);
    if (newNationalId) updates.nationalId = newNationalId;

    if (Object.keys(updates).length === 0) {
      return {
        text: `❓ وجدت العميل **${found.fullName}** لكن لم أفهم ماذا تريد تعديله.\n\nأمثلة:\n• «عدل ${found.fullName} — المدينة: القاهرة»\n• «عدل ${found.fullName} — رقمه 01099999999»\n• «عدل ${found.fullName} — المنشآت: 5»`
      };
    }

    const changesDesc = Object.entries(updates)
      .map(([k, v]) => {
        const labels: Record<string, string> = { mobile: "الموبايل", city: "المدينة", gender: "النوع", buildingsCount: "المنشآت", notes: "الملاحظة", nationalId: "الرقم القومي" };
        return `• ${labels[k] || k}: ${v}`;
      }).join("\n");

    return {
      text: `✅ تم تعديل بيانات **${found.fullName}** بنجاح!\n\nالتغييرات:\n${changesDesc}`,
      action: { type: "EDIT", targetId: found.id, updates, customerName: found.fullName },
    };
  }

  // ── STATISTICS ───────────────────────────────────────────────────────────
  if (/(عدد|كم|إجمالي|احصائيات?|تقرير)/u.test(qLow)) {
    if (/(ذكر|ذكور|إناث|أنثى|نوع|جنس)/u.test(qLow)) {
      const males = customers.filter(c => c.gender === "ذكر").length;
      const females = customers.filter(c => c.gender === "أنثى").length;
      const unknown = customers.filter(c => !c.gender).length;
      return {
        text: `👥 توزيع العملاء حسب النوع:\n• ذكور: ${males} (${pct(males, customers.length)}%)\n• إناث: ${females} (${pct(females, customers.length)}%)\n• غير محدد: ${unknown}`
      };
    }
    const males = customers.filter(c => c.gender === "ذكر").length;
    const females = customers.filter(c => c.gender === "أنثى").length;
    const today = new Date().toISOString().split("T")[0];
    const addedToday = customers.filter(c => c.addedAt?.split("T")[0] === today).length;
    const totalBuildings = customers.reduce((s, c) => s + (c.buildingsCount || 0), 0);
    return {
      text: `📊 ملخص الأرشيف:\n• إجمالي العملاء: ${customers.length}\n• الذكور: ${males} | الإناث: ${females}\n• مضاف اليوم: ${addedToday}\n• إجمالي المنشآت: ${totalBuildings}\n• في سلة المهملات: ${trash.length}`
    };
  }

  if (/(منشآت?|بيوت?|مباني|منشأة)/u.test(qLow)) {
    const total = customers.reduce((s, c) => s + (c.buildingsCount || 0), 0);
    const top = [...customers].filter(c => c.buildingsCount).sort((a, b) => (b.buildingsCount || 0) - (a.buildingsCount || 0)).slice(0, 5);
    let reply = `🏗️ إجمالي المنشآت: **${total}** منشأة\n`;
    if (top.length) {
      reply += `\nأعلى العملاء:\n`;
      top.forEach((c, i) => reply += `${i + 1}. ${c.fullName} — ${c.buildingsCount} منشأة\n`);
    }
    return { text: reply.trim() };
  }

  if (/(اليوم|أضيف اليوم|مضاف اليوم|أُضيف)/u.test(qLow)) {
    const today = new Date().toISOString().split("T")[0];
    const todayList = customers.filter(c => c.addedAt?.split("T")[0] === today);
    if (!todayList.length) return { text: "📅 لم يُضف أي عميل اليوم." };
    let reply = `📅 العملاء المضافون اليوم (${todayList.length}):\n`;
    todayList.forEach((c, i) => reply += `${i + 1}. ${c.fullName} — ${c.mobile}${c.city ? ` — ${c.city}` : ""}\n`);
    return { text: reply.trim() };
  }

  if (/(مدن?|قرى|قرية|أماكن?|محافظ)/u.test(qLow)) {
    const cityMap: Record<string, number> = {};
    customers.forEach(c => { const city = c.city?.trim() || "غير محدد"; cityMap[city] = (cityMap[city] || 0) + 1; });
    const sorted = Object.entries(cityMap).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return { text: "لا توجد بيانات مدن مسجلة." };
    let reply = `🗺️ توزيع العملاء حسب المدينة (${sorted.length} مدينة/قرية):\n`;
    sorted.forEach(([city, count]) => reply += `• ${city}: ${count} عميل (${pct(count, customers.length)}%)\n`);
    return { text: reply.trim() };
  }

  if (/(آخر|أحدث|جديد).*(عميل|إضافة)?/u.test(qLow)) {
    const sorted = [...customers].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(0, 5);
    if (!sorted.length) return { text: "لا يوجد عملاء بعد." };
    let reply = `🕐 آخر 5 عملاء مضافين:\n`;
    sorted.forEach((c, i) => {
      const date = new Date(c.addedAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
      reply += `${i + 1}. ${c.fullName} — ${date}${c.city ? ` — ${c.city}` : ""}\n`;
    });
    return { text: reply.trim() };
  }

  if (/(ملاحظة|ملاحظات)/u.test(qLow)) {
    const withNotes = customers.filter(c => c.notes?.trim());
    if (!withNotes.length) return { text: "لا يوجد عملاء لديهم ملاحظات." };
    let reply = `📝 العملاء الذين لديهم ملاحظات (${withNotes.length}):\n`;
    withNotes.slice(0, 10).forEach((c, i) => reply += `${i + 1}. ${c.fullName}: "${c.notes}"\n`);
    if (withNotes.length > 10) reply += `... و${withNotes.length - 10} آخرين`;
    return { text: reply.trim() };
  }

  if (/(سلة|محذوف|مهملات)/u.test(qLow)) {
    if (!trash.length) return { text: "🗑️ سلة المهملات فارغة." };
    let reply = `🗑️ سلة المهملات (${trash.length} عميل):\n`;
    trash.slice(0, 8).forEach((c, i) => reply += `${i + 1}. ${c.fullName}\n`);
    if (trash.length > 8) reply += `... و${trash.length - 8} آخرين`;
    return { text: reply.trim() };
  }

  if (/(لون|أحمر|أزرق|أخضر|أصفر|رمادي)/u.test(qLow)) {
    const colorNames: Record<string, string> = { red: "🔴 أحمر (هام جداً)", blue: "🔵 أزرق (مستقر)", green: "🟢 أخضر (عادي)", yellow: "🟡 أصفر (مراجعة)", gray: "⚪ رمادي (أرشيف)" };
    const counts: Record<string, number> = {};
    customers.forEach(c => { const color = c.color || "none"; counts[color] = (counts[color] || 0) + 1; });
    let reply = `🎨 توزيع العملاء حسب اللون:\n`;
    Object.entries(counts).forEach(([color, count]) => {
      reply += `• ${colorNames[color] || "⚫ بدون لون"}: ${count} عميل\n`;
    });
    return { text: reply.trim() };
  }

  // ── SEARCH ───────────────────────────────────────────────────────────────
  const mobileSearch = extractMobile(q);
  if (mobileSearch && !isAdd && !isEdit && !isDelete) {
    const found = customers.find(c => c.mobile === mobileSearch || c.altNumbers?.includes(mobileSearch));
    if (!found) return { text: `🔍 لم أجد عميلاً برقم ${mobileSearch}.` };
    return { text: formatCustomerCard(found) };
  }

  const searchMatch = q.match(/(?:ابحث عن?|بحث عن?|بحثي? عن?|عميل اسمه?|معلومات عن?|دور على)\s+(.+)/u);
  if (searchMatch) {
    const term = searchMatch[1].trim();
    const found = customers.filter(c =>
      c.fullName.toLowerCase().includes(term.toLowerCase()) ||
      c.mobile.includes(term) ||
      (c.city || "").toLowerCase().includes(term.toLowerCase()) ||
      (c.notes || "").toLowerCase().includes(term.toLowerCase())
    );
    if (!found.length) return { text: `🔍 لم أجد نتائج لـ "${term}".` };
    if (found.length === 1) return { text: formatCustomerCard(found[0]) };
    let reply = `🔍 نتائج البحث عن "${term}" (${found.length}):\n`;
    found.slice(0, 6).forEach((c, i) => {
      reply += `${i + 1}. ${c.fullName} — ${c.mobile}${c.city ? ` | ${c.city}` : ""}${c.gender ? ` | ${c.gender}` : ""}\n`;
    });
    if (found.length > 6) reply += `\n... و${found.length - 6} نتيجة أخرى`;
    return { text: reply.trim() };
  }

  // Check if any Arabic word matches a customer name
  // Only trigger when query looks like a customer lookup (not a general question)
  const looksLikeCustomerLookup = /^[\u0600-\u06FF\s]+$/.test(q) && q.length <= 30 && !/[?؟ما هو ما هي كيف لماذا متى أين من]/u.test(q);
  if (looksLikeCustomerLookup) {
    const arabicWords = q.match(/[\u0600-\u06FF]{3,}/gu) || [];
    for (const word of arabicWords) {
      const found = customers.filter(c => c.fullName.includes(word));
      if (found.length === 1) return { text: formatCustomerCard(found[0]) };
      if (found.length > 1) {
        let reply = `🔍 عملاء يتضمن اسمهم "${word}" (${found.length}):\n`;
        found.slice(0, 5).forEach((c, i) => reply += `${i + 1}. ${c.fullName} — ${c.mobile}\n`);
        return { text: reply.trim() };
      }
    }
  }

  // ── GREETING / HELP ──────────────────────────────────────────────────────
  if (/(مرحبا?|اهلا?|السلام|هاي|هلا|أهلا?)/u.test(qLow)) {
    return { text: `أهلاً وسهلاً! 👋\nأنا المساعد الذكي لأرشيف الضرائب — أعمل محلياً بشكل كامل.\n\nأقدر أساعدك في:\n📊 الإحصائيات والتقارير\n🔍 البحث عن أي عميل\n➕ إضافة عملاء جدد\n✏️ تعديل بيانات العملاء\n🗑️ حذف العملاء\n\nاكتب «مساعدة» لعرض الأوامر الكاملة.` };
  }

  if (/(مساعدة|help|أوامر|ايه اللي|إيه اللي|ماذا يمكن)/u.test(qLow)) {
    return {
      text: `🤖 **قائمة الأوامر الكاملة:**\n\n` +
        `➕ **إضافة عميل:**\n«أضف عميل: محمد أحمد — رقمه 01012345678»\n«أضف: سارة علي 01112345678 من القاهرة»\n\n` +
        `✏️ **تعديل عميل:**\n«عدل محمد أحمد — المدينة: الإسكندرية»\n«غير رقم محمد إلى 01099999999»\n\n` +
        `🗑️ **حذف عميل:**\n«احذف العميل محمد أحمد»\n«امسح 01012345678»\n\n` +
        `🔍 **البحث:**\n«ابحث عن محمد» | «01012345678»\n\n` +
        `📊 **إحصائيات:**\n«كم عدد العملاء؟» | «توزيع المدن»\n«إجمالي المنشآت» | «من أُضيف اليوم؟»`
    };
  }

  // ── FALLBACK ─────────────────────────────────────────────────────────────
  if (customers.length === 0) {
    return { text: "لا يوجد عملاء في الأرشيف بعد.\n\nيمكنك:\n• إضافة عملاء من قسم «إدارة العملاء»\n• أو قل: «أضف عميل: [الاسم] — رقمه [الموبايل]»" };
  }

  return {
    text: `🤔 لم أفهم تماماً. حاول بصياغة أخرى.\n\nأمثلة:\n• «أضف عميل: محمد علي — رقمه 01012345678»\n• «احذف العميل محمد علي»\n• «ابحث عن أحمد»\n• «كم عدد العملاء؟»\n\nاكتب «مساعدة» للقائمة الكاملة.`
  };
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

function formatCustomerCard(c: Customer): string {
  const colorNames: Record<string, string> = { red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡", gray: "⚪" };
  const dot = c.color ? colorNames[c.color] || "" : "";
  const date = new Date(c.addedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  let text = `${dot} **${c.fullName}** (#${c.serial})\n`;
  text += `📱 ${c.mobile}\n`;
  text += `🪪 ${c.nationalId}\n`;
  if (c.gender) text += `🔹 ${c.gender}\n`;
  if (c.city) text += `📍 ${c.city}${c.detailedAddress ? ` — ${c.detailedAddress}` : ""}\n`;
  if (c.buildingsCount) text += `🏗️ ${c.buildingsCount} منشأة\n`;
  if (c.altNumbers?.filter(Boolean).length) text += `📞 أرقام أخرى: ${c.altNumbers.filter(Boolean).join(", ")}\n`;
  if (c.declarationLink) text += `🔗 رابط الإقرار متاح\n`;
  if (c.notes) text += `📝 ${c.notes}\n`;
  text += `📅 أُضيف في ${date}`;
  return text.trim();
}

// ────────────────────────────────────────────────────────────────────────────
export default function ChatbotView({
  customers, trash, onAddCustomer, onUpdateCustomer, onDeleteCustomer, theme
}: ChatbotViewProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([{
    id: "welcome",
    sender: "bot",
    text: `أهلاً! أنا المساعد الذكي لأرشيف الضرائب 🤖\n\n✅ إدارة العملاء — إضافة، تعديل، حذف، بحث\n📊 إحصائيات وتقارير كاملة\n🌐 بحث في الإنترنت عن أي سؤال عام\n\nاكتب «مساعدة» لعرض جميع الأوامر 👇`,
    timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
  }]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const addBotMessage = (text: string, actionExecuted?: ChatMsg["actionExecuted"]) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender: "bot",
      text,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      actionExecuted,
    }]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    }]);
    setInputValue("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 200));

    const result = processCommand(text, customers, trash);

    let actionExecuted: ChatMsg["actionExecuted"] | undefined;

    if (result.action) {
      try {
        if (result.action.type === "ADD" && result.action.data) {
          onAddCustomer(result.action.data);
          actionExecuted = { type: "ADD", success: true, details: result.action.data.fullName };
        } else if (result.action.type === "EDIT" && result.action.targetId && result.action.updates) {
          onUpdateCustomer(result.action.targetId, result.action.updates);
          actionExecuted = { type: "EDIT", success: true, details: result.action.customerName };
        } else if (result.action.type === "DELETE" && result.action.targetId) {
          onDeleteCustomer(result.action.targetId);
          actionExecuted = { type: "DELETE", success: true, details: result.action.customerName };
        }
      } catch {
        actionExecuted = { type: result.action.type, success: false };
      }
    }

    addBotMessage(result.text, actionExecuted);

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome-reset",
      sender: "bot",
      text: "تم مسح المحادثة. 🧠 كيف يمكنني مساعدتك؟",
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    }]);
    setShowClearConfirm(false);
  };

  const actionStyles: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
    ADD:    { bg: "bg-violet-500/10 text-violet-600 border-violet-500/20", icon: <PlusCircle size={12} />, label: "تمت الإضافة" },
    EDIT:   { bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",         icon: <Edit3 size={12} />,      label: "تم التعديل" },
    DELETE: { bg: "bg-red-500/10 text-red-600 border-red-500/20",             icon: <UserMinus size={12} />,  label: "تم الحذف" },
  };

  return (
    <div className={`flex flex-col h-full rounded-3xl border overflow-hidden ${
      theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-sm"
    }`}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between p-4 border-b shrink-0 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`font-extrabold text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>المساعد الذكي</h3>
            <div className="flex items-center gap-1.5">
              <Cpu size={10} className="text-violet-500" />
              <span className="text-xs text-violet-500 font-semibold">يعمل محلياً · {customers.length} عميل</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => messages.length > 1 && setShowClearConfirm(true)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            theme === "dark" ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          }`}
          title="مسح المحادثة"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              msg.sender === "user"
                ? "bg-violet-600 text-white"
                : "bg-gradient-to-br from-violet-600 to-purple-600 text-white"
            }`}>
              {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[82%] space-y-1.5 ${msg.sender === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-violet-600 text-white rounded-tr-sm"
                  : theme === "dark"
                    ? "bg-slate-800 text-slate-100 rounded-tl-sm"
                    : "bg-slate-100 text-slate-800 rounded-tl-sm"
              }`}>
                {msg.text}
              </div>
              {msg.actionExecuted && (() => {
                const style = actionStyles[msg.actionExecuted.type];
                return (
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                    msg.actionExecuted.success ? style?.bg : "bg-red-500/10 text-red-600 border-red-500/20"
                  }`}>
                    {msg.actionExecuted.success ? (
                      <>{style?.icon}<span>{style?.label}{msg.actionExecuted.details ? `: ${msg.actionExecuted.details}` : ""}</span><CheckCircle2 size={11} /></>
                    ) : (
                      <><XCircle size={11} /><span>فشل التنفيذ</span></>
                    )}
                  </div>
                );
              })()}
              <span className={`text-xs ${theme === "dark" ? "text-slate-600" : "text-slate-400"}`}>{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
              <RefreshCw size={14} className="animate-spin text-violet-500" />
              <span className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>جاري المعالجة...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Quick Suggestions ──────────────────────────────────────────── */}
      {messages.length <= 1 && (
        <div className={`px-4 pb-2 flex gap-2 flex-wrap shrink-0 border-t pt-3 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                theme === "dark"
                  ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div className={`p-4 border-t shrink-0 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex gap-3 items-end">
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || loading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              inputValue.trim() && !loading
                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                : theme === "dark" ? "bg-slate-800 text-slate-600 cursor-not-allowed" : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
          </button>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب أمرك أو سؤالك... (Enter للإرسال)"
            disabled={loading}
            rows={1}
            className={`flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all ${
              theme === "dark"
                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500"
            }`}
          />
        </div>
        <p className={`text-xs mt-2 text-center ${theme === "dark" ? "text-slate-600" : "text-slate-400"}`}>
          💡 جرّب: «أضف عميل: محمد — 01012345678» أو «احذف محمد» أو «ابحث عن أحمد»
        </p>
      </div>

      {/* ── Clear Confirm ──────────────────────────────────────────────── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl text-right ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
            <div className="text-center space-y-3">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl w-fit mx-auto"><Trash2 size={28} /></div>
              <h3 className="text-lg font-extrabold">مسح المحادثة</h3>
              <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>هل تريد مسح سجل المحادثة؟</p>
            </div>
            <div className="mt-5 flex flex-row-reverse gap-3">
              <button onClick={clearChat} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm cursor-pointer">مسح</button>
              <button onClick={() => setShowClearConfirm(false)} className={`flex-1 py-2.5 rounded-xl border font-bold text-sm cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
