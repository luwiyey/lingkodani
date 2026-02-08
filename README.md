
# Lingkod-Ani: Plataporma para sa Matalinong Pagsasaka

Ang **Lingkod-Ani** ay isang Next.js application na idinisenyo para sa mga Barangay Agricultural Extension Workers (AEWs) upang magbigay ng suporta sa mga magsasaka gamit ang AI. Pinagsasama nito ang isang SMS-based na sistema ng komunikasyon, isang knowledge base, at mga tool sa pag-aanalisa upang mapabuti ang paggawa ng desisyon at mapabilis ang pagtugon sa mga pangangailangan sa agrikultura.

## Mga Tampok

- **Dashboard:** Isang sentralisadong view ng mga pangunahing metriko, mga prayoridad na gawain, at mga alerto.
- **Live SMS Feed:** Isang real-time na inbox para sa mga mensahe ng magsasaka, na may kasamang pagsusuri ng AI para sa layunin, tono, at pagka-apurahan.
- **Pamamahala ng Magsasaka:** Isang kumpletong database ng mga profile ng magsasaka, kasama ang kanilang kasaysayan ng interaksyon (Logbook).
- **Knowledge Base na may AI:** Isang sistema ng paghahanap na gumagamit ng AI upang sagutin ang mga tanong sa natural na wika, batay sa mga internal na artikulo at mga resulta mula sa web.
- **AI Toolkit:** Mga calculator para sa pataba, pestisidyo, at pagtatantya ng kita.
- **Mga Ulat at Analytics:** Mga interactive na chart para sa pag-visualize ng mga trend sa SMS, performance ng AI, at mga operasyon.
- **Disaster Mode:** Isang espesyal na interface na nagbibigay-priyoridad sa mga komunikasyon at pamamahala ng imbentaryo sa panahon ng emerhensiya.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** ShadCN UI, Radix UI
- **Generative AI:** Google AI (Gemini) via Genkit
- **Form Validation:** React Hook Form & Zod
- **Charts:** Recharts

## Pagsisimula

### Mga Kinakailangan

- Node.js (v18+)
- `pnpm` (o `npm`/`yarn`)

### Pag-install

1.  I-clone ang repository:
    ```bash
    git clone https://your-repository-url/lingkod-ani.git
    cd lingkod-ani
    ```

2.  I-install ang mga dependency:
    ```bash
    pnpm install
    ```

3.  I-setup ang environment variables. Kopyahin ang `.env.example` at palitan ang pangalan nito ng `.env` at ilagay ang iyong Gemini API key:
    ```
    GEMINI_API_KEY=iyong_api_key_dito
    ```

### Pagpapatakbo ng Development Server

Maaari mong patakbuhin ang development server gamit ang sumusunod na command:

```bash
pnpm dev
```

Buksan ang [http://localhost:3000](http://localhost:3000) sa iyong browser upang makita ang resulta.

## Scripts

- `pnpm dev`: Simulan ang Next.js development server.
- `pnpm build`: Buuin ang application para sa production.
- `pnpm start`: Patakbuhin ang production build.
- `pnpm lint`: Patakbuhin ang ESLint para sa code analysis.
- `pnpm typecheck`: Patakbuhin ang TypeScript compiler para sa type checking.
