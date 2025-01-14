import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from 'react-modal';
import ReactGA from 'react-ga4';

// Styles
import './reset.css';
import './App.css';

// Components
import ButtonContainer from './components/ButtonContainer';
import MainContent from './components/MainContent';
import Footer from './components/Footer';

// Hooks
import useRandomChampions from './hooks/useRandomChampions';
import useClipboard from './hooks/useClipboard';
import { useChampionData } from './hooks/useChampionData';
import useChampionRanking from './hooks/useChampionRanking';
import useModal from './hooks/useModal';

// Utils
import {
  STORAGE_KEYS,
  DEFAULT_TABLE_OPTIONS,
  getFromStorage,
  setToStorage,
} from './utils/storage';

Modal.setAppElement('#root');

function App() {
  const {
    gameData,
    isLoading: isLoadingGameData,
    error: gameDataError,
  } = useChampionData();
  const {
    championRanking,
    isLoading: isLoadingRanking,
    error: rankingError,
  } = useChampionRanking();
  const captureRef = useRef();
  const loggedRef = useRef(false);

  const [bannedChampions, setBannedChampions] = useState(() =>
    getFromStorage(STORAGE_KEYS.BANNED_CHAMPIONS, [])
  );
  const [displayCount, setDisplayCount] = useState(15);
  const [tableOptions, setTableOptions] = useState(() =>
    getFromStorage(STORAGE_KEYS.TABLE_OPTIONS, DEFAULT_TABLE_OPTIONS)
  );
  const [sortOption, setSortOption] = useState(() =>
    getFromStorage(STORAGE_KEYS.SORT_OPTION, 'tier')
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  const [championImages, setChampionImages] = useState({});
  const [tierImages, setTierImages] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    randomChampions,
    resetCount,
    resetRandomChampions: originalResetRandomChampions,
    handleReRollChampion,
  } = useRandomChampions(gameData, bannedChampions, displayCount);

  const resetRandomChampions = useCallback(() => {
    originalResetRandomChampions();
  }, [gameData, bannedChampions, displayCount]);

  const { copyImageToClipboard, copyTextToClipboard } = useClipboard(
    captureRef,
    displayCount,
    randomChampions
  );

  const banModal = useModal();
  const optionModal = useModal();

  useEffect(() => {
    if (gameData.championData && !loggedRef.current) {
      console.log('gameData:', gameData);
      loggedRef.current = true;
    }
  }, [gameData]);

  useEffect(() => {
    if (championRanking.length > 0) {
      console.log('championRanking:', championRanking);
    }
  }, [championRanking]);

  useEffect(() => {
    if (gameDataError) {
      console.error('Failed to load game data:', gameDataError);
    }
    if (rankingError) {
      console.error('Failed to load champion rankings:', rankingError);
    }
  }, [gameDataError, rankingError]);

  const handleToggleBan = useCallback((championId) => {
    setBannedChampions((prevBans) => {
      const newBans = prevBans.includes(championId)
        ? prevBans.filter((id) => id !== championId)
        : [...prevBans, championId];
      setToStorage(STORAGE_KEYS.BANNED_CHAMPIONS, newBans);
      return newBans;
    });
  }, []);

  useEffect(() => {
    setToStorage(STORAGE_KEYS.TABLE_OPTIONS, tableOptions);
    setToStorage(STORAGE_KEYS.SORT_OPTION, sortOption);
  }, [tableOptions, sortOption]);

  useEffect(() => {
    setToStorage(STORAGE_KEYS.BANNED_CHAMPIONS, bannedChampions);
  }, [bannedChampions]);

  useEffect(() => {
    if (gameData.championData && !isInitialized) {
      console.log('Champion data loaded, resetting champions');
      resetRandomChampions();
      setDataLoaded(true);
      setIsInitialized(true);
    }
  }, [gameData.championData, resetRandomChampions, isInitialized]);

  useEffect(() => {
    ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
    ReactGA.send('pageview');
  }, []);

  if (isLoadingGameData || isLoadingRanking) return <div>로딩 중...</div>;
  if (gameDataError || rankingError)
    return (
      <div>에러 발생: {gameDataError.message || rankingError.message}</div>
    );

  return (
    dataLoaded && (
      <div className="App">
        <ButtonContainer
          bannedChampionsCount={bannedChampions.length}
          openBanModal={banModal.openModal}
          openOptionModal={optionModal.openModal}
          copyImageToClipboard={copyImageToClipboard}
          copyTextToClipboard={copyTextToClipboard}
        />
        <MainContent
          captureRef={captureRef}
          gameData={gameData}
          randomChampions={randomChampions}
          handleReRollChampion={handleReRollChampion}
          tableOptions={tableOptions}
          sortOption={sortOption}
          resetRandomChampions={resetRandomChampions}
          resetCount={resetCount}
          isBanModalOpen={banModal.isOpen}
          isOptionModalOpen={optionModal.isOpen}
          closeBanModal={banModal.closeModal}
          closeOptionModal={optionModal.closeModal}
          bannedChampions={bannedChampions}
          setBannedChampions={setBannedChampions}
          toggleBan={handleToggleBan}
          displayCount={displayCount}
          setDisplayCount={setDisplayCount}
          setTableOptions={setTableOptions}
          setSortOption={setSortOption}
          championImages={championImages}
          setChampionImages={setChampionImages}
          tierImages={tierImages}
          setTierImages={setTierImages}
          championRanking={championRanking}
        />
        <Footer version={gameData.version} />
      </div>
    )
  );
}

export default App;
