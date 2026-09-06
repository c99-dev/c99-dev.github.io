import React from 'react';
import Modal from 'react-modal';
import '../styles/BaseModal.css';

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
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel={title || '알림'}
      className="base-modal-content"
      overlayClassName="base-modal-overlay"
      shouldCloseOnOverlayClick={closeOnOverlayClick}
      shouldCloseOnEsc={closeOnEsc}
      bodyOpenClassName="ReactModal__Body--open"
    >
      <div
        className="base-modal-content-inner"
        onClick={event => {
          if (closeOnOverlayClick && event.target === event.currentTarget)
            onClose();
        }}
      >
        <div className={`base-modal-wrapper ${className}`} style={{ maxWidth }}>
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
