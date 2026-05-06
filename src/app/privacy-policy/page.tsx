export const metadata = {
  title: "Privacy Policy | Lingkod-Ani",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] px-6 py-10 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
          Lingkod-Ani
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          This policy explains how Lingkod-Ani and Lingkod-Ani Mobile handle
          staff account data, farmer-related operational records, device
          notifications, and optional location verification used during field
          visits.
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Information we collect</h2>
          <p className="text-sm leading-7 text-slate-700">
            Lingkod-Ani stores staff login details needed to authenticate mobile
            users, operational case data, farmer records, offline action queues,
            and device notification tokens when staff choose to enable mobile
            alerts.
          </p>
          <p className="text-sm leading-7 text-slate-700">
            The mobile app can also capture precise device location during a
            field-visit verification step, but only when the user chooses that
            action. Background location tracking is not used.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">How we use information</h2>
          <p className="text-sm leading-7 text-slate-700">
            We use this information to authenticate staff, show farmer and SMS
            case details, queue actions offline for later sync, send urgent
            staff alerts, and verify field visits when GPS capture is requested
            by the user.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Permissions</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong>Notifications:</strong> used to deliver urgent staff
              alerts after the user explicitly enables them.
            </li>
            <li>
              <strong>Location:</strong> used only during field-visit GPS
              verification initiated by the user.
            </li>
            <li>
              <strong>Internet:</strong> used to sync data with the Lingkod-Ani
              services.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Data sharing and retention</h2>
          <p className="text-sm leading-7 text-slate-700">
            Operational data is processed for Lingkod-Ani service delivery and
            staff coordination. Device tokens and offline mobile records are
            kept only as needed to deliver alerts and complete pending sync.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm leading-7 text-slate-700">
            For privacy or support questions, contact{" "}
            <a
              href="mailto:support@lingkod-ani.com"
              className="font-medium text-green-700 underline underline-offset-4"
            >
              support@lingkod-ani.com
            </a>
            .
          </p>
        </section>

        <p className="mt-10 text-xs text-slate-500">
          Last updated: April 20, 2026
        </p>
      </div>
    </main>
  );
}
