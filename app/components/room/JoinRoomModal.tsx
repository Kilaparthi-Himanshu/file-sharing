import { motion } from 'framer-motion'

export default function JoinRoomModal({removeModal} : {removeModal: () => void}) {
    return (
        <motion.div
            className="w-[100dvw] h-[100dvh] fixed inset-0 bg-neutral-800/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={removeModal}
        >
            <motion.div 
                className="bg-blue-500 p-10" 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                Join Room
            </motion.div>
        </motion.div>
    )
}