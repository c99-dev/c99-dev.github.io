import React, { useMemo, useCallback } from 'react';
import Modal from 'react-modal';
import './../styles/BanModal.css';

function BanModal({
  isOpen,
  champions,
  bannedChampions,
  toggleBan,
  closeModal,
  setBannedChampions,
  championImages,
}) {
  const handleClearBans = useCallback(() => {
    setBannedChampions([]);
    localStorage.removeItem('lolApp_bannedChampions');
  }, [setBannedChampions]);

  const sortedChampions = useMemo(() => {
    return champions && champions.data
      ? Object.values(champions.data).sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      : [];
  }, [champions]);

  const renderChampion = useCallback(
    (champion) => {
      const isBanned = bannedChampions.includes(champion.id);
      return (
        <div
          key={champion.id}
          className={`champion-item ${isBanned ? 'banned' : ''}`}
          data-champion-id={champion.id}
        >
          {championImages[champion.id] ? (
            <img
              src={championImages[champion.id]}
              alt={champion.name}
              className={isBanned ? 'banned' : ''}
            />
          ) : (
            <div className="loading-indicator">로딩 중...</div>
          )}
          <span className={isBanned ? 'banned' : ''}>{champion.name}</span>
        </div>
      );
    },
    [bannedChampions, championImages]
  );

  const handleChampionClick = useCallback(
    (e) => {
      const championId = e.target.closest('.champion-item')?.dataset.championId;
      if (championId) {
        toggleBan(championId);
      }
    },
    [toggleBan]
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      className="modal-overlay"
      ariaHideApp={false}
    >
      <div className="modal-wrapper">
        <div className="modal-content" onClick={handleChampionClick}>
          {sortedChampions.map(renderChampion)}
        </div>
        <div className="option-modal-buttons">
          <button onClick={handleClearBans} className="clear-button">
            모두 해제 ({bannedChampions.length})
          </button>
          <button onClick={closeModal} className="close-button">
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default React.memo(BanModal);
