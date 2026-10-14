import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LeadPilot | AI Sales Agent & Inbound Qualification Funnel",
  description: "Spacenos inbound sales qualification agent with strict tool calling, grounded pricing, conversation memory, and automated eval suite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full max-h-screen overflow-hidden bg-mesh-dark text-slate-100 flex flex-col font-sans select-none">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
          {children}
        </main>
      </body>
    </html>
  );
}
