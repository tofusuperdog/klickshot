"use client";

import { useLanguage } from "../LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const termsContent = {
  TH: {
    title: "ข้อกำหนดการใช้งาน",
    effectiveDate: "เริ่มมีผลบังคับใช้: 19 กันยายน 2567",
    intro: "ข้อกำหนดการใช้งานเหล่านี้ควบคุมการใช้แอปพลิเคชัน minchap ของคุณ โปรดอ่านและทำความเข้าใจก่อนเริ่มใช้งานแอปพลิเคชัน",
    sections: [
      {
        title: "1. การยอมรับข้อกำหนด",
        content: "ในการเข้าถึงและใช้งานแอปพลิเคชัน minchap คุณตกลงและยอมรับข้อกำหนดการใช้งานเหล่านี้ หากคุณไม่ตกลงตามข้อกำหนดเหล่านี้ โปรดระดมการใช้งานแอปพลิเคชัน"
      },
      {
        title: "2. บัญชีผู้ใช้และความปลอดภัย",
        list: [
          "คุณต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันเมื่อลงทะเบียนบัญชี",
          "คุณมีหน้าที่รับผิดชอบแต่เพียงผู้เดียวในการรักษาความลับของรหัสผ่านหรือข้อมูลการเข้าถึงบัญชีของคุณ"
        ]
      },
      {
        title: "3. การใช้งานที่ได้รับอนุญาต",
        list: [
          "คุณตกลงที่จะใช้แอปพลิเคชันของเราในลักษณะที่ชอบด้วยกฎหมายและไม่ละเมิดสิทธิของผู้อื่น",
          "คุณไม่สามารถคัดลอก ทำซ้ำ หรือแก้ไขเนื้อหาภายในแอปโดยไม่ได้รับอนุญาตล่วงหน้า"
        ]
      },
      {
        title: "4. การระงับและการยกเลิกบัญชี",
        content: "เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกการเข้าถึงแอปพลิเคชันของคุณทันทีหากคุณละเมิดข้อกำหนดการใช้งานเหล่านี้"
      },
      {
        title: "5. ข้อจำกัดความรับผิด",
        content: "เราจะไม่รับผิดชอบต่อความเสียหายโดยตรงหรือโดยอ้อมที่เกิดจากการใช้งานหรือการไม่สามารถใช้งานแอปพลิเคชันได้"
      },
      {
        title: "6. การแก้ไขข้อกำหนด",
        content: "บริษัทขอสงวนสิทธิ์ในการแก้ไขหรืออัปเดตข้อกำหนดเหล่านี้ได้ทุกเมื่อ การใช้งานแอปพลิเคชันต่อไปของคุณหลังจากการเปลี่ยนแปลงใดๆ จะถือว่าคุณยอมรับข้อกำหนดที่ได้รับแก้ไขแล้ว"
      },
      {
        title: "7. กฎหมายที่ใช้บังคับ",
        content: "ข้อกำหนดการใช้งานเหล่านี้อยู่ภายใต้บังคับและตีความตามกฎหมายของราชอาณาจักรไทย"
      }
    ]
  },
  EN: {
    title: "Terms of Service",
    effectiveDate: "Effective Date: September 19, 2024",
    intro: "These Terms of Service govern your use of the minchap application. Please read and understand them before you begin using the application.",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: "By accessing and using the minchap application, you agree to and accept these Terms of Service. If you do not agree to these terms, please refrain from using the application."
      },
      {
        title: "2. User Account and Security",
        list: [
          "You must provide accurate and up-to-date information when registering an account.",
          "You are solely responsible for maintaining the confidentiality of your password or account access information."
        ]
      },
      {
        title: "3. Permitted Use",
        list: [
          "You agree to use our application in a lawful manner and not infringe upon the rights of others.",
          "You may not copy, reproduce, or modify the content within the app without prior permission."
        ]
      },
      {
        title: "4. Account Suspension and Termination",
        content: "We reserve the right to immediately suspend or terminate your access to the application if you violate these Terms of Service."
      },
      {
        title: "5. Limitation of Liability",
        content: "We shall not be liable for any direct or indirect damages arising from the use or inability to use the application."
      },
      {
        title: "6. Modification of Terms",
        content: "The company reserves the right to amend or update these terms at any time. Your continued use of the application after any changes will constitute your acceptance of the revised terms."
      },
      {
        title: "7. Governing Law",
        content: "These Terms of Service are governed by and construed in accordance with the laws of the Kingdom of Thailand."
      }
    ]
  },
  JP: {
    title: "利用規約",
    effectiveDate: "発効日: 2024年9月19日",
    intro: "この利用規約は、minchap アプリケーションの使用に適用されます。アプリケーションの使用を開始する前に、これらを読んで理解してください。",
    sections: [
      {
        title: "1. 規約の承諾",
        content: "minchap アプリケーションにアクセスして使用することにより、これらの利用規約に同意し、承諾したものとみなされます。これらの規約に同意しない場合は、アプリケーションの使用を控えてください。"
      },
      {
        title: "2. ユーザーアカウントとセキュリティ",
        list: [
          "アカウントを登録する際は、正確かつ最新の情報を提供する必要があります。",
          "パスワードまたはアカウントアクセス情報の機密性を維持することは、お客様独自の責任です。"
        ]
      },
      {
        title: "3. 許可された使用",
        list: [
          "お客様は、当社のアプリケーションを合法的な方法で使用し、他人の権利を侵害しないことに同意します。",
          "事前の許可なく、アプリ内のコンテンツをコピー、複製、または変更することはできません。"
        ]
      },
      {
        title: "4. アカウントの停止および終了",
        content: "これらの利用規約に違反した場合、当社はアプリケーションへのアクセスを直ちに停止または終了する権利を留保します。"
      },
      {
        title: "5. 責任の制限",
        content: "アプリケーションの使用または使用不能から生じる直接的または間接的な損害について、当社は責任を負いません。"
      },
      {
        title: "6. 規約の変更",
        content: "当社は、いつでもこれらの規約を修正または更新する権利を留保します。変更後も引き続きアプリケーションを使用することで、修正された規約に同意したものとみなされます。"
      },
      {
        title: "7. 準拠法",
        content: "これらの利用規約は、タイ王国の法律に従って管理および解釈されます。"
      }
    ]
  },
  CN: {
    title: "使用条款",
    effectiveDate: "生效日期：2024年9月19日",
    intro: "这些使用条款约束您对 minchap 应用程序的使用。在开始使用应用程序之前，请阅读并理解这些条款。",
    sections: [
      {
        title: "1. 接受条款",
        content: "访问并使用 minchap 应用程序，即表示您同意并接受这些使用条款。如果您不同意这些条款，请停止使用该应用程序。"
      },
      {
        title: "2. 用户账户与安全",
        list: [
          "注册账户时，您必须提供准确且最新的信息。",
          "您全权负责维护您的密码或账户访问信息的机密性。"
        ]
      },
      {
        title: "3. 许可使用",
        list: [
          "您同意以合法方式使用我们的应用程序，且不侵犯他人的权利。",
          "未经事先许可，您不得复制、再造或修改应用程序中的内容。"
        ]
      },
      {
        title: "4. 账户暂停与终止",
        content: "如果您违反这些使用条款，我们保留立即暂停或终止您访问应用程序的权利。"
      },
      {
        title: "5. 责任限制",
        content: "对于因使用或无法使用应用程序而产生的任何直接或间接损害，我们概不负责。"
      },
      {
        title: "6. 条款修改",
        content: "公司保留随时修改或更新这些条款的权利。在任何变更后继续使用该应用程序即表示您接受修订后的条款。"
      },
      {
        title: "7. 适用法律",
        content: "这些使用条款受泰王国法律管辖并按其解释。"
      }
    ]
  }
};

