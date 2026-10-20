function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-section-md">
      <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-balance">{title}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: {updated}</p>
      <article className="mt-8 max-w-[65ch] space-y-6 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-balance [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </article>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="18 October 2026">
      <p>
        AutoSpark BD (“we”, “our”) operates autosparkbd.com and its showroom and service
        centers in Rajshahi, Bangladesh. This policy explains what we collect and why.
      </p>
      <h2>Information you give us</h2>
      <ul>
        <li>Contact & sell-your-car forms: name, phone, email, and your message , used only to reply to your enquiry.</li>
        <li>Checkout: delivery name, phone, district, thana, and address , used to fulfil your order. Payments are processed by SSLCommerz; we never store your card details.</li>
        <li>SparkPilot assistant chats stay in your browser session and are sent to our AI provider only to generate a reply. Don't share passwords or card numbers in chat.</li>
      </ul>
      <h2>Information collected automatically</h2>
      <ul>
        <li>Local storage: theme, language, sound preference, and a daily regional-notice flag.</li>
        <li>Standard server logs (IP, browser, pages visited) for security and reliability.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To answer enquiries, fulfil orders, deliver vehicles, and schedule services.</li>
        <li>To improve the website. We do not sell or rent your personal data to anyone.</li>
      </ul>
      <h2>Your choices</h2>
      <p>
        You can ask us to correct or delete your personal data at any time. Email{' '}
        <a href="mailto:autosparkbd@gmail.com" className="text-[var(--brand-red,#C00000)] underline">autosparkbd@gmail.com</a>{' '}
        or call <a href="tel:+8801760401605" className="text-[var(--brand-red,#C00000)] underline">+880 1760-401605</a>.
      </p>
      <h2>Changes</h2>
      <p>We'll post any changes on this page with an updated date. Questions? Use the contact details above.</p>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="18 October 2026">
      <p>
        These terms apply when you use autosparkbd.com or buy from AutoSpark BD. By placing
        an order or submitting an enquiry you agree to them.
      </p>
      <h2>Vehicles & pricing</h2>
      <ul>
        <li>Prices, specifications, and availability are confirmed by an AutoSpark expert before any booking , website prices are indicative until confirmed in writing.</li>
        <li>Ready-stock and pre-order vehicles are labelled as such. Pre-order is a request to source a vehicle from Japan, not a confirmed booking or auction win.</li>
        <li>Import duties, registration, and delivery charges, if applicable, are communicated before confirmation.</li>
      </ul>
      <h2>Orders & payment</h2>
      <ul>
        <li>Payments are handled by SSLCommerz. Failed or cancelled payments are refunded per your bank's timelines.</li>
        <li>Orders ship/confirm only after payment confirmation and stock verification.</li>
      </ul>
      <h2>Services & accessories</h2>
      <ul>
        <li>Service bookings are confirmed by the center; parts and labour are warranted per the invoice terms shown at handover.</li>
        <li>Accessory compatibility must be confirmed for your vehicle before purchase.</li>
      </ul>
      <h2>Liability</h2>
      <p>
        To the extent permitted by law, our liability for any claim relates to the value of the
        goods or services supplied. Nothing here limits rights you have under Bangladesh law.
      </p>
      <h2>Contact</h2>
      <p>
        AutoSpark BD, Station Road (Sheroil), Boalia, Rajshahi{' '}
        <a href="mailto:autosparkbd@gmail.com" className="text-[var(--brand-red,#C00000)] underline">autosparkbd@gmail.com</a> ·{' '}
        <a href="tel:+8801760401605" className="text-[var(--brand-red,#C00000)] underline">+880 1760-401605</a>.
      </p>
    </LegalShell>
  );
}
