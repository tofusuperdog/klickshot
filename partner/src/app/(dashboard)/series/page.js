import MockPartnerPage from "@/components/MockPartnerPage";

export default function SeriesPage() {
  return (
    <MockPartnerPage
      title="ซีรีส์ของฉัน"
      description="หน้านี้จะแสดงรายการซีรีส์ทั้งหมดของผู้ผลิตคอนเทนต์ พร้อมยอดวิวรวม จำนวนตอน และทางเข้าไปดูรายละเอียดรายตอน"
      cards={[
        ["รายการซีรีส์", "จะแสดงผลงานตาม producer", "series"],
        ["ยอดวิวรายตอน", "จะเพิ่มกราฟ EP1, EP2, EP3", "trend"],
        ["สถานะเผยแพร่", "จะดึงจากระบบจริง", "status"],
      ]}
    />
  );
}
