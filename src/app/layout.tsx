import type { Metadata } from "next";
import { Inter, Nunito, Titan_One } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: '--font-nunito',
  display: 'swap',
});

const titanOne = Titan_One({
  weight: '400',
  subsets: ["latin"],
  variable: '--font-titan',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Work Hours Calculator",
  description: "Track your work hours efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${nunito.variable} ${titanOne.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
