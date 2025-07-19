import { toast, ToastOptions } from 'react-toastify';

// Default toast options for consistent styling
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  className: "!bg-[#161b22] !border !border-[#30363d] !text-[#c9d1d9]",
  progressClassName: "!bg-[#58a6ff]",
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, { ...defaultOptions, ...options });
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, { ...defaultOptions, ...options });
  },

  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, { ...defaultOptions, ...options });
  },

  warning: (message: string, options?: ToastOptions) => {
    return toast.warn(message, { ...defaultOptions, ...options });
  },


}; 