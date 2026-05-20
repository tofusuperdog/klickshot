import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | minchap',
  description: 'Privacy Policy for the minchap application.',
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#11154D] to-[#291337] text-gray-200 font-sans px-4 py-8 md:p-12 selection:bg-[#6a90f1] selection:text-white relative overflow-x-hidden">
      
      {/* Background glow behind center content */}
      <div className="fixed inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
        <div className="w-[800px] h-[800px] bg-[#6a90f1] rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-4xl mx-auto md:bg-[#1a113a]/60 md:backdrop-blur-xl md:rounded-3xl p-4 md:p-12 md:shadow-2xl md:border md:border-white/10 relative z-10 mt-4 md:mt-8 mb-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6a90f1] to-[#d67bfa]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-gray-400">Effective Date: September 19, 2024</p>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-300">
          <p className="text-lg text-gray-200">
            The minchap app respects user privacy. We are committed to securing and protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
          </p>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">1</span>
              Collection of Personal Information
            </h2>
            <p className="mb-2">We will collect personal information necessary for using the app, such as:</p>
            <ul className="list-disc pl-5 space-y-2 ml-4">
              <li><strong>Personal details:</strong> Name, Email</li>
              <li><strong>Payment information:</strong> For purchasing content within the app, credit card or payment gateway details will be securely collected via third-party payment providers.</li>
            </ul>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">2</span>
              Use of Personal Information
            </h2>
            <p className="mb-2">Your personal information will be used for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2 ml-4">
              <li>To provide and improve your user experience within the app.</li>
              <li>To process and manage payments for content purchases.</li>
              <li>To communicate with you regarding your account, content of interest, or app updates.</li>
            </ul>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">3</span>
              Sharing of Information
            </h2>
            <p className="mb-2">We will not sell, share, or trade your personal information with third parties, except in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 ml-4">
              <li>With your explicit consent.</li>
              <li>When it is necessary to share information with third parties to provide services, such as payment providers.</li>
              <li>When required by law or a court order compelling us to disclose the information.</li>
            </ul>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">4</span>
              Data Security
            </h2>
            <p>
              We implement technical and organizational measures to secure your personal information, such as encrypting data during transmission and storing it in secure systems. We will follow appropriate standards to prevent unauthorized access to data.
            </p>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">5</span>
              Data Retention
            </h2>
            <p>
              We will retain your personal information for as long as necessary for the purposes for which it was collected or as required by law. Once your information is no longer needed, we will securely delete or destroy it.
            </p>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">6</span>
              User Rights
            </h2>
            <p>
              You have the right to access, modify, or request the deletion of your personal information at any time. You may contact us to make such requests using the information provided in the "Contact Us" section.
            </p>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">7</span>
              Changes to the Privacy Policy
            </h2>
            <p>
              We reserve the right to modify this Privacy Policy as necessary. If there are changes to this policy, we will notify you through the app.
            </p>
          </section>

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5 md:shadow-[0_0_15px_rgba(106,144,241,0.15)]">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm">8</span>
              Contact Us
            </h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:support@minchapseries.com" className="text-[#6a90f1] hover:underline underline-offset-4">
                support@minchapseries.com
              </a>
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
