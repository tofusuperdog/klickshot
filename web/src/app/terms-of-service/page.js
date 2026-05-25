import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | KlickShot',
  description: 'Terms of Service for the KlickShot app, website, and related services.',
};

const sections = [
  {
    number: '1',
    title: 'Service Provider',
    content: (
      <>
        <p className="mb-4">KlickShot is operated by:</p>
        <address className="not-italic space-y-1">
          <p>LOVEDRAMA CO., LTD.</p>
          <p>App Name: KlickShot</p>
          <p>
            Website:{' '}
            <a href="https://www.klickshotseries.com" className="text-[#6a90f1] hover:underline underline-offset-4">
              https://www.klickshotseries.com
            </a>
          </p>
          <p>
            Email:{' '}
            <a href="mailto:klickshot.official@gmail.com" className="text-[#6a90f1] hover:underline underline-offset-4">
              klickshot.official@gmail.com
            </a>
          </p>
        </address>
      </>
    ),
  },
  {
    number: '2',
    title: 'Use of the Service',
    content: (
      <>
        <p className="mb-4">
          KlickShot provides a mini drama and short series content platform. You may use our services only in accordance with these Terms and all applicable laws and regulations.
        </p>
        <p className="mb-2">You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2 ml-4">
          <li>Use the service for any unlawful, harmful, fraudulent, or abusive purpose.</li>
          <li>Interfere with or disrupt the operation, security, or performance of the service.</li>
          <li>Attempt to gain unauthorized access to any account, system, server, or network.</li>
          <li>Copy, modify, distribute, sell, lease, or exploit any part of the service without authorization.</li>
          <li>Upload, post, share, or transmit content that is illegal, harmful, defamatory, infringing, obscene, or otherwise inappropriate.</li>
          <li>Use automated systems, bots, scraping tools, or similar methods to access or collect data from the service without permission.</li>
        </ul>
      </>
    ),
  },
  {
    number: '3',
    title: 'User Accounts',
    content: (
      <div className="space-y-4">
        <p>
          Some features of KlickShot may require you to create or use an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
        </p>
        <p>
          You agree to provide accurate, current, and complete information when creating or using your account. You must notify us promptly if you believe your account has been accessed or used without authorization.
        </p>
      </div>
    ),
  },
  {
    number: '4',
    title: 'Content and Intellectual Property',
    content: (
      <div className="space-y-4">
        <p>
          All content, features, designs, logos, graphics, text, videos, software, and other materials available through KlickShot are owned by or licensed to LOVEDRAMA CO., LTD. and are protected by applicable intellectual property laws.
        </p>
        <p>
          You may access and use the content only for personal, non-commercial purposes within the app or service. You may not copy, reproduce, download, distribute, modify, publicly display, publicly perform, create derivative works from, or otherwise exploit any content without prior written permission from LOVEDRAMA CO., LTD. or the relevant rights holder.
        </p>
      </div>
    ),
  },
  {
    number: '5',
    title: 'Purchases and Payments',
    content: (
      <div className="space-y-4">
        <p>
          KlickShot may offer paid content, subscriptions, in-app purchases, or other paid services. Prices, available payment methods, and billing terms may be displayed within the app or through the applicable app store or payment provider.
        </p>
        <p>
          By making a purchase, you agree to pay all applicable fees and charges. Payments may be processed by third-party payment providers or app stores. We are not responsible for errors, delays, or issues caused by third-party payment services.
        </p>
        <p>
          Unless otherwise required by applicable law or stated by the applicable platform provider, purchases may be non-refundable.
        </p>
      </div>
    ),
  },
  {
    number: '6',
    title: 'Subscriptions',
    content: (
      <div className="space-y-4">
        <p>
          If KlickShot offers subscription services, your subscription may automatically renew unless canceled before the renewal date, depending on the terms of the app store, payment provider, or subscription platform used.
        </p>
        <p>
          You are responsible for managing and canceling your subscription through the platform where the purchase was made. Subscription cancellation and refund rules may be governed by the applicable app store or payment provider.
        </p>
      </div>
    ),
  },
  {
    number: '7',
    title: 'User-Generated Content',
    content: (
      <div className="space-y-4">
        <p>
          If KlickShot allows users to submit, upload, post, or share content, you are responsible for the content you provide.
        </p>
        <p>
          You represent and warrant that you own or have the necessary rights to submit such content and that your content does not violate any law, third-party rights, or these Terms.
        </p>
        <p>
          By submitting content to KlickShot, you grant LOVEDRAMA CO., LTD. a non-exclusive, worldwide, royalty-free license to use, host, store, reproduce, modify, display, distribute, and process such content as necessary to operate, improve, promote, and provide the service.
        </p>
        <p>
          We reserve the right to remove or restrict access to any user content that violates these Terms or applicable law.
        </p>
      </div>
    ),
  },
  {
    number: '8',
    title: 'Privacy',
    content: (
      <div className="space-y-4">
        <p>
          Your use of KlickShot is also governed by our Privacy Policy, which explains how we collect, use, store, and protect your personal information.
        </p>
        <p>Please review our Privacy Policy at:</p>
        <p>
          <a href="https://www.klickshotseries.com/privacy-policy" className="text-[#6a90f1] hover:underline underline-offset-4">
            https://www.klickshotseries.com/privacy-policy
          </a>
        </p>
      </div>
    ),
  },
  {
    number: '9',
    title: 'Third-Party Services',
    content: (
      <div className="space-y-4">
        <p>
          KlickShot may include links to or integrations with third-party websites, services, payment providers, analytics tools, or platforms.
        </p>
        <p>
          We are not responsible for the content, policies, practices, availability, or security of third-party services. Your use of third-party services may be subject to their own terms and privacy policies.
        </p>
      </div>
    ),
  },
  {
    number: '10',
    title: 'Service Availability',
    content: (
      <div className="space-y-4">
        <p>
          We strive to provide a reliable service, but we do not guarantee that KlickShot will always be available, uninterrupted, secure, or error-free.
        </p>
        <p>
          We may modify, suspend, or discontinue all or part of the service at any time, with or without notice, where permitted by law.
        </p>
      </div>
    ),
  },
  {
    number: '11',
    title: 'Termination',
    content: (
      <div className="space-y-4">
        <p>
          We may suspend or terminate your access to KlickShot if we believe that you have violated these Terms, applicable laws, or the rights of others, or if your use of the service may cause harm to LOVEDRAMA CO., LTD., other users, or third parties.
        </p>
        <p>You may stop using KlickShot at any time.</p>
      </div>
    ),
  },
  {
    number: '12',
    title: 'Disclaimer of Warranties',
    content: (
      <p>
        KlickShot is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted by applicable law, LOVEDRAMA CO., LTD. makes no warranties or representations, express or implied, regarding the service, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, availability, accuracy, or reliability.
      </p>
    ),
  },
  {
    number: '13',
    title: 'Limitation of Liability',
    content: (
      <div className="space-y-4">
        <p>
          To the maximum extent permitted by applicable law, LOVEDRAMA CO., LTD. shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including loss of profits, data, goodwill, or business opportunities, arising from or related to your use of or inability to use KlickShot.
        </p>
        <p>Nothing in these Terms limits any liability that cannot be excluded or limited under applicable law.</p>
      </div>
    ),
  },
  {
    number: '14',
    title: 'Indemnification',
    content: (
      <p>
        You agree to indemnify and hold harmless LOVEDRAMA CO., LTD., its officers, directors, employees, partners, agents, licensors, and service providers from and against any claims, liabilities, damages, losses, costs, and expenses arising out of or related to your use of KlickShot, your violation of these Terms, or your violation of any rights of another person or entity.
      </p>
    ),
  },
  {
    number: '15',
    title: 'Changes to These Terms',
    content: (
      <div className="space-y-4">
        <p>
          We may update or modify these Terms of Service from time to time. If we make material changes, we may notify you through the app, website, or other appropriate means.
        </p>
        <p>
          The updated Terms will become effective when posted, unless otherwise stated. Your continued use of KlickShot after the updated Terms become effective means that you accept the revised Terms.
        </p>
      </div>
    ),
  },
  {
    number: '16',
    title: 'Governing Law',
    content: (
      <div className="space-y-4">
        <p>
          These Terms shall be governed by and interpreted in accordance with the laws applicable to LOVEDRAMA CO., LTD., without regard to conflict of law principles.
        </p>
        <p>
          If any dispute arises in connection with these Terms or the use of KlickShot, the parties will first attempt to resolve the dispute through good faith discussions.
        </p>
      </div>
    ),
  },
];

export default function TermsOfService() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#11154D] to-[#291337] text-gray-200 font-sans px-4 py-8 md:p-12 selection:bg-[#6a90f1] selection:text-white relative overflow-x-hidden">
      <div className="fixed inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
        <div className="w-[800px] h-[800px] bg-[#6a90f1] rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-4xl mx-auto md:bg-[#1a113a]/60 md:backdrop-blur-xl md:rounded-3xl p-4 md:p-12 md:shadow-2xl md:border md:border-white/10 relative z-10 mt-4 md:mt-8 mb-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6a90f1] to-[#d67bfa]">
            Terms of Service
          </h1>
          <p className="mt-4 text-gray-400">Effective Date: May 24, 2026</p>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-300">
          <div className="space-y-4 text-lg text-gray-200">
            <p>
              These Terms of Service govern your access to and use of the KlickShot app, website, and related services operated by LOVEDRAMA CO., LTD.
            </p>
            <p>
              By accessing or using KlickShot, you agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use our services.
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
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6a90f1]/20 text-[#6a90f1] text-sm shrink-0">17</span>
              Contact Us
            </h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding these Terms of Service, please contact us at:
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
