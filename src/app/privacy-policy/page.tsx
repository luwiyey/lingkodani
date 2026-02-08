
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Patakaran sa Privacy | Lingkod-Ani',
  description: 'Alamin kung paano namin pinangangalagaan ang iyong data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">Patakaran sa Privacy</h1>
        <div className="prose dark:prose-invert max-w-none space-y-4">
          <p>Huling na-update: Oktubre 29, 2023</p>
          <p>Inilalarawan ng Patakaran sa Privacy na ito ang Aming mga patakaran at pamamaraan sa pagkolekta, paggamit at pagsisiwalat ng Iyong impormasyon kapag ginamit mo ang Serbisyo at sinasabi sa Iyo ang tungkol sa Iyong mga karapatan sa privacy at kung paano ka pinoprotektahan ng batas.</p>
          
          <h2 className="text-2xl font-semibold">Pagkolekta at Paggamit ng Iyong Personal na Data</h2>
          <p>Habang ginagamit ang Aming Serbisyo, maaari ka naming hilingin na bigyan Kami ng ilang personal na pagkakakilanlan na impormasyon na maaaring magamit upang makipag-ugnayan o makilala Ka. Ang personal na pagkakakilanlan na impormasyon ay maaaring magsama, ngunit hindi limitado sa: Email address, Pangalan at apelyido, Numero ng telepono, Data ng Paggamit.</p>
          
          <h2 className="text-2xl font-semibold">Paggamit ng Iyong Personal na Data</h2>
          <p>Maaaring gamitin ng Kumpanya ang Personal na Data para sa mga sumusunod na layunin: upang ibigay at mapanatili ang aming Serbisyo, upang pamahalaan ang Iyong Account, upang makipag-ugnayan sa Iyo, upang bigyan Ka ng mga balita, espesyal na alok at pangkalahatang impormasyon tungkol sa iba pang mga produkto, serbisyo at kaganapan na aming inaalok.</p>
          
          <h2 className="text-2xl font-semibold">Seguridad ng Iyong Personal na Data</h2>
          <p>Ang seguridad ng Iyong Personal na Data ay mahalaga sa Amin, ngunit tandaan na walang paraan ng paghahatid sa Internet, o paraan ng elektronikong pag-iimbak ang 100% na ligtas. Habang nagsusumikap kaming gumamit ng mga komersyal na katanggap-tanggap na paraan upang protektahan ang Iyong Personal na Data, hindi namin magagarantiyahan ang ganap na seguridad nito.</p>
          
          <h2 className="text-2xl font-semibold">Makipag-ugnayan sa Amin</h2>
          <p>Kung mayroon kang anumang mga katanungan tungkol sa Patakaran sa Privacy na ito, maaari kang makipag-ugnayan sa amin: sa pamamagitan ng email: privacy@lingkodani.gov.ph</p>

          <Link href="/dashboard" className="text-primary hover:underline mt-8 block">Bumalik sa Dashboard</Link>
        </div>
      </main>
    </div>
  );
}
