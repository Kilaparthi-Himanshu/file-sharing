import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnimatedCursor from "react-animated-cursor"
import { ReactQueryProvider } from "./components/ReactQueryProvider";
import { IoAlertCircleOutline } from "react-icons/io5";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <link rel="icon" href="/icon.png" sizes="any"></link>
            <link rel="icon" type="image/png" href="/icon.png" sizes="32x32"></link>
            <link rel="apple-touch-icon" href="/icon.png"></link>
            <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
            >
                <div className="absolute w-full h-full bg-neutral-600/30 z-100 pointer-fine:hidden portrait:hidden flex items-center justify-center text-3xl text-red-400">
                    <div className="w-full h-20 flex justify-center items-center bg-neutral-600/70 font-sans">
                        <IoAlertCircleOutline size={40} className="mr-2" />
                        Please Use In Portrait Mode
                    </div>
                </div>
                <div className="pointer-coarse:hidden">
                    <AnimatedCursor 
                        color="255, 255, 255"
                    />
                </div>
                <ReactQueryProvider>
                    {children}
                </ReactQueryProvider>
            </body>
        </html>
    );
}
