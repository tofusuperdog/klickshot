import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | KlickShot',
  description: 'Privacy Policy for the KlickShot app, website, and related services.',
};

const sections = [
  {
    number: '1',
    title: 'Collection of Personal Information',
    content: (
      <>
        <p className="mb-2">
          We may collect personal information necessary for using the app and providing our services, including but not limited to:
        </p>
        <ul className="list-disc pl-5 space-y-2 ml-4">
          <li>
            <strong>Personal details:</strong> such as name, email address, account information, and profile information.
          </li>
          <li>
            <strong>Payment information:</strong> when you purchase content or services within the app, payment-related information may be processed securely by third-party payment providers. LOVEDRAMA CO., LTD. does not directly store your full credit card details.
          </li>
          <li>
            <strong>Device and usage information:</strong> such as device type, operating system, app version, IP address, language settings, access times, pages viewed, features used, and interactions with content.
          </li>
          <li>
            <strong>Customer support information:</strong> such as messages, inquiries, feedback, or other information you provide when contacting us.
          </li>
        </ul>
      </>
    ),
  },
  {
    number: '2',
    title: 'Use of Personal Information',
    content: (
      <>
        <p className="mb-2">We may use your personal information for the following purposes:</p>
        <ul className="list-disc pl-5 space-y-2 ml-4">
          <li>To provide, operate, and improve the KlickShot app and services.</li>
          <li>To create, manage, and maintain your account.</li>
          <li>To process purchases, subscriptions, payments, and related transactions.</li>
          <li>To provide access to content, features, and services within the app.</li>
          <li>To communicate with you about your account, service updates, security notices, and customer support matters.</li>
          <li>To personalize your user experience and recommend relevant content.</li>
          <li>To analyze usage trends and improve the performance, functionality, and security of our services.</li>
          <li>To prevent fraud, unauthorized access, abuse, or other illegal activities.</li>
          <li>To comply with legal obligations, regulatory requirements, and applicable laws.</li>
        </ul>
      </>
    ),
  },
  {
    number: '3',
    title: 'Sharing of Information',
    content: (
      <>
        <p className="mb-4">We do not sell or trade your personal information.</p>
        <p className="mb-2">We may share your information only in the following circumstances:</p>
        <ul className="list-disc pl-5 space-y-2 ml-4">
          <li>With your consent.</li>
          <li>With service providers who help us operate the app and provide services, such as hosting providers, analytics providers, customer support tools, and payment processors.</li>
          <li>With third-party payment providers for processing payments and transactions.</li>
          <li>When required by law, regulation, legal process, court order, or government request.</li>
          <li>To protect the rights, property, safety, or security of LOVEDRAMA CO., LTD., our users, or the public.</li>
          <li>In connection with a merger, acquisition, restructuring, or transfer of business assets, where permitted by applicable law.</li>
        </ul>
        <p className="mt-4">
          All third-party service providers are expected to handle personal information in accordance with applicable privacy and security standards.
        </p>
      </>
    ),
  },
  {
    number: '4',
    title: 'Data Security',
    content: (
      <div className="space-y-4">
        <p>
          We implement reasonable technical, administrative, and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, loss, misuse, or destruction.
        </p>
        <p>
          These measures may include encryption, access controls, secure storage systems, monitoring, and other security practices designed to protect user data.
        </p>
        <p>
          However, please note that no method of data transmission over the internet or method of electronic storage is completely secure. While we strive to protect your personal information, we cannot guarantee absolute security.
        </p>
      </div>
    ),
  },
  {
    number: '5',
    title: 'Data Retention',
    content: (
      <div className="space-y-4">
        <p>
          We will retain your personal information only for as long as necessary to fulfill the purposes described in this Privacy Policy, provide our services, comply with legal obligations, resolve disputes, enforce our agreements, and maintain security.
        </p>
        <p>
          When your personal information is no longer necessary, we will securely delete, anonymize, or otherwise dispose of it in accordance with applicable laws and internal policies.
        </p>
      </div>
    ),
  },
  {
    number: '6',
    title: 'User Rights',
    content: (
      <>
        <p className="mb-2">
          Depending on your location and applicable laws, you may have certain rights regarding your personal information, including the right to:
        </p>
        <ul className="list-disc pl-5 space-y-2 ml-4">
          <li>Access the personal information we hold about you.</li>
          <li>Request correction or update of inaccurate or incomplete information.</li>
          <li>Request deletion of your personal information.</li>
          <li>Request restriction of certain processing activities.</li>
          <li>Object to certain uses of your personal information.</li>
          <li>Withdraw consent where processing is based on consent.</li>
          <li>Contact us regarding questions or concerns about how your data is handled.</li>
        </ul>
        <p className="mt-4">
          To exercise your rights, please contact us using the information provided in the &quot;Contact Us&quot; section below.
        </p>
      </>
    ),
  },
  {
    number: '7',
    title: "Children's Privacy",
    content: (
      <div className="space-y-4">
        <p>
          KlickShot is not intended for children under the age required by applicable law to use digital services without parental or guardian consent.
        </p>
        <p>
          We do not knowingly collect personal information from children without appropriate consent. If we become aware that we have collected personal information from a child in violation of applicable law, we will take steps to delete such information as soon as reasonably possible.
        </p>
      </div>
    ),
  },
  {
    number: '8',
    title: 'Third-Party Services',
    content: (
      <div className="space-y-4">
        <p>
          The KlickShot app or website may contain links to third-party websites, platforms, payment providers, analytics services, or other external services.
        </p>
        <p>
          This Privacy Policy applies only to services operated by LOVEDRAMA CO., LTD. We are not responsible for the privacy practices, content, or policies of third-party services. We encourage you to review the privacy policies of any third-party services you use.
        </p>
      </div>
    ),
  },
  {
    number: '9',
    title: 'International Data Transfers',
    content: (
      <div className="space-y-4">
        <p>
          Your personal information may be processed and stored in countries or regions outside your country of residence. These countries may have data protection laws that differ from those in your location.
        </p>
        <p>
          When we transfer or process personal information internationally, we will take reasonable steps to ensure that appropriate safeguards are in place in accordance with applicable data protection laws.
        </p>
      </div>
    ),
  },
  {
    number: '10',
    title: 'Changes to this Privacy Policy',
    content: (
      <div className="space-y-4">
        <p>
          We may update or modify this Privacy Policy from time to time to reflect changes in our services, legal requirements, or business practices.
        </p>
        <p>
          If we make material changes to this Privacy Policy, we may notify you through the app, website, or other appropriate means. The updated Privacy Policy will become effective when posted, unless otherwise stated.
        </p>
        <p>We encourage you to review this Privacy Policy periodically.</p>
      </div>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#11154D] to-[#291337] text-gray-200 font-sans px-4 py-8 md:p-12 selection:bg-[#6a90f1] selection:text-white relative overflow-x-hidden">
      <div className="fixed inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
        <div className="w-[800px] h-[800px] bg-[#6a90f1] rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-4xl mx-auto md:bg-[#1a113a]/60 md:backdrop-blur-xl md:rounded-3xl p-4 md:p-12 md:shadow-2xl md:border md:border-white/10 relative z-10 mt-4 md:mt-8 mb-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6a90f1] to-[#d67bfa]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-gray-400">Effective Date: May 24, 2026</p>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-300">
          <div className="space-y-4 text-lg text-gray-200">
            <p>KlickShot is operated by LOVEDRAMA CO., LTD.</p>
            <p>
              LOVEDRAMA CO., LTD. respects your privacy and is committed to securing and protecting your personal information. This Privacy Policy explains how we collect, use, disclose, store, and safeguard your data when you use the KlickShot app, website, and related services.
            </p>
          </div>

          {sections.map((section) => (
            <section key={section.number} className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5">
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm shrink-0">
                  {section.number}
                </span>
                {section.title}
              </h2>
              {section.content}
            </section>
          ))}

          <section className="md:bg-white/5 md:rounded-2xl py-4 md:p-6 md:border md:border-white/5 md:shadow-[0_0_15px_rgba(106,144,241,0.15)]">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm shrink-0">11</span>
              Contact Us
            </h2>
            <p className="mb-4">
              If you have any questions, concerns, requests, or complaints regarding this Privacy Policy or the handling of your personal information, please contact us at:
            </p>
            <address className="not-italic space-y-1">
              <p>LOVEDRAMA CO., LTD.</p>
              <p>App Name: KlickShot</p>
              <p>
                Email:{' '}
                <a href="mailto:klickshot.official@gmail.com" className="text-[#6a90f1] hover:underline underline-offset-4">
                  klickshot.official@gmail.com
                </a>
              </p>
              <p>
                Website:{' '}
                <a href="https://www.klickshotseries.com" className="text-[#6a90f1] hover:underline underline-offset-4">
                  https://www.klickshotseries.com
                </a>
              </p>
            </address>
          </section>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/"
            className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 hover:border-white/30 flex items-center gap-2 hover:-translate-x-1"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
