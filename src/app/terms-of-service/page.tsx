
import type { Metadata } from 'next';
import { LegalBackLink } from '@/components/legal/legal-back-link';

export const metadata: Metadata = {
  title: 'Mga Tuntunin ng Serbisyo | Lingkod-Ani',
  description: 'Basahin ang aming mga tuntunin at kundisyon.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">Mga Tuntunin ng Serbisyo para sa Lingkod-Ani</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>Huling na-update: Enero 1, 2026</p>
          <p>Maligayang pagdating sa Lingkod-Ani. Ang mga tuntunin at kundisyon na ito ay naglilinaw ng mga patakaran para sa paggamit ng Lingkod-Ani platform. Sa pag-access o paggamit ng aming serbisyo, sumasang-ayon ka na susunod sa mga tuntuning ito.</p>
          
          <h2 className="text-2xl font-semibold">1. Paggamit ng Serbisyo</h2>
          <p>Ang serbisyong ito ay eksklusibong para sa mga awtorisadong Agricultural Extension Workers (AEWs) ng barangay. Responsibilidad mong panatilihing kumpidensyal ang iyong account. Ang platform ay dapat gamitin para sa mga opisyal na tungkulin lamang sa pagtulong at pagsuporta sa mga magsasaka sa iyong nasasakupan.</p>
          
          <h2 className="text-2xl font-semibold">2. Payo ng AI at Iyong Responsibilidad</h2>
          <p>Ang Lingkod-Ani ay gumagamit ng Artificial Intelligence (AI) upang bumuo ng mga mungkahi at payo batay sa data na ibinigay. Gayunpaman, ang mga payong ito ay mga mungkahi lamang at hindi dapat ituring na ganap na tama.</p>
          <p className="font-bold text-destructive">Bilang isang awtorisadong AEW, ikaw ang may huling responsibilidad na suriin, i-validate, at aprubahan ang anumang payo na binuo ng AI bago ito ipadala sa isang magsasaka. Ang Lingkod-Ani ay hindi mananagot para sa anumang pinsala o pagkalugi na maaaring magresulta mula sa payo na hindi dumaan sa iyong propesyonal na pagsusuri.</p>
          
          <h2 className="text-2xl font-semibold">3. Pagpoproseso ng Datos ng Magsasaka</h2>
          <p>Sa paggamit ng app, ikaw ay hahawak ng personal at sensitibong impormasyon ng mga magsasaka. Sumasang-ayon ka na pangasiwaan ang lahat ng data na ito nang may lubos na pag-iingat at alinsunod sa mga prinsipyo ng Data Privacy Act of 2012.</p>

          <h2 className="text-2xl font-semibold">4. Pagwawakas ng Account</h2>
          <p>Maaari naming suspindihin o wakasan ang iyong account kung mapatunayang nilabag mo ang mga tuntuning ito, kabilang ang maling paggamit ng data ng magsasaka o pagpapadala ng hindi na-validate na payo na nagdulot ng pinsala.</p>

           <h2 className="text-2xl font-semibold">Makipag-ugnayan sa Amin</h2>
          <p>Kung mayroon kang anumang mga katanungan tungkol sa mga Tuntunin at Kundisyon na ito, maaari kang makipag-ugnayan sa amin: sa pamamagitan ng email: luwiyeyz@gmail.com</p>
          <LegalBackLink />
        </div>
      </main>
    </div>
  );
}
