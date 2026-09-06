import React, { useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import './../styles/BaseModal.css';

let scrollLocks = 0;
let originalOverflow = '';

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
  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (!isOpen) return;
    if (scrollLocks === 0) originalOverflow = document.body.style.overflow;
    scrollLocks += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

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
      onRequestClose={onClose}
      className="base-modal-content"
      overlayClassName="base-modal-overlay"
      contentLabel={title || '설정'}
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
