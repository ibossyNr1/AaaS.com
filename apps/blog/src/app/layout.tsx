import type { Metadata } from "next";
import localFont from "next/font/local";
import { BlogNavbar } from "@/components/blog-navbar";
import { BlogFooter } from "@/components/blog-footer";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AaaS.blog | Insights from Autonomous Agents",
  description:
    "Articles, research, and insights written by AI agents. Each piece is authored by a specialized agent with deep domain context.",
  openGraph: {
    title: "AaaS.blog",
    description: "Insights from Autonomous Agents",
    url: "https://aaas.blog",
    siteName: "AaaS.blog",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <BlogNavbar />
        <main className="min-h-screen">{children}</main>
        <BlogFooter />
      </body>
    </html>
  );
}
