import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import Modal from 'react-modal';
import ReactGA from 'react-ga4';

// Styles
import './reset.css';
import './App.css';

// Components
import ButtonContainer from './components/ButtonContainer';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import PatchNotesModal from './components/PatchNotesModal';
import AnnouncementModal from './components/AnnouncementModal';
import AlertModal from './components/AlertModal';
import SkeletonLoader from './components/SkeletonLoader';

// Hooks
import useRandomChampions from './hooks/useRandomChampions';
import useClipboard from './hooks/useClipboard';
import { useChampionData } from './hooks/useChampionData';
import useChampionRanking from './hooks/useChampionRanking';
import useModal from './hooks/useModal';
import useAlert from './hooks/useAlert';

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
    getFromStorage(STORAGE_KEYS.BANNED_CHAMPIONS, []),
  );
  const [displayCount, setDisplayCount] = useState(() =>
    getFromStorage(STORAGE_KEYS.DISPLAY_COUNT, 15),
  );
  const [tableOptions, setTableOptions] = useState(() =>
    getFromStorage(STORAGE_KEYS.TABLE_OPTIONS, DEFAULT_TABLE_OPTIONS),
  );
  const [sortOption, setSortOption] = useState(() =>
    getFromStorage(STORAGE_KEYS.SORT_OPTION, 'tier'),
  );
  const [tierDisplay, setTierDisplay] = useState(() =>
    getFromStorage(STORAGE_KEYS.TIER_DISPLAY, true),
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  const [championImages, setChampionImages] = useState({});
  const [tierImages, setTierImages] = useState({});
  const [imagesReadyForCapture, setImagesReadyForCapture] = useState(false);

  // 이미지 업데이트 최적화 - 배치 처리로 리렌더링 최소화
  const updateChampionImages = useCallback(newImages => {
    // 빈 객체는 무시
    if (!newImages || Object.keys(newImages).length === 0) return;

    setChampionImages(prev => {
      const hasChanges = Object.keys(newImages).some(
        key => prev[key] !== newImages[key],
      );
      if (hasChanges) {
        console.log(
          `🖼️ Updating ${Object.keys(newImages).length} champion images`,
        );
        return { ...prev, ...newImages };
      }
      return prev;
    });
  }, []);

  const updateTierImages = useCallback(newTierImages => {
    // 빈 객체는 무시
    if (!newTierImages || Object.keys(newTierImages).length === 0) return;

    setTierImages(prev => {
      const hasChanges = Object.keys(newTierImages).some(
        key => prev[key] !== newTierImages[key],
      );
      if (hasChanges) {
        console.log(
          `🏆 Updating ${Object.keys(newTierImages).length} tier images`,
        );
        return { ...prev, ...newTierImages };
      }
      return prev;
    });
  }, []);
  const [isInitialized, setIsInitialized] = useState(false);

  // 먼저 alert 훅을 초기화
  const {
    alertState,
    showAlert,
    showConfirm,
    showConfirmWithContent,
    showInfoWithContent,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,
  } = useAlert();

  const {
    randomChampions,
    resetCount,
    resetRandomChampions: originalResetRandomChampions,
    handleReRollChampion: originalHandleReRollChampion,
  } = useRandomChampions(
    gameData,
    bannedChampions,
    displayCount,
    {
      showConfirm,
      showConfirmWithContent,
      showInfoWithContent,
      showError,
      showInfo,
    },
    championImages,
  );

  const resetRandomChampions = useCallback(() => {
    originalResetRandomChampions();
    setImagesReadyForCapture(false); // 새로운 챔피언이 뽑히면 캡처 준비 상태를 리셋
  }, [originalResetRandomChampions]);

  const handleReRollChampion = useCallback(
    (table, index) => {
      originalHandleReRollChampion(table, index);
      setImagesReadyForCapture(false); // 개별 챔피언 리롤 시에도 캡처 준비 상태를 리셋
    },
    [originalHandleReRollChampion],
  );

  // 현재 화면에 보이는 챔피언들의 이미지 로딩 완료 여부 확인
  const areDisplayedImagesLoaded = useMemo(() => {
    if (!randomChampions?.table1 || !randomChampions?.table2) return false;

    const displayedChampionIds = [
      ...randomChampions.table1.map(champ => champ?.id).filter(Boolean),
      ...randomChampions.table2.map(champ => champ?.id).filter(Boolean),
    ];

    return displayedChampionIds.every(id => championImages[id]);
  }, [randomChampions, championImages]);

  const { copyImageToClipboard, copyTextToClipboard } = useClipboard(
    captureRef,
    displayCount,
    randomChampions,
    { showSuccess, showError },
  );

  const banModal = useModal();
  const optionModal = useModal();
  const patchNotesModal = useModal();
  const announcementModal = useModal();

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

  const handleToggleBan = useCallback(championId => {
    setBannedChampions(prevBans => {
      const isCurrentlyBanned = prevBans.includes(championId);
      const newBans = isCurrentlyBanned
        ? prevBans.filter(id => id !== championId)
        : [...prevBans, championId];

      // 비동기로 저장하여 UI 블로킹 방지
      requestIdleCallback(() => {
        setToStorage(STORAGE_KEYS.BANNED_CHAMPIONS, newBans);
      });

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
    setToStorage(STORAGE_KEYS.DISPLAY_COUNT, displayCount);
  }, [displayCount]);

  useEffect(() => {
    setToStorage(STORAGE_KEYS.TIER_DISPLAY, tierDisplay);
  }, [tierDisplay]);

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

  if (isLoadingGameData || isLoadingRanking)
    return <SkeletonLoader type="app-loading" />;
  if (gameDataError || rankingError)
    return (
      <div>에러 발생: {gameDataError.message || rankingError.message}</div>
    );

  return (
    dataLoaded && (
      <div className="App">
        <ButtonContainer
          bannedChampionsCount={bannedChampions.length}
          displayCount={displayCount}
          openBanModal={banModal.openModal}
          openOptionModal={optionModal.openModal}
          openReleaseNotesModal={patchNotesModal.openModal}
          openAnnouncementModal={announcementModal.openModal}
          copyImageToClipboard={copyImageToClipboard}
          copyTextToClipboard={copyTextToClipboard}
          imagesReadyForCapture={imagesReadyForCapture}
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
          tierDisplay={tierDisplay}
          setTierDisplay={setTierDisplay}
          setTableOptions={setTableOptions}
          setSortOption={setSortOption}
          championImages={championImages}
          setChampionImages={updateChampionImages}
          tierImages={tierImages}
          setTierImages={updateTierImages}
          championRanking={championRanking}
          alerts={{ showError }}
          areDisplayedImagesLoaded={areDisplayedImagesLoaded}
          imagesReadyForCapture={imagesReadyForCapture}
          setImagesReadyForCapture={setImagesReadyForCapture}
        />
        <PatchNotesModal
          isOpen={patchNotesModal.isOpen}
          closeModal={patchNotesModal.closeModal}
        />
        <AnnouncementModal
          isOpen={announcementModal.isOpen}
          closeModal={announcementModal.closeModal}
        />
        <AlertModal
          isOpen={alertState.isOpen}
          closeModal={closeAlert}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onConfirm={alertState.onConfirm}
          customContent={alertState.customContent}
        />
        <Footer version={gameData.version} />
      </div>
    )
  );
}

export default App;
