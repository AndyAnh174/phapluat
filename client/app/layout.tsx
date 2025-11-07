import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HCMUTE - Ngày Pháp Luật",
  description: "Hệ thống trắc nghiệm và sách di sản HCMUTE",
  openGraph: {
    title: "HCMUTE - Ngày Pháp Luật",
    description: "Hệ thống trắc nghiệm và sách di sản HCMUTE",
    type: 'website',
    locale: 'vi_VN',
    images: [
      {
        url: '/OpenGraph.jpg',
        alt: 'HCMUTE - Ngày Pháp Luật',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/OpenGraph.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
        {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
