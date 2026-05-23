"use client";

import { createContext, useContext, useState, useEffect } from "react";

export const translations = {
  TH: {
    home: "หน้าหลัก",
    myseries: "ซีรีส์ของฉัน",
    search: "ค้นหา",
    profile: "โปรไฟล์",
    empty_desc: "หน้าเปล่า",
    recent_series: "ซีรีส์ดูล่าสุด",
    favorite_series: "ซีรีส์โปรด",
    no_data: "ยังไม่มีข้อมูล",
    not_supported: "ไม่รองรับการใช้งาน",
    not_supported_desc: "ระบบนี้ออกแบบมาเพื่อใช้งานบนโทรศัพท์มือถือเท่านั้น โปรดเข้าใช้งานผ่านมือถือครับ",
    share_tiktok: "แชร์ไปยัง TikTok",
    coming_soon: "ฟีเจอร์นี้จะเปิดให้ใช้งานเร็วๆ นี้",
    user_id: "รหัสผู้ใช้งาน",
    version: "เวอร์ชั่น",
    profile_account_title: "บัญชีของฉัน",
    profile_user_id: "รหัสผู้ใช้",
    app_version: "แอปเวอร์ชั่น",
    vip_profile_title: "KlickShot VIP",
    credit_watch_title: "ตอนที่ปลดล็อกได้",
    credit_watch_desc: "ใช้สำหรับชมตอนที่ต้องปลดล๊อก",
    add_credit: "เพิ่มเครดิต",
    view_details: "ดูรายละเอียด",
    unlimited_watch: "ดูซีรีส์ได้ไม่จำกัด",
    subscribe_now: "สมัครเลย",
    unlock_credit: "เครดิตปลดล็อก",
    details: "รายละเอียด",
    episodes_unit: "ตอน",
    unlockable_desc: "จำนวนตอนที่ปลดล็อกได้",
    add_episodes: "เพิ่มตอน",
    unlock_text: "ปลดล็อกได้ {n} ตอน",
    discount_text: "ลด {p}%",
    terms: "ข้อกำหนดการใช้งาน",
    privacy: "นโยบายความเป็นส่วนตัว",
    contact: "ติดต่อเรา",
    subscribe_vip: "สมัคร VIP",
    weekly_vip: "VIP 7 วัน",
    monthly_vip: "VIP 30 วัน",
    weekly_vip_desc: "เหมาะสำหรับทดลองใช้งาน",
    monthly_vip_desc: "คุ้มกว่าสำหรับดูต่อเนื่อง",
    popular_badge: "ยอดนิยม",
    automatic_renewal: "ต่ออายุอัตโนมัติ ยกเลิกได้ตลอดเวลา",
    vip_benefits: "สิทธิพิเศษของ VIP",
    payment_development_notice: "ระบบนี้อยู่ในช่วงพัฒนา",
    payment_flow_label: "โฟลว์",
    ok: "ตกลง",
    no_ads: "ไม่มีโฆษณา",
    all_episodes: "ดูซีรีส์ได้ทุกตอน",
    unlimited_rewatch: "ดูกี่รอบก็ได้",
    price_baht: "บาท",
    contact_us_title: "ติดต่อเรา",
    contact_intro_line1: "มีคำแนะนำ ติชม หรือพบปัญหาในการใช้งาน?",
    contact_intro_line2: "ส่งข้อความหาเราได้เลย เรายินดีรับฟังทุกความคิดเห็น",
    contact_feedback_tab: "ติชม",
    contact_suggestion_tab: "เสนอแนะ",
    contact_issue_tab: "แจ้งปัญหา",
    name_label: "ชื่อ",
    email_label: "อีเมล",
    message_label: "ข้อความ",
    name_placeholder: "ชื่อของคุณ",
    email_placeholder: "example@email.com",
    message_placeholder: "พิมพ์คำติชม ข้อเสนอแนะ หรือปัญหาที่คุณพบได้ที่นี่",
    send_message: "ส่งข้อความ",
    contact_thanks: "ขอบคุณสำหรับการสนับสนุน",
    contact_response_time: "ปกติเราจะติดต่อกลับภายใน 72 ชั่วโมง",
    subscription_history: "ประวัติการสมัคร",
    language_menu: "ภาษา",
    faq: "คำถามที่พบบ่อย",
    purchase_history: "ประวัติการซื้อ",
    jan: "ม.ค.",
    feb: "ก.พ.",
    mar: "มี.ค.",
    apr: "เม.ย.",
    may: "พ.ค.",
    jun: "มิ.ย.",
    jul: "ก.ค.",
    aug: "ส.ค.",
    sep: "ก.ย.",
    oct: "ต.ค.",
    nov: "พ.ย.",
    dec: "ธ.ค.",
    purchase_system_disabled: "ระบบการซื้อใน Minchap ปิดการใช้งานชั่วคราว"
  },
  EN: {
    home: "Home",
    myseries: "My Series",
    search: "Search",
    profile: "Profile",
    empty_desc: "Empty Page",
    recent_series: "Recent",
    favorite_series: "Favorites",
    no_data: "No data available",
    not_supported: "Not Supported",
    not_supported_desc: "This system is designed for mobile phones only. Please access via mobile.",
    share_tiktok: "Share to TikTok",
    coming_soon: "Coming soon",
    user_id: "User ID",
    version: "Version",
    profile_account_title: "My Account",
    profile_user_id: "User ID",
    app_version: "App version",
    vip_profile_title: "KlickShot VIP",
    credit_watch_title: "Unlocked episodes",
    credit_watch_desc: "Use credits to watch locked episodes",
    add_credit: "Add credit",
    view_details: "View details",
    unlimited_watch: "Unlimited Watch",
    subscribe_now: "Subscribe Now",
    unlock_credit: "Unlock Credit",
    details: "Details",
    episodes_unit: "Episodes",
    unlockable_desc: "Unlockable episodes",
    add_episodes: "Add episodes",
    unlock_text: "Unlock {n} episodes",
    discount_text: "{p}% Off",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    contact: "Contact Us",
    subscribe_vip: "Subscribe VIP",
    weekly_vip: "VIP 7 Days",
    monthly_vip: "VIP 30 Days",
    weekly_vip_desc: "Best for trying it out",
    monthly_vip_desc: "Better value for continuous watching",
    popular_badge: "Popular",
    automatic_renewal: "Auto-renews, cancel anytime",
    vip_benefits: "VIP Privileges",
    payment_development_notice: "This system is currently in development",
    payment_flow_label: "Flow",
    ok: "OK",
    no_ads: "No Ads",
    all_episodes: "Watch all episodes",
    unlimited_rewatch: "Unlimited rewatch",
    price_baht: "THB",
    contact_us_title: "Contact Us",
    contact_intro_line1: "Feedback or app issues?",
    contact_intro_line2: "Send us a message.",
    contact_feedback_tab: "Feedback",
    contact_suggestion_tab: "Suggest",
    contact_issue_tab: "Report",
    name_label: "Name",
    email_label: "Email",
    message_label: "Message",
    name_placeholder: "Your name",
    email_placeholder: "example@email.com",
    message_placeholder: "Type your feedback, suggestion, or issue here",
    send_message: "Send Message",
    contact_thanks: "Thank you for your support",
    contact_response_time: "We usually reply within 72 hours",
    subscription_history: "Subscription History",
    language_menu: "Language",
    faq: "FAQ",
    purchase_history: "Purchase History",
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
    may: "May",
    jun: "Jun",
    jul: "Jul",
    aug: "Aug",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Dec",
    purchase_system_disabled: "Minchap purchase system is temporarily disabled"
  },
  JP: {
    home: "ホーム",
    myseries: "マイシリーズ",
    search: "検索",
    profile: "プロフィール",
    empty_desc: "空白のページ",
    recent_series: "最近見たシリーズ",
    favorite_series: "お気に入り",
    no_data: "データがありません",
    not_supported: "サポートされていません",
    not_supported_desc: "このシステムは携帯電話専用です。携帯電話からアクセスしてください。",
    share_tiktok: "TikTokにシェア",
    coming_soon: "近日公開",
    user_id: "ユーザーID",
    version: "バージョン",
    profile_account_title: "マイアカウント",
    profile_user_id: "ユーザーID",
    app_version: "アプリバージョン",
    vip_profile_title: "KlickShot VIP",
    credit_watch_title: "解除済み話数",
    credit_watch_desc: "ロック話の視聴用",
    add_credit: "追加",
    view_details: "詳細を見る",
    unlimited_watch: "無制限視聴",
    subscribe_now: "今すぐ購読",
    unlock_credit: "クレジット解除",
    details: "詳細",
    episodes_unit: "エピソード",
    unlockable_desc: "解除可能なエピソード",
    add_episodes: "エピソード追加",
    unlock_text: "{n}エピソード解除",
    discount_text: "{p}%オフ",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    contact: "お問い合わせ",
    subscribe_vip: "VIPを購読",
    weekly_vip: "VIP 7日間",
    monthly_vip: "VIP 30日間",
    weekly_vip_desc: "お試し利用におすすめ",
    monthly_vip_desc: "継続視聴にお得",
    popular_badge: "人気",
    automatic_renewal: "自動更新、いつでもキャンセル可能",
    vip_benefits: "VIP特典",
    payment_development_notice: "このシステムは現在開発中です",
    payment_flow_label: "フロー",
    ok: "OK",
    no_ads: "広告なし",
    all_episodes: "すべてのエピソードを視聴",
    unlimited_rewatch: "無制限の再視聴",
    price_baht: "バーツ",
    contact_us_title: "お問い合わせ",
    contact_intro_line1: "ご意見、ご要望、または問題がありますか？",
    contact_intro_line2: "お気軽にご連絡ください。",
    contact_feedback_tab: "意見",
    contact_suggestion_tab: "提案",
    contact_issue_tab: "問題報告",
    name_label: "名前",
    email_label: "メール",
    message_label: "メッセージ",
    name_placeholder: "お名前",
    email_placeholder: "example@email.com",
    message_placeholder: "ご意見、ご要望、または問題を入力してください",
    send_message: "メッセージ送信",
    contact_thanks: "ご支援ありがとうございます",
    contact_response_time: "通常72時間以内に返信いたします",
    subscription_history: "購読履歴",
    language_menu: "言語",
    faq: "よくある質問",
    purchase_history: "購入履歴",
    jan: "1月",
    feb: "2月",
    mar: "3月",
    apr: "4月",
    may: "5月",
    jun: "6月",
    jul: "7月",
    aug: "8月",
    sep: "9月",
    oct: "10月",
    nov: "11月",
    dec: "12月",
    purchase_system_disabled: "Minchapの購入システムは一時的に停止されています"
  },
  CN: {
    home: "首页",
    myseries: "我的剧集",
    search: "搜索",
    profile: "个人资料",
    empty_desc: "空白页",
    recent_series: "最近观看",
    favorite_series: "收藏剧集",
    no_data: "暂无数据",
    not_supported: "不支持",
    not_supported_desc: "本系统专为手机设计。请通过手机访问。",
    share_tiktok: "分享到 TikTok",
    coming_soon: "敬请期待",
    user_id: "用户ID",
    version: "版本",
    profile_account_title: "我的账户",
    profile_user_id: "用户ID",
    app_version: "应用版本",
    vip_profile_title: "KlickShot VIP",
    credit_watch_title: "已解锁剧集",
    credit_watch_desc: "用于观看需要解锁的剧集",
    add_credit: "增加额度",
    view_details: "查看详情",
    unlimited_watch: "无限观看",
    subscribe_now: "立即订阅",
    unlock_credit: "解锁额度",
    details: "详情",
    episodes_unit: "集",
    unlockable_desc: "可解锁集数",
    add_episodes: "增加集数",
    unlock_text: "可解锁 {n} 集",
    discount_text: "降价 {p}%",
    terms: "使用条款",
    privacy: "隐私政策",
    contact: "联系我们",
    subscribe_vip: "订阅 VIP",
    weekly_vip: "VIP 7 天",
    monthly_vip: "VIP 30 天",
    weekly_vip_desc: "适合试用",
    monthly_vip_desc: "连续观看更划算",
    popular_badge: "最受欢迎",
    automatic_renewal: "自动续订，随时取消",
    vip_benefits: "VIP 特权",
    payment_development_notice: "此系统正在开发中",
    payment_flow_label: "流程",
    ok: "确定",
    no_ads: "无广告",
    all_episodes: "观看所有集数",
    unlimited_rewatch: "无限次观看",
    price_baht: "泰铢",
    contact_us_title: "联系我们",
    contact_intro_line1: "有建议、反馈或使用问题吗？",
    contact_intro_line2: "请给我们留言，我们乐意听取每一条意见。",
    contact_feedback_tab: "反馈",
    contact_suggestion_tab: "建议",
    contact_issue_tab: "报错",
    name_label: "姓名",
    email_label: "电子邮件",
    message_label: "消息",
    name_placeholder: "你的姓名",
    email_placeholder: "example@email.com",
    message_placeholder: "请在这里输入反馈、建议或遇到的问题",
    send_message: "发送消息",
    contact_thanks: "感谢您的支持",
    contact_response_time: "我们通常在 72 小时内回复",
    subscription_history: "订阅历史",
    language_menu: "语言",
    faq: "常见问题",
    purchase_history: "购买历史",
    jan: "1月",
    feb: "2月",
    mar: "3月",
    apr: "4月",
    may: "5月",
    jun: "6月",
    jul: "7月",
    aug: "8月",
    sep: "9月",
    oct: "10月",
    nov: "11月",
    dec: "12月",
    purchase_system_disabled: "Minchap 购买系统暂时关闭"
  }
};

const DEFAULT_LANGUAGE = "TH";
const FALLBACK_DETECTED_LANGUAGE = "EN";
const LANGUAGE_STORAGE_KEY = "minchap_lang";

const localeLanguageMap = [
  ["th", "TH"],
  ["ja", "JP"],
  ["jp", "JP"],
  ["zh", "CN"],
  ["cn", "CN"],
  ["en", "EN"],
];

export function detectDeviceLanguage() {
  if (typeof navigator === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const locales =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const locale of locales) {
    const normalized = String(locale || "").trim().toLowerCase();
    const match = localeLanguageMap.find(([prefix]) =>
      normalized === prefix || normalized.startsWith(`${prefix}-`)
    );

    if (match && translations[match[1]]) {
      return match[1];
    }
  }

  return FALLBACK_DETECTED_LANGUAGE;
}

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && translations[saved]) {
      setLanguage(saved);
    } else {
      setLanguage(detectDeviceLanguage());
    }
    setMounted(true);
  }, []);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  };

  const t = (key) => {
    // Fallback to TH if key doesn't exist in selected language
    return translations[language]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
