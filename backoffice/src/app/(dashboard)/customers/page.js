import Image from 'next/image';

export default function CustomersPage() {
  return (
    <div className="w-full pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 text-white">
          <div className="relative w-9 h-9">
            <Image src="/customers.svg" alt="Customers" fill sizes="36px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-xl text-gray-300 font-semibold tracking-wide">ลูกค้า</h1>
        </div>
      </div>
      {/* TODO: Add content */}
    </div>
  );
}
