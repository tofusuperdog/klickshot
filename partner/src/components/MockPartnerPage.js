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
        {cards.map(([cardTitle, detail]) => (
          <article className="mock-card" key={cardTitle}>
            <span>{cardTitle}</span>
            <strong>{detail}</strong>
          </article>
        ))}
      </div>

      <div className="placeholder-panel">
        <div>
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
