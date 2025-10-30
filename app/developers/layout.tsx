import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import AnimatedCursor from "react-animated-cursor"
import AuthProvider from "../providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blink Share",
  description: "Share any files within a blink of an eye!",
};

export default function DevelopersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <div className={`selection:bg-emerald-600! selection:text-white min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased`}>
            <div className="pointer-coarse:hidden">
                <AnimatedCursor
                    color="78, 181, 147"
                />
            </div>
            <AuthProvider>
                {children}
            </AuthProvider>
        </div>
    );
}
