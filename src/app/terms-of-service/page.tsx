
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mga Tuntunin ng Serbisyo | Lingkod-Ani',
  description: 'Basahin ang aming mga tuntunin at kundisyon.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">Mga Tuntunin ng Serbisyo</h1>
        <div className="prose dark:prose-invert max-w-none space-y-4">
          <p>Huling na-update: Oktubre 29, 2023</p>
          <p>Mangyaring basahin nang mabuti ang mga tuntunin at kundisyon na ito bago gamitin ang Aming Serbisyo.</p>
          
          <h2 className="text-2xl font-semibold">Interpretasyon at mga Kahulugan</h2>
          <p>Ang mga salita kung saan ang unang titik ay naka-capitalize ay may mga kahulugan na tinukoy sa ilalim ng mga sumusunod na kundisyon. Ang mga sumusunod na kahulugan ay magkakaroon ng parehong kahulugan anuman ang lumitaw sa isahan o sa pangmaramihang anyo.</p>
          
          <h2 className="text-2xl font-semibold">Pagkilala</h2>
          <p>Ito ang mga Tuntunin at Kundisyon na namamahala sa paggamit ng Serbisyo na ito at ang kasunduan na nagpapatakbo sa pagitan Mo at ng Kumpanya. Ang mga Tuntunin at Kundisyon na ito ay nagtatakda ng mga karapatan at obligasyon ng lahat ng mga gumagamit tungkol sa paggamit ng Serbisyo.</p>
          
          <h2 className="text-2xl font-semibold">Mga User Account</h2>
          <p>Kapag lumikha Ka ng isang account sa Amin, dapat Mo kaming bigyan ng impormasyon na tumpak, kumpleto, at kasalukuyan sa lahat ng oras. Ang hindi paggawa nito ay bumubuo ng isang paglabag sa mga Tuntunin, na maaaring magresulta sa agarang pagwawakas ng Iyong account sa Aming Serbisyo.</p>
          
          <h2 className="text-2xl font-semibold">Pagwawakas</h2>
          <p>Maaari naming wakasan o suspindihin ang Iyong Account kaagad, nang walang paunang abiso o pananagutan, para sa anumang dahilan, kasama na nang walang limitasyon kung lalabagin Mo ang mga Tuntunin at Kundisyon na ito.</p>

           <h2 className="text-2xl font-semibold">Makipag-ugnayan sa Amin</h2>
          <p>Kung mayroon kang anumang mga katanungan tungkol sa mga Tuntunin at Kundisyon na ito, maaari kang makipag-ugnayan sa amin: sa pamamagitan ng email: contact@lingkodani.gov.ph</p>

          <Link href="/dashboard" className="text-primary hover:underline mt-8 block">Bumalik sa Dashboard</Link>
        </div>
      </main>
    </div>
  );
}
