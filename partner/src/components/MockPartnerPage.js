function MockIcon({ name }) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "series") {
    return (
      <svg {...commonProps}>
        <path d="M4 7.5h16" />
        <path d="M7.5 4v7" />
        <path d="M16.5 4v7" />
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="m10 14 4 2-4 2v-4Z" />
      </svg>
    );
  }

  if (name === "billing") {
    return (
      <svg {...commonProps}>
        <path d="M7 7h10" />
        <path d="M7 11h10" />
        <path d="M7 15h6" />
        <path d="M5 3h14v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V3Z" />
      </svg>
    );
  }

  if (name === "status") {
    return (
      <svg {...commonProps}>
        <path d="M5 13.5 9 17 19 7" />
        <path d="M21 12a9 9 0 1 1-5.4-8.25" />
      </svg>
    );
  }

  if (name === "trend") {
    return (
      <svg {...commonProps}>
        <path d="M4 17 9 12l4 4 7-8" />
        <path d="M15 8h5v5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-6" />
    </svg>
  );
}

export default function MockPartnerPage({ title, description, cards }) {
  return (
    <>
      <header className="content-header">
        <div>
          <p className="section-label">Klickshot Partner</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="mock-badge">Mockup</span>
      </header>

      <div className="mock-grid">
        {cards.map((card) => {
          const [cardTitle, detail, icon = "chart"] = Array.isArray(card)
            ? card
            : [card.title, card.detail, card.icon];

          return (
          <article className="mock-card" key={cardTitle}>
            <div className="mock-icon">
              <MockIcon name={icon} />
            </div>
            <div>
              <span>{cardTitle}</span>
              <strong>{detail}</strong>
            </div>
          </article>
          );
        })}
      </div>

      <div className="placeholder-panel">
        <div>
          <div className="placeholder-visual" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>จะทำต่อในขั้นถัดไป</h2>
          <p>
            พื้นที่นี้เป็นโครงหน้า MVP ก่อนเชื่อมข้อมูลจริง ระบบต่อไปจะเพิ่ม API
            สำหรับดึงยอดวิว ซีรีส์ และข้อมูลรอบบิลของผู้ผลิตคอนเทนต์รายนี้โดยเฉพาะ
          </p>
        </div>
      </div>
    </>
  );
}
