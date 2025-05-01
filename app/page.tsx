import { ButtonsUi } from "./components/ButtonsUi";
import { OpeningPageTextAnimation } from "./components/OpeningPageTextAnimation";

export default function Home() {
    return (
        <div className="bg-black h-[100dvh] w-[100dvw] flex flex-col gap-15 items-center justify-center p-4 noise-texture">
            <span className="text-white text-7xl font-bold text-center max-sm:text-5xl">
                <OpeningPageTextAnimation />
            </span>
            <ButtonsUi />
        </div>
    );
}
