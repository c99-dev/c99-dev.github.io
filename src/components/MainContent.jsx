import React, { useMemo, useState, useCallback } from 'react';
import ChampionTable from './ChampionTable';
import ImageLoader from './ImageLoader';
import BanModal from './BanModal';
import OptionModal from './OptionModal';

const MemoizedImageLoader = React.memo(ImageLoader);

function MainContent({
  captureRef,
  gameData,
  randomChampions,
  handleReRollChampion,
  tableOptions,
  sortOption,
  resetRandomChampions,
  resetCount,
  isBanModalOpen,
  isOptionModalOpen,
  closeBanModal,
  closeOptionModal,
  bannedChampions,
  setBannedChampions,
  toggleBan,
  displayCount,
  setDisplayCount,
  tierDisplay,
  setTierDisplay,
  setTableOptions,
  setSortOption,
  championImages,
  setChampionImages,
  tierImages,
  setTierImages,
  championRanking,
  alerts,
  areDisplayedImagesLoaded,
  imagesReadyForCapture,
  setImagesReadyForCapture,
}) {
  const [isTeamRerolling, setIsTeamRerolling] = useState(false);

  const champions = useMemo(() => {
    return gameData.championData
      ? Object.values(gameData.championData.data)
      : [];
  }, [gameData.championData]);

  // 현재 화면에 보이는 챔피언들
  const displayedChampions = useMemo(() => {
    if (!randomChampions?.table1 || !randomChampions?.table2) return [];
    return [...randomChampions.table1, ...randomChampions.table2].filter(
      Boolean,
    );
  }, [randomChampions]);

  const handleTeamReroll = useCallback(async () => {
    setIsTeamRerolling(true);

    // 애니메이션을 위한 지연
    setTimeout(() => {
      resetRandomChampions();
      setTimeout(() => {
        setIsTeamRerolling(false);
      }, 120); // 페이드 인 완료 후 상태 리셋
    }, 80); // 페이드 아웃 시간
  }, [resetRandomChampions]);

  return (
    <div className="container" ref={captureRef}>
      <MemoizedImageLoader
        champions={champions}
        championImages={championImages}
        displayedChampions={displayedChampions}
        setChampionImages={setChampionImages}
        setTierImages={setTierImages}
        setImagesReadyForCapture={setImagesReadyForCapture}
        version={gameData.version}
      />
      <div className="tables-container">
        <div className="teams-layout">
          <div className="team-column">
            <ChampionTable
              champions={randomChampions.table1}
              teamName="블루 팀"
              reRoll={handleReRollChampion}
              table="table1"
              version={gameData.version}
              tableOptions={tableOptions}
              sortOption={sortOption}
              tierDisplay={tierDisplay}
              championImages={championImages}
              setChampionImages={setChampionImages}
              championRanking={championRanking}
              setTierImages={setTierImages}
              tierImages={tierImages}
              isTeamRerolling={isTeamRerolling}
              areDisplayedImagesLoaded={areDisplayedImagesLoaded}
            />
          </div>
          <div className="button-column">
            <button
              className={`reroll-button ${
                isTeamRerolling ? 'team-rerolling' : ''
              } ${!areDisplayedImagesLoaded ? 'loading-disabled' : ''}`}
              onClick={handleTeamReroll}
              disabled={!areDisplayedImagesLoaded || isTeamRerolling}
              title={
                !areDisplayedImagesLoaded ? '챔피언 이미지 로딩 중...' : ''
              }
            >
              🎲 다시 뽑기
              <span>({resetCount})</span>
            </button>
          </div>
          <div className="team-column">
            <ChampionTable
              champions={randomChampions.table2}
              teamName="레드 팀"
              reRoll={handleReRollChampion}
              table="table2"
              version={gameData.version}
              tableOptions={tableOptions}
              sortOption={sortOption}
              tierDisplay={tierDisplay}
              championImages={championImages}
              setChampionImages={setChampionImages}
              tierImages={tierImages}
              isTeamRerolling={isTeamRerolling}
              setTierImages={setTierImages}
              championRanking={championRanking}
              areDisplayedImagesLoaded={areDisplayedImagesLoaded}
            />
          </div>
        </div>
      </div>
      <BanModal
        isOpen={isBanModalOpen}
        champions={gameData.championData}
        bannedChampions={bannedChampions}
        setBannedChampions={setBannedChampions}
        toggleBan={toggleBan}
        closeModal={closeBanModal}
        championImages={championImages}
      />
      <OptionModal
        isOpen={isOptionModalOpen}
        displayCount={displayCount}
        setDisplayCount={setDisplayCount}
        tierDisplay={tierDisplay}
        setTierDisplay={setTierDisplay}
        closeModal={closeOptionModal}
        tableOptions={tableOptions}
        setTableOptions={setTableOptions}
        sortOption={sortOption}
        setSortOption={setSortOption}
        maxDisplayCount={Math.floor(
          champions.filter(champion => !bannedChampions.includes(champion.id)).length /
            2,
        )}
        alerts={alerts}
      />
    </div>
  );
}

export default React.memo(MainContent);
