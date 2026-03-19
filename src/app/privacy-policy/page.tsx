
import type { Metadata } from 'next';
import { LegalBackLink } from '@/components/legal/legal-back-link';

export const metadata: Metadata = {
  title: 'Patakaran sa Privacy | Lingkod-Ani',
  description: 'Alamin kung paano namin pinangangalagaan ang iyong data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">Patakaran sa Privacy para sa Lingkod-Ani</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>Huling na-update: Enero 1, 2026</p>
          <p>Ang Patakaran sa Privacy na ito ay naglalayong ipaliwanag kung paano kinokolekta, ginagamit, at pinoprotektahan ng Lingkod-Ani ("kami") ang personal na impormasyon ng mga magsasaka at ng mga Agricultural Extension Worker (AEW) na gumagamit ng platform. Ang inyong tiwala ay aming pinahahalagahan, at kami ay nakatuon sa pagsunod sa Data Privacy Act of 2012 ng Pilipinas.</p>
          
          <h2 className="text-2xl font-semibold">Anong Impormasyon ang Kinokolekta Namin?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Impormasyon sa Profile ng Magsasaka:</strong> Kapag nagparehistro ang isang magsasaka (sa pamamagitan man ng SMS o manu-manong pag-input ng AEW), kinokolekta namin ang kanilang pangalan, numero ng telepono, lokasyon (barangay/sitio), at mga detalye ng sakahan tulad ng sukat at uri ng pananim.</li>
            <li><strong>Data ng Komunikasyon:</strong> Iniimbak at sinusuri namin ang nilalaman ng mga mensaheng SMS na ipinapadala ng mga magsasaka. Ito ang ginagamit upang makabuo ng payo ng AI.</li>
            <li><strong>Data ng Paggamit (para sa mga AEW):</strong> Itinatala namin ang mga aksyon na ginagawa ng mga AEW sa loob ng sistema (hal., pag-apruba ng payo, pag-update ng imbentaryo) para sa mga layunin ng pag-audit at seguridad.</li>
          </ul>

          <h2 className="text-2xl font-semibold">Paano Namin Ginagamit ang Iyong Data?</h2>
          <p>Ang data na aming kinokolekta ay ginagamit para sa mga sumusunod na layunin:</p>
           <ul className="list-disc pl-5 space-y-2">
            <li><strong>Upang Magbigay ng Serbisyo:</strong> Ang data mula sa SMS at profile ng magsasaka ay ginagamit ng aming AI upang bumuo ng mga napapanahon at may-katuturang payo sa pagsasaka.</li>
            <li><strong>Upang Pagbutihin ang Sistema:</strong> Sinusuri namin ang data (sa isang pinagsama-sama at hindi pagkakakilanlan na paraan) upang maunawaan ang mga pangkaraniwang problema, mapabuti ang katumpakan ng aming AI, at makita ang mga trend sa agrikultura.</li>
            <li><strong>Para sa Komunikasyon:</strong> Ginagamit namin ang numero ng telepono upang magpadala ng mga tugon, alerto, at iba pang mahahalagang abiso.</li>
            <li><strong>Para sa Seguridad at Pag-audit:</strong> Ang mga audit log ay tumutulong na tiyakin ang pananagutan at seguridad ng platform.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold">Pagbabahagi at Pagsisiwalat ng Data</h2>
          <p>Ang personal na data ng mga magsasaka ay itinuturing na mahigpit na kumpidensyal. Ito ay magagamit lamang ng mga awtorisadong Agricultural Extension Workers (AEWs) ng inyong barangay para sa layunin ng pagbibigay ng suporta. Hindi namin ibebenta o ibabahagi ang inyong personal na data sa mga third party para sa mga layunin ng marketing.</p>

          <h2 className="text-2xl font-semibold">Seguridad ng Iyong Personal na Data</h2>
          <p>Gumagamit kami ng mga naaangkop na teknikal at organisasyonal na hakbang upang protektahan ang personal na data mula sa hindi awtorisadong pag-access, pagbabago, o pagkasira. Gayunpaman, tandaan na walang paraan ng paghahatid sa internet ang 100% na ligtas.</p>
          
          <h2 className="text-2xl font-semibold">Makipag-ugnayan sa Amin</h2>
          <p>Kung mayroon kang anumang mga katanungan tungkol sa Patakaran sa Privacy na ito, maaari kang makipag-ugnayan sa amin sa pamamagitan ng email: privacy@lingkodani.gov.ph</p>
          <LegalBackLink />
        </div>
      </main>
    </div>
  );
}
