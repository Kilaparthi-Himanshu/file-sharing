import { ToastContainer } from "react-toastify";
import { ButtonsUi } from "./components/ButtonsUi";
import { Feedback } from "./components/Feedback/Feedback";
import { OpeningPageTextAnimation } from "./components/misc/OpeningPageTextAnimation";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'BlinkShare – Fast, Secure File Sharing',
    description: 'Share files instantly, securely, and without signup using BlinkShare.',
    openGraph: {
        title: 'BlinkShare – Fast, Secure File Sharing',
        description: 'Instantly share files without login. Encrypt and share with anyone, anytime.',
        url: 'https://blinkshare.vercel.app',
        siteName: 'BlinkShare',
        images: [
            {
                url: 'https://blinkshare.vercel.app/icon.png',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'BlinkShare – Fast, Secure File Sharing',
        description: 'Instantly share files without login. Encrypt and share with anyone, anytime.',
        images: ['https://blinkshare.vercel.app/icon.png'],
    },
};

export default function Home() {
    return (
        <div className="bg-black h-[100dvh] w-[100dvw] flex flex-col gap-15 items-center justify-center p-4 noise-texture">
            <span className="text-white text-7xl font-bold text-center max-sm:text-5xl">
                <OpeningPageTextAnimation />
            </span>
            <ButtonsUi />
            <Feedback />
            <ToastContainer />
        </div>
    );
}
