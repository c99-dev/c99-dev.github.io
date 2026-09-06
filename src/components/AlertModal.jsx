import React from 'react';
import BaseModal from './BaseModal';
import '../styles/AlertModal.css';

function AlertModal({
  isOpen,
  closeModal,
  title,
  message,
  type = 'info',
  onConfirm = null,
  customContent = null,
}) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    closeModal();
  };

  const handleCancel = () => {
    closeModal();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'confirm':
        return '❓';
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    return `alert-modal-${type}`;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      className={`alert-modal ${getTypeClass()}`}
      showHeader={false}
      title={title || '알림'}
    >
      <div className="alert-modal-content">
        <div className="alert-modal-icon">{getIcon()}</div>
        <div className="alert-modal-text">
          {title && <h3 className="alert-modal-title">{title}</h3>}
          <p className="alert-modal-message">{message}</p>
          {customContent && (
            <div className="alert-modal-custom">{customContent}</div>
          )}
        </div>
      </div>
      <div className="alert-modal-buttons">
        {type === 'confirm' ? (
          <>
            <button
              onClick={handleCancel}
              className="base-modal-button base-modal-button-secondary"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="base-modal-button base-modal-button-primary"
            >
              확인
            </button>
          </>
        ) : (
          <button
            onClick={handleConfirm}
            className="base-modal-button base-modal-button-primary"
          >
            확인
          </button>
        )}
      </div>
    </BaseModal>
  );
}

export default AlertModal;
