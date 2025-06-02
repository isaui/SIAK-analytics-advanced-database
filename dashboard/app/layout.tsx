import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIAK Dashboard",
  description: "Dashboard for SIAK University Database System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if the current path is the login page or another page that shouldn't show the sidebar
  // This is a simple implementation - you might need to adjust based on your routing
  const showSidebarForAllPaths = true; // Set to false and implement logic if some paths shouldn't have sidebar

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        {showSidebarForAllPaths ? (
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content - removed padding */}
            <div className="flex-1 overflow-auto p-0">
              <main className="p-0">
                {children}
              </main>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
