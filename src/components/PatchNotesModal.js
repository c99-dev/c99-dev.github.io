import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import './../styles/PatchNotesModal.css';

const CHANGE_TYPE_COLORS = {
  '새로운 기능': '#4caf50', // 초록색 - 새로운 기능
  '디자인 개선': '#2196f3', // 파란색 - 디자인/UI
  '사용 편의성 향상': '#ff9800', // 주황색 - 편의성
  '기술적 개선': '#9c27b0', // 보라색 - 기술/성능
  '버그 수정': '#f44336', // 빨간색 - 버그 수정
  '애니메이션 및 인터랙션': '#e91e63', // 핑크색 - 애니메이션
  '핵심 기능': '#4caf50', // 초록색 - 핵심 기능
  '정보 제공': '#00bcd4', // 시안색 - 정보
  '편의 기능': '#ff9800', // 주황색 - 편의 기능
  '사용자 경험': '#ff5722', // 주황-빨강 - 사용자 경험
};

function PatchNotesModal({ isOpen, closeModal }) {
  const [patchNotes, setPatchNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/json/patchNotes.json');
        if (!response.ok) {
          throw new Error('패치 노트를 불러올 수 없습니다.');
        }
        const data = await response.json();
        setPatchNotes(data.patchNotes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPatchNotes();
    }
  }, [isOpen]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="patch-notes-loading">패치 노트를 불러오는 중...</div>
      );
    }

    if (error) {
      return <div className="patch-notes-error">오류: {error}</div>;
    }

    if (patchNotes.length === 0) {
      return <div className="patch-notes-empty">패치 노트가 없습니다.</div>;
    }

    return patchNotes.map(patch => (
      <div key={patch.version} className="patch-item">
        <div className="patch-header">
          <h3>{patch.title}</h3>
          <div className="patch-meta">
            <span className="patch-version">v{patch.version}</span>
            <span className="patch-date">{patch.date}</span>
          </div>
        </div>

        <div className="changes-container">
          {patch.changes.map((changeGroup, groupIndex) => (
            <div key={groupIndex} className="change-group">
              <h4
                className="change-category"
                style={{
                  color: CHANGE_TYPE_COLORS[changeGroup.category] || '#4caf50',
                }}
              >
                {changeGroup.category}
              </h4>
              <ul className="change-items">
                {changeGroup.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="change-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title="📋 패치 노트"
      maxWidth="700px"
      className="patch-notes-modal"
    >
      <div className="patch-notes-content">{renderContent()}</div>

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

export default React.memo(PatchNotesModal);
