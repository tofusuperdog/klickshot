"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "../LanguageContext";

const faqContent = {
  TH: {
    title: "คำถามที่พบบ่อย",
    description:
      "รวมคำตอบสำหรับคำถามที่ผู้ใช้ถามบ่อย\nเพื่อช่วยให้คุณใช้งาน MinChap ได้ง่ายขึ้น",
    items: [
      {
        question: "สมัคร VIP ได้ที่ไหน?",
        answer: "ไปที่หน้าโปรไฟล์ แล้วเลือกเมนู VIP เพื่อสมัครแพ็กเกจที่ต้องการ",
      },
      {
        question: "VIP ใช้ดูอะไรได้บ้าง?",
        answer: "สมาชิก VIP สามารถรับชมซีรีส์ได้ไม่จำกัด ตามแพ็กเกจ 7 วัน และ 30 วัน",
      },
      {
        question: "ดูประวัติการสมัครได้ที่ไหน?",
        answer: "ไปที่หน้าโปรไฟล์ แล้วเลือกเมนูประวัติการสมัคร",
      },
      {
        question: "เปลี่ยนภาษาแอปได้อย่างไร?",
        answer:
          "ไปที่หน้าโปรไฟล์ กดปุ่มภาษา แล้วเลือกภาษาที่ต้องการ เช่น TH, EN, JP หรือ CN",
      },
      {
        question: "ต้องการความช่วยเหลือ ติดต่อได้ที่ไหน?",
        answer:
          "กดปุ่ม “ติดต่อเรา” ด้านล่างของหน้านี้ เพื่อสอบถามทีมงานได้ทันที",
      },
    ],
  },
  EN: {
    title: "FAQ",
    description:
      "Answers to common questions from users\nso you can use MinChap more easily",
    items: [
      {
        question: "Where can I subscribe to VIP?",
        answer: "Go to the profile page and select VIP to subscribe to the plan you want.",
      },
      {
        question: "What can I watch with VIP?",
        answer: "VIP members can watch series without limits with the 7-day and 30-day plans.",
      },
      {
        question: "Where can I view subscription history?",
        answer: "Go to the profile page and select Subscription History.",
      },
      {
        question: "How do I change the app language?",
        answer:
          "Go to the profile page, tap the language button, then choose your preferred language such as TH, EN, JP, or CN.",
      },
      {
        question: "Where can I get help?",
        answer: "Tap the Contact Us button at the bottom of this page to contact our team right away.",
      },
    ],
  },
  JP: {
    title: "よくある質問",
    description:
      "ユーザーからよく寄せられる質問への回答をまとめました\nMinChapをより簡単にご利用いただくためのヘルプです",
    items: [
      {
        question: "VIPにはどこから登録できますか？",
        answer: "プロフィールページでVIPメニューを選択し、希望するプランに登録してください。",
      },
      {
        question: "VIPでは何を視聴できますか？",
        answer: "VIP会員は、7日間プランと30日間プランでシリーズを無制限に視聴できます。",
      },
      {
        question: "登録履歴はどこで確認できますか？",
        answer: "プロフィールページで登録履歴メニューを選択してください。",
      },
      {
        question: "アプリの言語はどう変更できますか？",
        answer:
          "プロフィールページで言語ボタンを押し、TH、EN、JP、CNなど希望する言語を選択してください。",
      },
      {
        question: "サポートが必要な場合はどこに連絡できますか？",
        answer: "このページ下部の「お問い合わせ」ボタンを押すと、すぐにチームへ連絡できます。",
      },
    ],
  },
  CN: {
    title: "常见问题",
    description: "整理用户常见问题的答案\n帮助您更轻松地使用 MinChap",
    items: [
      {
        question: "在哪里订阅 VIP？",
        answer: "前往个人资料页面，选择 VIP 菜单，然后订阅您需要的套餐。",
      },
      {
        question: "VIP 可以观看哪些内容？",
        answer: "VIP 会员可根据 7 天和 30 天套餐无限观看剧集。",
      },
      {
        question: "在哪里查看订阅历史？",
        answer: "前往个人资料页面，选择订阅历史菜单。",
      },
      {
        question: "如何更改应用语言？",
        answer: "前往个人资料页面，点击语言按钮，然后选择 TH、EN、JP 或 CN 等所需语言。",
      },
      {
        question: "需要帮助时在哪里联系？",
        answer: "点击本页面底部的“联系我们”按钮，即可立即咨询团队。",
      },
    ],
  },
};

