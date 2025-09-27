import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import './../styles/AnnouncementModal.css';

function AnnouncementModal({ isOpen, closeModal }) {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const response = await fetch('/json/announcement.json');
        if (!response.ok) {
          throw new Error('공지사항을 불러올 수 없습니다.');
        }
        const data = await response.json();
        setAnnouncement(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchAnnouncement();
    }
  }, [isOpen]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="announcement-loading">공지사항을 불러오는 중...</div>
      );
    }

    if (error) {
      return <div className="announcement-error">오류: {error}</div>;
    }

    if (!announcement) {
      return <div className="announcement-empty">공지사항이 없습니다.</div>;
    }

    return (
      <div className="announcement-section">
        <div className="announcement-content">
          {announcement.announcements.map((item, index) => (
            <div key={index} className="announcement-item">
              <h4 className="announcement-title">{item.title}</h4>
              <div className="announcement-text">
                {item.content.map((line, lineIndex) => (
                  <p key={lineIndex} className="announcement-line">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        {announcement.date && (
          <div className="announcement-date">📅 {announcement.date}</div>
        )}
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title="📢 공지사항"
      maxWidth="600px"
      className="announcement-modal"
    >
      <div className="announcement-modal-content">{renderContent()}</div>

      <div className="base-modal-footer">
        <button
          onClick={closeModal}
          className="base-modal-button base-modal-button-secondary"
        >
          닫기
        </button>
      </div>
    </BaseModal>
  );
}

export default React.memo(AnnouncementModal);
