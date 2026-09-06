import React, { useMemo, useCallback, useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import SkeletonLoader from './SkeletonLoader';
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
  const [searchTerm, setSearchTerm] = useState('');

  // 모달이 열릴 때마다 검색어 초기화
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleClearBans = useCallback(() => {
    setBannedChampions([]);
  }, [setBannedChampions]);

  const handleSearchChange = useCallback(e => {
    setSearchTerm(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const sortedChampions = useMemo(() => {
    return champions && champions.data
      ? Object.values(champions.data).sort((a, b) =>
          a.name.localeCompare(b.name),
        )
      : [];
  }, [champions]);

  const filteredChampions = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedChampions;
    }
    return sortedChampions.filter(champion =>
      champion.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [sortedChampions, searchTerm]);

  const renderChampion = useCallback(
    champion => {
      const isBanned = bannedChampions.includes(champion.id);
      return (
        <button
          type="button"
          aria-pressed={isBanned}
          aria-label={`${champion.name} ${isBanned ? '밴 해제' : '밴'}`}
          key={champion.id}
          className={`champion-item ${isBanned ? 'banned' : ''}`}
          data-champion-id={champion.id}
        >
          {championImages[champion.id]?.url ? (
            <img
              src={championImages[champion.id].url}
              alt={champion.name}
              className={isBanned ? 'banned' : ''}
            />
          ) : (
            <SkeletonLoader type="champion-ban" />
          )}
          <span className={isBanned ? 'banned' : ''}>{champion.name}</span>
        </button>
      );
    },
    [bannedChampions, championImages],
  );

  const handleChampionClick = useCallback(
    e => {
      const championId = e.target.closest('.champion-item')?.dataset.championId;
      if (championId) {
        toggleBan(championId);
      }
    },
    [toggleBan],
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title="챔피언 밴"
      maxWidth="900px"
      className="ban-modal"
    >
      <div className="ban-modal-search">
        <div className="search-input-container">
          <input
            type="text"
            aria-label="챔피언 이름 검색"
            placeholder="챔피언 이름으로 검색..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="champion-search-input"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="search-clear-btn"
              aria-label="검색어 지우기"
            >
              ×
            </button>
          )}
        </div>
        <div className="search-results-info">
          {searchTerm ? (
            <span>
              '{searchTerm}' 검색 결과: {filteredChampions.length}개
            </span>
          ) : (
            <span>전체 챔피언: {sortedChampions.length}개</span>
          )}
        </div>
      </div>

      <div
        className={`ban-modal-content ${
          filteredChampions.length === 0 ? 'no-scroll' : ''
        }`}
        onClick={handleChampionClick}
      >
        {filteredChampions.length > 0 ? (
          filteredChampions.map(renderChampion)
        ) : (
          <div className="no-results">
            <span>검색 결과가 없습니다.</span>
            <button onClick={handleClearSearch} className="clear-search-btn">
              검색어 지우기
            </button>
          </div>
        )}
      </div>

      <div className="base-modal-footer">
        <button
          onClick={handleClearBans}
          className="base-modal-button base-modal-button-danger"
        >
          모두 해제 ({bannedChampions.length})
        </button>
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

export default React.memo(BanModal);
