import { ButtonsUi } from "./components/ButtonsUi";

export default function Home() {
    return (
        <div className="bg-black h-screen w-screen flex flex-col gap-15 items-center justify-center p-4">
            <span className="text-white text-7xl font-bold text-center">
                Choose Your Action
            </span>
            <ButtonsUi />
        </div>
    );
}
