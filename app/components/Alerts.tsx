import { toast, Bounce } from "react-toastify";

type succesProps = {
    message: string;
    onClose?: () => void;
    time?: number;
    hideProgressBar?: boolean
}

export const notifyError = (message: string) => toast.error(message, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
    style: {
        background: 'black',
        border: '1px solid rgb(28, 28, 28)',
        width: '300px',
        textAlign: 'center'
    }
});

export const notifySuccess = ({ message, onClose, time, hideProgressBar }: succesProps) => toast.success(message, {
    position: "top-center",
    autoClose: time || 5000,
    hideProgressBar: hideProgressBar ?? true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
    style: {
        background: 'black',
        border: '1px solid rgb(28, 28, 28)'
    },
    onClose
});