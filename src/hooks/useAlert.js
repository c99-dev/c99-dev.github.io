import { useState, useCallback } from 'react';

function useAlert() {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    customContent: null,
  });

  const showAlert = useCallback((message, type = 'info', title = null) => {
    return new Promise(resolve => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => resolve(true),
        customContent: null,
      });
    });
  }, []);

  const showConfirm = useCallback((message, title = '확인') => {
    return new Promise(resolve => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        onConfirm: () => resolve(true),
        customContent: null,
      });
    });
  }, []);

  const showConfirmWithContent = useCallback(
    (message, title = '확인', customContent = null) => {
      return new Promise(resolve => {
        setAlertState({
          isOpen: true,
          title,
          message,
          type: 'confirm',
          onConfirm: () => resolve(true),
          customContent,
        });
      });
    },
    [],
  );

  const showInfoWithContent = useCallback(
    (message, title = '정보', customContent = null) => {
      return new Promise(resolve => {
        setAlertState({
          isOpen: true,
          title,
          message,
          type: 'success',
          onConfirm: () => resolve(true),
          customContent,
        });
      });
    },
    [],
  );

  const showSuccess = useCallback(
    (message, title = '성공') => {
      return showAlert(message, 'success', title);
    },
    [showAlert],
  );

  const showError = useCallback(
    (message, title = '오류') => {
      return showAlert(message, 'error', title);
    },
    [showAlert],
  );

  const showWarning = useCallback(
    (message, title = '경고') => {
      return showAlert(message, 'warning', title);
    },
    [showAlert],
  );

  const showInfo = useCallback(
    (message, title = '정보') => {
      return showAlert(message, 'info', title);
    },
    [showAlert],
  );

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    alertState,
    showAlert,
    showConfirm,
    showConfirmWithContent,
    showInfoWithContent,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,
  };
}

export default useAlert;
