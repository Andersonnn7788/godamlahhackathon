import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SmartSign - Accessibility for the Deaf",
  description: "AI-powered Malaysian Sign Language (BIM) interpreter for inclusive communication between deaf citizens and government officers. Privacy-focused, locally processed sign language recognition.",
  keywords: ["Malaysian Sign Language", "BIM", "sign language interpreter", "accessibility", "inclusivity", "smart ID card", "Malaysia"],
  authors: [{ name: "Malaysia Inclusivity Hackathon Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