const termsHeaderContent = {
  TH: {
    title: "ข้อกำหนดการใช้งาน",
    updated: "เริ่มมีผลบังคับใช้: 19 กันยายน 2567",
    intro:
      "ข้อกำหนดนี้อธิบายเงื่อนไขการใช้งาน MinChap เพื่อให้ทุกคนใช้งานแอปได้อย่างปลอดภัยและเป็นธรรม",
    summaryTitle: "สรุปแบบเข้าใจง่าย",
    bullets: [
      "การใช้งานแอปถือว่าคุณยอมรับข้อกำหนดนี้",
      "โปรดใช้บัญชีและข้อมูลของคุณอย่างปลอดภัย",
      "ห้ามคัดลอกหรือดัดแปลงเนื้อหาโดยไม่ได้รับอนุญาต",
      "เราอาจปรับปรุงข้อกำหนดเมื่อจำเป็น",
    ],
  },
  EN: {
    title: "Terms of Use",
    updated: "Effective date: September 19, 2024",
    intro:
      "These terms explain how MinChap should be used so everyone can enjoy the app safely and fairly.",
    summaryTitle: "Simple Summary",
    bullets: [
      "Using the app means you accept these terms",
      "Keep your account and access information secure",
      "Do not copy or modify content without permission",
      "We may update these terms when needed",
    ],
  },
  JP: {
    title: "利用規約",
    updated: "発効日: 2024年9月19日",
    intro:
      "この規約は、MinChapを安全かつ公正に利用するための条件を説明するものです。",
    summaryTitle: "かんたん概要",
    bullets: [
      "アプリの利用は規約への同意を意味します",
      "アカウント情報を安全に管理してください",
      "許可なくコンテンツを複製・変更しないでください",
      "必要に応じて規約を更新する場合があります",
    ],
  },
  CN: {
    title: "使用条款",
    updated: "生效日期: 2024年9月19日",
    intro:
      "这些条款说明 MinChap 的使用规则，帮助大家安全、公平地使用应用。",
    summaryTitle: "简明摘要",
    bullets: [
      "使用应用即表示您接受这些条款",
      "请妥善保护您的账户和访问信息",
      "未经许可不得复制或修改内容",
      "我们可能在需要时更新这些条款",
    ],
  },
};

