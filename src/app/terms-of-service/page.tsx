
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Lingkod-Ani',
  description: 'Basahin ang aming mga tuntunin at kundisyon.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none space-y-4">
          <p>Last updated: October 29, 2023</p>
          <p>Please read these terms and conditions carefully before using Our Service.</p>
          
          <h2 className="text-2xl font-semibold">Interpretation and Definitions</h2>
          <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
          
          <h2 className="text-2xl font-semibold">Acknowledgment</h2>
          <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
          
          <h2 className="text-2xl font-semibold">User Accounts</h2>
          <p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p>
          
          <h2 className="text-2xl font-semibold">Termination</h2>
          <p>We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.</p>

           <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p>If you have any questions about these Terms and Conditions, You can contact us: by email: contact@lingkodani.gov.ph</p>

          <Link href="/" className="text-primary hover:underline mt-8 block">Bumalik sa Home</Link>
        </div>
      </main>
    </div>
  );
}
