import type {Metadata} from "next";
import {Poppins} from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import {AuthProvider} from "@/contexts/AuthContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Multi-Timer | Dappit",
  description:
    "Professional multi-timer app for tracking time across multiple projects and tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
