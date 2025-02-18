import React, { useMemo } from 'react';
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
  setTableOptions,
  setSortOption,
  championImages,
  setChampionImages,
  tierImages,
  setTierImages,
  championRanking,
}) {
  const champions = useMemo(() => {
    return gameData.championData
      ? Object.values(gameData.championData.data)
      : [];
  }, [gameData.championData]);

  return (
    <div className="container" ref={captureRef}>
      <MemoizedImageLoader
        version={gameData.version}
        champions={champions}
        setChampionImages={setChampionImages}
        setTierImages={setTierImages}
        randomChampions={randomChampions}
      />
      <ChampionTable
        champions={randomChampions.table1}
        teamName="블루 팀"
        reRoll={handleReRollChampion}
        table="table1"
        version={gameData.version}
        tableOptions={tableOptions}
        sortOption={sortOption}
        championImages={championImages}
        setChampionImages={setChampionImages}
        championRanking={championRanking}
        setTierImages={setTierImages}
        tierImages={tierImages}
      />
      <button onClick={resetRandomChampions}>
        다시 뽑기
        <span>({resetCount})</span>
      </button>
      <ChampionTable
        champions={randomChampions.table2}
        teamName="레드 팀"
        reRoll={handleReRollChampion}
        table="table2"
        version={gameData.version}
        tableOptions={tableOptions}
        sortOption={sortOption}
        championImages={championImages}
        setChampionImages={setChampionImages}
        tierImages={tierImages}
        setTierImages={setTierImages}
        championRanking={championRanking}
      />
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
        closeModal={closeOptionModal}
        tableOptions={tableOptions}
        setTableOptions={setTableOptions}
        sortOption={sortOption}
        setSortOption={setSortOption}
        maxDisplayCount={Math.floor(
          (Object.keys(gameData.championData.data || {}).length -
            bannedChampions.length) /
            2
        )}
      />
    </div>
  );
}

export default MainContent;
