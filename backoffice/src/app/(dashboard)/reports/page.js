import Image from "next/image";

export default function ReportsPage() {
  return (
    <div className="w-full pb-20">
      <div className="flex items-center mb-8 space-x-3 text-white">
        <div className="relative w-9 h-9">
          <Image
            src="/report.svg"
            alt="Reports"
            fill
            sizes="36px"
            style={{ objectFit: "contain" }}
          />
        </div>
        <h1 className="text-xl font-semibold text-gray-300">รายงาน</h1>
      </div>

      <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-[#2d2252] bg-[#12102f]/60 shadow-lg">
        <p className="text-lg font-light text-gray-300">
          อดใจไว้หน่อยนะ กำลังทำอยู่
        </p>
      </div>
    </div>
  );
}
