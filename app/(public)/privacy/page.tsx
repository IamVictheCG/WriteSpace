export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Introduction</h2>
          <p className="mt-2">
            WriteNaija (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a marketplace
            platform connecting writers with clients. This Privacy Policy explains how we
            collect, use, and protect your personal data in accordance with the Nigeria Data
            Protection Regulation (NDPR) and the Nigeria Data Protection Act 2023.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. Data We Collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account information (name, email address, username)</li>
            <li>Writer profile data (bio, portfolio links, pricing, response time)</li>
            <li>Bank account details (for writer payouts — stored securely, never shared publicly)</li>
            <li>Project content and messages exchanged between writers and clients</li>
            <li>Payment information processed through Paystack</li>
            <li>Usage data and session information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. Message Monitoring Disclosure</h2>
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-medium text-amber-900">Important Notice</p>
            <p className="mt-1 text-amber-800">
              Messages exchanged through our platform are automatically scanned for policy
              violations, including attempts to share contact information outside the platform.
              Messages flagged by our automated system are withheld from delivery and reviewed
              by our team. This monitoring is in place to protect both writers and clients and
              to maintain the integrity of our escrow payment system.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. How We Use Your Data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>To provide and operate the marketplace platform</li>
            <li>To process payments and facilitate escrow transactions</li>
            <li>To send transactional emails (verification, notifications, confirmations)</li>
            <li>To enforce our terms of service and prevent fraud</li>
            <li>To improve our services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Data Storage and Security</h2>
          <p className="mt-2">
            Your data is stored securely using industry-standard encryption. Bank account
            details are restricted to authorized access only and are never exposed in
            public-facing pages. Payment processing is handled by Paystack, a PCI-DSS
            compliant provider.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. Your Rights Under NDPR</h2>
          <p className="mt-2">Under the Nigeria Data Protection Regulation, you have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">7. Third-Party Services</h2>
          <p className="mt-2">
            We use the following third-party services to operate our platform:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Supabase (database and authentication)</li>
            <li>Paystack (payment processing)</li>
            <li>Resend (transactional email)</li>
            <li>Vercel (hosting)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">8. Contact</h2>
          <p className="mt-2">
            For questions about this privacy policy or to exercise your data rights,
            contact us at privacy@writenaija.com.
          </p>
        </section>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
          <p className="font-medium">Legal Review Pending</p>
          <p className="mt-1">
            This privacy policy is a preliminary draft and is pending formal legal review.
            It will be updated to ensure full compliance with NDPR requirements before
            commercial launch.
          </p>
        </div>
      </div>
    </div>
  )
}
