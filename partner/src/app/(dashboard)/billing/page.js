import MockPartnerPage from "@/components/MockPartnerPage";

export default function BillingPage() {
  return (
    <MockPartnerPage
      title="สรุปรอบบิล"
      description="หน้านี้จะแสดงข้อมูลหลังปิดรอบบิล เช่น ยอดวิวที่ใช้สรุป สถานะการตรวจสอบ และยอดจ่ายที่ทีม Klickshot ยืนยันแล้ว"
      cards={[
        ["รอบบิลล่าสุด", "รอสรุปรายได้จาก platform", "billing"],
        ["สถานะ", "กำลังออกแบบ workflow", "status"],
        ["เอกสาร", "จะเพิ่ม export ภายหลัง", "chart"],
      ]}
    />
  );
}
