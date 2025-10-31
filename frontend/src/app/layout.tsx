import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FlowProviderWrapper from "@/providers/FlowProvider";
import Header from "@/components/Header";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flow Mate",
  description: "Flow Mate is a platform for managing your Flow blockchain actions.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        >
              <FlowProviderWrapper>
                <div className="min-h-screen flex flex-col">
                  <Header />
                  {children}
                </div>
                <Toaster />
              </FlowProviderWrapper>
        </body>
      </html>
  );
}