export default function AppTerms() {
  const { language, changeLanguage } = useLanguage();
  const router = useRouter();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef(null);
  const languages = ["TH", "EN", "JP", "CN"];
  const content = termsContent[language] || termsContent.TH;
  const headerContent = termsHeaderContent[language] || termsHeaderContent.TH;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target)
      ) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-black text-white no-scrollbar">
      <header className="hidden">
        <button onClick={() => router.back()} className="p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div className="flex items-center">
          <img
            src="/minchap.svg"
            alt="MinChap"
            className="object-contain w-auto h-6"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 rounded border border-white/10 bg-[#1A1A1A] px-2 py-1 text-xs font-semibold uppercase text-white/90"
            >
              {language}
              <svg
                className={`h-3 w-3 transition-transform ${isLangOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isLangOpen && (
              <div className="absolute right-0 z-50 mt-2 flex w-20 flex-col rounded-lg border border-white/10 bg-[#1A1A1A] py-1 shadow-lg">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      changeLanguage(lang);
                      setIsLangOpen(false);
                    }}
                    className={`px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${language === lang ? "font-bold text-white" : "text-white/60"}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex h-8 w-8 items-center justify-center rounded text-white/90 opacity-60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          <button onClick={() => router.push("/")} className="p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <main className="relative overflow-hidden px-4 pb-8 pt-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-[radial-gradient(circle_at_50%_0%,rgba(167,70,255,0.24),transparent_54%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-[390px] flex-col">
          <section className="mb-5">
            <div className="mb-5 flex items-start gap-4">
              <div className="relative h-[43px] w-[43px] shrink-0">
                <img
                  src="/terms-shield.svg"
                  alt=""
                  className="h-full w-full object-contain drop-shadow-[0_0_26px_rgba(166,72,255,0.72)]"
                />
              </div>

              <div className="min-w-0 flex-1 pt-1">
                <h1 className="text-[27px] font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.34)]">
                  {headerContent.title}
                </h1>
                <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold leading-tight text-[#A9A3B4]">
                  <svg
                    className="h-4 w-4 shrink-0 text-[#B96AFF]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                  </svg>
                  <span>{headerContent.updated}</span>
                </div>
                <p className="mt-4 text-[14px] font-medium leading-relaxed text-[#B8B2C1]">
                  {headerContent.intro}
                </p>
              </div>
            </div>

            <div className="rounded-[18px] border border-[#9144DD] bg-[linear-gradient(135deg,rgba(33,20,49,0.92),rgba(11,8,20,0.98))] p-5 shadow-[0_0_22px_rgba(146,68,221,0.20)]">
              <div>
                <h2 className="mb-3 text-[23px] font-extrabold leading-tight text-white">
                  {headerContent.summaryTitle}
                </h2>
                <div className="space-y-2.5">
                  {headerContent.bullets.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-[13px] font-black leading-none text-[#1B1029]">
                        ✓
                      </span>
                      <p className="text-[13px] font-medium leading-snug text-[#D4CEDD]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-3">
            {content.sections.map((section, idx) => (
              <section
                key={section.title}
                className="rounded-[16px] border border-[#24212D] bg-[linear-gradient(135deg,rgba(31,24,42,0.90),rgba(9,8,16,0.96))] p-4 shadow-[inset_0_0_24px_rgba(255,255,255,0.03)]"
              >
                <div className="flex gap-4">
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#8E37E4]/60 bg-[#1B1029] text-[15px] font-extrabold text-[#C37BFF]">
                    {String(idx + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="mb-2 text-[18px] font-extrabold leading-tight text-white">
                      {section.title.replace(/^\d+\.\s*/, "")}
                    </h2>
                    {section.content && (
                      <p className="text-[13px] font-medium leading-relaxed text-[#A9A3B4]">
                        {section.content}
                      </p>
                    )}
                    {section.list && (
                      <ul className="mt-3 space-y-1.5">
                        {section.list.slice(0, 3).map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-[13px] font-medium leading-relaxed text-[#A9A3B4]"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B96AFF]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
