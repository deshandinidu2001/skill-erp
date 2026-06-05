import type { Metadata } from "next";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skill Engineering ERP",
  description: "Construction and engineering operations platform",
  applicationName: "Skill Engineering ERP",
  openGraph: {
    title: "Skill Engineering ERP",
    description: "Construction and engineering operations platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-100 text-slate-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