const faqContactCta = {
  TH: {
    title: "ยังไม่พบคำตอบที่ต้องการ?",
    subtitle:
      "สามารถติดต่อทีมสนับสนุนของเราได้ทุกเมื่อ ผ่านปุ่ม “ติดต่อเรา” ด้านล่างนี้",
    action: "ติดต่อเรา",
  },
  EN: {
    title: "Still cannot find the answer?",
    subtitle: "You can contact our support team anytime through the Contact Us button below.",
    action: "Contact Us",
  },
  JP: {
    title: "お探しの回答がまだ見つかりませんか？",
    subtitle: "下の「お問い合わせ」ボタンから、いつでもサポートチームにご連絡いただけます。",
    action: "お問い合わせ",
  },
  CN: {
    title: "仍未找到需要的答案？",
    subtitle: "您可以随时通过下方的“联系我们”按钮联系支持团队。",
    action: "联系我们",
  },
};

const faqIcons = [
  {
    className: "bg-[#6D36D8] shadow-[0_0_14px_rgba(109,54,216,0.45)]",
    paths: [
      <path key="crown" d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z" />,
      <path key="base" d="M5 20h14" />,
    ],
  },
  {
    className: "bg-[#6D36D8] shadow-[0_0_14px_rgba(109,54,216,0.45)]",
    paths: [
      <path key="screen" d="M4 6h16v10H4z" />,
      <path key="play" d="m10 9 4 2-4 2V9z" />,
      <path key="base" d="M8 20h8" />,
      <path key="stand" d="M12 16v4" />,
    ],
  },
  {
    className: "bg-[#6D36D8] shadow-[0_0_14px_rgba(109,54,216,0.45)]",
    paths: [
      <path key="clock" d="M12 8v5l3 2" />,
      <path key="circle" d="M21 12a9 9 0 1 1-3.3-7" />,
      <path key="arrow" d="M21 4v5h-5" />,
    ],
  },
  {
    className: "bg-[#6D36D8] shadow-[0_0_14px_rgba(109,54,216,0.45)]",
    paths: [
      <circle key="circle" cx="12" cy="12" r="9" />,
      <path key="horizontal" d="M3 12h18" />,
      <path key="east" d="M12 3a14 14 0 0 1 0 18" />,
      <path key="west" d="M12 3a14 14 0 0 0 0 18" />,
    ],
  },
  {
    className: "bg-[#6D36D8] shadow-[0_0_14px_rgba(109,54,216,0.45)]",
    paths: [
      <path key="bubble" d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
      <path key="dot1" d="M8 10h.01" />,
      <path key="dot2" d="M12 10h.01" />,
      <path key="dot3" d="M16 10h.01" />,
    ],
  },
];

export default function AppFaq() {
  const { language } = useLanguage();
  const router = useRouter();
  const content = faqContent[language] || faqContent.TH;
  const contactCta = faqContactCta[language] || faqContactCta.TH;

  return (
    <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-black px-6 pb-8 pt-6 text-white no-scrollbar">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          {content.title}
        </h1>
        <p className="whitespace-pre-line text-[14px] font-medium leading-relaxed text-white/60">
          {content.description}
        </p>
      </div>

      <div className="space-y-4">
        {content.items.map((item, index) => {
          const icon = faqIcons[index];

          return (
            <section
              key={item.question}
              className="rounded-[8px] border border-[#5F2EA1] bg-[linear-gradient(135deg,rgba(23,20,31,0.96),rgba(8,8,12,0.98))] px-4 py-3.5 shadow-[0_0_18px_rgba(126,63,210,0.16),inset_0_0_18px_rgba(255,255,255,0.03)]"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-white ${icon.className}`}>
                  <svg
                    className="h-[17px] w-[17px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {icon.paths}
                  </svg>
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h2 className="mb-1.5 text-[15px] font-extrabold leading-tight text-white">
                    {item.question}
                  </h2>
                  <p className="text-[12px] font-medium leading-relaxed text-[#AFA8BA]">
                    {item.answer}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-5 rounded-[8px] border border-[#7B35D8] bg-[linear-gradient(135deg,rgba(19,12,30,0.98),rgba(7,7,11,0.98))] p-4 shadow-[0_0_22px_rgba(126,63,210,0.22),inset_0_0_20px_rgba(255,255,255,0.03)]">
        <div className="flex items-start gap-3">
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-[#8D48EF] bg-[#170C29] text-[#C482FF] shadow-[0_0_18px_rgba(141,72,239,0.34)]">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-2v-8h4v6Z" />
              <path d="M3 19a2 2 0 0 0 2 2h2v-8H3v6Z" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-extrabold leading-tight text-white">
              {contactCta.title}
            </h2>
            <p className="mt-1 text-[12px] font-medium leading-snug text-[#AFA8BA]">
              {contactCta.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/contact")}
          className="mt-4 w-full rounded-[8px] bg-[linear-gradient(180deg,#B46CFF,#7B2DE2)] px-4 py-2.5 text-[13px] font-extrabold text-white shadow-[0_0_16px_rgba(180,108,255,0.34),inset_0_1px_0_rgba(255,255,255,0.34)]"
        >
          {contactCta.action}
        </button>
      </section>
    </div>
  );
}
