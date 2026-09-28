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
      <body className="min-h-full bg-[#f6f8fb] text-[#102d36] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
