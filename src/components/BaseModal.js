import React, { useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import './../styles/BaseModal.css';

function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  maxWidth = '600px',
  className = '',
  showHeader = true,
}) {
  // ESC 키로 모달 닫기
  const handleKeyDown = useCallback(
    event => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [closeOnEsc, isOpen, onClose],
  );

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = useCallback(
    event => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose],
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeOnOverlayClick ? onClose : undefined}
      className="base-modal-content"
      overlayClassName="base-modal-overlay"
      ariaHideApp={false}
      shouldCloseOnOverlayClick={closeOnOverlayClick}
      shouldCloseOnEsc={closeOnEsc}
      closeTimeoutMS={0}
    >
      <div className="base-modal-content-inner" onClick={handleOverlayClick}>
        <div
          className={`base-modal-wrapper ${className}`}
          style={{ maxWidth }}
          onClick={e => e.stopPropagation()}
        >
          {showHeader && (title || showCloseButton) && (
            <div className="base-modal-header">
              {title && <h2 className="base-modal-title">{title}</h2>}
              {showCloseButton && (
                <button
                  className="base-modal-close-button"
                  onClick={onClose}
                  aria-label="모달 닫기"
                >
                  ×
                </button>
              )}
            </div>
          )}

          <div className="base-modal-body">{children}</div>
        </div>
      </div>
    </Modal>
  );
}

export default BaseModal;
