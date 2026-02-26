import { toast } from 'sonner';

export const notificationService = {
  success: (message: string) => {
    toast.success(message, {
      position: 'top-right',
      duration: 3000,
    });
  },

  error: (message: string) => {
    toast.error(message, {
      position: 'top-right',
      duration: 4000,
    });
  },

  info: (message: string) => {
    toast(message, {
      position: 'top-right',
      duration: 3000,
    });
  },

  warning: (message: string) => {
    toast.warning(message, {
      position: 'top-right',
      duration: 3000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};
