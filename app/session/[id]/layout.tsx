import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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

export default function SessionLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
    return (
        <div className="w-full h-full">
           <div className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}>
                {children}
           </div>
        </div>
    );
}