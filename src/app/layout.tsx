
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import { DataProvider } from '@/context/data-context';

export const metadata: Metadata = {
  title: 'Lingkod-Ani: Plataporma para sa Matalinong Pagsasaka',
  description: 'SMS-based na platform para sa payong pang-agrikultura, maayos na follow-up, at pagpapasya ng barangay.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fil" suppressHydrationWarning>
      <body className="font-body antialiased">
        <ThemeProvider
            defaultTheme="light"
        >
          <AuthProvider>
            <DataProvider>
              {children}
              <Toaster />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
