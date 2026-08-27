import { useState, useCallback, useRef, useEffect } from "react";

export interface UseWorkspaceToastReturn {
  toastMessage: string | null;
  setToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  triggerToast: (msg: string) => void;
}

export function useWorkspaceToast(): UseWorkspaceToastReturn {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = useCallback((msg: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToastMessage(msg);
    timerRef.current = setTimeout(() => {
      setToastMessage(null);
      timerRef.current = null;
    }, 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    toastMessage,
    setToastMessage,
    triggerToast,
  };
}
