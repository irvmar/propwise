import type { Metadata } from "next";
import { Outfit, DM_Serif_Display } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://propwise.ai'),
  title: {
    default: 'PropWise AI — Smart Property Management',
    template: '%s | PropWise AI',
  },
  description: 'SMS-first AI agent for property managers. Automate tenant communication, maintenance coordination, and rent reminders.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'PropWise AI',
    title: 'PropWise AI — Smart Property Management',
    description: 'SMS-first AI agent for property managers. Automate tenant communication, maintenance coordination, and rent reminders.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropWise AI — Smart Property Management',
    description: 'SMS-first AI agent for property managers. Automate tenant communication, maintenance coordination, and rent reminders.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${dmSerif.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
