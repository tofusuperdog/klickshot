import MockPartnerPage from "@/components/MockPartnerPage";

export default function DashboardPage() {
  return (
    <MockPartnerPage
      title="ภาพรวมผลงาน"
      description="หน้านี้จะสรุปยอดวิวรวม แนวโน้มรายวัน ซีรีส์ที่ทำผลงานดีที่สุด และจุดที่ควรติดตามในรอบปัจจุบัน"
      cards={[
        ["ยอดวิวรอบนี้", "จะเชื่อมข้อมูลภายหลัง"],
        ["ซีรีส์อันดับ 1", "จะสรุปจากข้อมูลจริง"],
        ["ตอนที่ควรตรวจสอบ", "จะวิเคราะห์ drop-off"],
      ]}
    />
  );
}
