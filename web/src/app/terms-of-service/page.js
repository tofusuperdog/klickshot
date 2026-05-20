import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | minchap',
  description: 'Terms of Service for the minchap application.',
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#11154D] to-[#291337] text-gray-200 font-sans px-4 py-8 md:p-12 selection:bg-[#6a90f1] selection:text-white relative overflow-x-hidden">
      
      {/* Background glow behind center content */}
      <div className="fixed inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
        <div className="w-[800px] h-[800px] bg-[#6a90f1] rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-3xl mx-auto md:bg-[#1a113a]/60 md:backdrop-blur-xl md:rounded-3xl p-4 md:p-12 md:shadow-2xl md:border md:border-white/10 relative z-10 mt-4 md:mt-8 mb-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6a90f1] to-[#d67bfa]">
            Terms of Service
          </h1>
          <p className="mt-4 text-gray-400">Effective Date: September 19, 2024</p>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-300">
          <p className="text-lg text-gray-200">
            These Terms of Service govern your use of the minchap application. Please read and understand them before you begin using the application.
          </p>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing and using the minchap application, you agree to and accept these Terms of Service. If you do not agree to these terms, please refrain from using the application.
            </p>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">2</span>
              User Account and Security
            </h2>
            <ul className="list-disc pl-5 space-y-2 ml-4">
              <li>You must provide accurate and up-to-date information when registering an account.</li>
              <li>You are solely responsible for maintaining the confidentiality of your password or account access information.</li>
            </ul>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">3</span>
              Permitted Use
            </h2>
            <ul className="list-disc pl-5 space-y-2 ml-4">
              <li>You agree to use our application in a lawful manner and not infringe upon the rights of others.</li>
              <li>You may not copy, reproduce, or modify the content within the app without prior permission.</li>
            </ul>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">4</span>
              Account Suspension and Termination
            </h2>
            <p>
              We reserve the right to immediately suspend or terminate your access to the application if you violate these Terms of Service.
            </p>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">5</span>
              Limitation of Liability
            </h2>
            <p>
              We shall not be liable for any direct or indirect damages arising from the use or inability to use the application.
            </p>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">6</span>
              Modification of Terms
            </h2>
            <p>
              The company reserves the right to amend or update these terms at any time. Your continued use of the application after any changes will constitute your acceptance of the revised terms.
            </p>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">7</span>
              Governing Law
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the Kingdom of Thailand.
            </p>
          </section>
        </div>

        <div className="mt-12 flex justify-center">
          <Link 
            href="/"
            className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 hover:border-white/30 flex items-center gap-2 hover:-translate-x-1"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
