import { AnimatePresence } from "framer-motion";

const ModalRenderer = ({ isOpen, children }: { isOpen: boolean, children: React.ReactNode }) => {
    return (
        <AnimatePresence>
            {isOpen && children}
        </AnimatePresence>
    );
}

export default ModalRenderer;
