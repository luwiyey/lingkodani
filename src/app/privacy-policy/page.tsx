
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Lingkod-Ani',
  description: 'Alamin kung paano namin pinangangalagaan ang iyong data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none space-y-4">
          <p>Last updated: October 29, 2023</p>
          <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
          
          <h2 className="text-2xl font-semibold">Collecting and Using Your Personal Data</h2>
          <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to: Email address, First name and last name, Phone number, Usage Data.</p>
          
          <h2 className="text-2xl font-semibold">Use of Your Personal Data</h2>
          <p>The Company may use Personal Data for the following purposes: to provide and maintain our Service, to manage Your Account, to contact You, to provide You with news, special offers and general information about other goods, services and events which we offer.</p>
          
          <h2 className="text-2xl font-semibold">Security of Your Personal Data</h2>
          <p>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.</p>
          
          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, You can contact us: by email: privacy@lingkodani.gov.ph</p>

          <Link href="/" className="text-primary hover:underline mt-8 block">Bumalik sa Home</Link>
        </div>
      </main>
    </div>
  );
}
