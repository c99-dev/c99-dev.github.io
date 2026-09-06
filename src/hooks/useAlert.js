import { useState, useCallback, useRef } from 'react';

function useAlert() {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    customContent: null,
  });
  const pending = useRef(null);
  const settle = useCallback(value => {
    pending.current?.(value);
    pending.current = null;
    setAlertState(previous => ({ ...previous, isOpen: false }));
  }, []);
  const open = useCallback(
    (message, type, title, customContent = null) => {
      pending.current?.(false);
      return new Promise(resolve => {
        pending.current = resolve;
        setAlertState({
          isOpen: true,
          message,
          type,
          title,
          customContent,
          onConfirm: () => settle(true),
        });
      });
    },
    [settle],
  );
  const showAlert = useCallback(
    (message, type = 'info', title = null) => open(message, type, title),
    [open],
  );
  const showConfirm = useCallback(
    (message, title = '확인') => open(message, 'confirm', title),
    [open],
  );
  const showConfirmWithContent = useCallback(
    (message, title = '확인', content = null) =>
      open(message, 'confirm', title, content),
    [open],
  );
  const showInfoWithContent = useCallback(
    (message, title = '정보', content = null) =>
      open(message, 'success', title, content),
    [open],
  );
  const showSuccess = useCallback(
    (message, title = '완료') => open(message, 'success', title),
    [open],
  );
  const showError = useCallback(
    (message, title = '오류') => open(message, 'error', title),
    [open],
  );
  const showInfo = useCallback(
    (message, title = '안내') => open(message, 'info', title),
    [open],
  );
  const showWarning = useCallback(
    (message, title = '안내') => open(message, 'warning', title),
    [open],
  );
  const closeAlert = useCallback(() => settle(false), [settle]);
  return {
    alertState,
    showAlert,
    showConfirm,
    showConfirmWithContent,
    showInfoWithContent,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    closeAlert,
  };
}
export default useAlert;
