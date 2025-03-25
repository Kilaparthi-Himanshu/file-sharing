import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnimatedCursor from "react-animated-cursor"
import { ReactQueryProvider } from "./components/ReactQueryProvider";

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
        <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
        >
            <AnimatedCursor 
                color="255, 255, 255"
            />
             <ReactQueryProvider>
                {children}
            </ReactQueryProvider>
        </body>
    </html>
  );
}
