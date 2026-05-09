import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PredictStack",
  description: "Peer-to-peer prediction markets on Stacks",
  other: {
    "talentapp:project_verification": "5d269813bdb631cd000764a4472da8002f5d22be33786d0725ef14827fd518d92c2baa1f7281932ddeef1033192a7af8bf325d5cb2b6c75e1d5c9f0a3d9c957e",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${geist.variable} ${geistMono.variable}`,
          "min-h-screen bg-background font-sans antialiased relative"
        )}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
