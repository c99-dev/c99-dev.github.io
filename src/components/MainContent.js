import React, { useMemo } from 'react';
import ChampionTable from './ChampionTable';
import ImageLoader from './ImageLoader';
import BanModal from './BanModal';
import OptionModal from './OptionModal';

function MainContent(props) {
  const {
    captureRef,
    gameData,
    randomChampions,
    handleReRollChampion,
    tableOptions,
    sortOption,
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
    setImagesReadyForCapture,
  } = props;
  const champions = useMemo(
    () => Object.values(gameData.championData.data),
    [gameData.championData],
  );
  const displayedChampions = useMemo(
    () => [...randomChampions.table1, ...randomChampions.table2],
    [randomChampions],
  );
  return (
    <>
      <ImageLoader
        champions={champions}
        displayedChampions={displayedChampions}
        setChampionImages={setChampionImages}
        setTierImages={setTierImages}
        setImagesReadyForCapture={setImagesReadyForCapture}
      />
      <div className="container" ref={captureRef}>
        <div className="teams-layout">
          {['table1', 'table2'].map((table, index) => (
            <ChampionTable
              key={table}
              champions={randomChampions[table]}
              teamName={index === 0 ? '블루 팀' : '레드 팀'}
              reRoll={handleReRollChampion}
              table={table}
              tableOptions={tableOptions}
              sortOption={sortOption}
              tierDisplay={tierDisplay}
              championImages={championImages}
              championRanking={championRanking}
              tierImages={tierImages}
            />
          ))}
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
          champions.filter(champion => !bannedChampions.includes(champion.id))
            .length / 2,
        )}
        alerts={alerts}
      />
    </>
  );
}
export default React.memo(MainContent);
