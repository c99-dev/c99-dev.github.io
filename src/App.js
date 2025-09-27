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

  // championImages 상태 변경 추적
  useEffect(() => {
    const base64Count = Object.values(championImages).filter(img =>
      img?.url?.startsWith('data:'),
    ).length;
    console.log(
      `🎯 [APP] championImages 상태 변경됨: 총 ${
        Object.keys(championImages).length
      }개, base64 ${base64Count}개`,
    );
  }, [championImages]);
  const [tierImages, setTierImages] = useState({});

  // tierImages 상태 변경 추적
  useEffect(() => {
    const base64Count = Object.values(tierImages).filter(
      img => typeof img === 'string' && img.startsWith('data:'),
    ).length;
    console.log(
      `🎯 [APP] tierImages 상태 변경됨: 총 ${
        Object.keys(tierImages).length
      }개, base64 ${base64Count}개`,
    );
  }, [tierImages]);

  const [imagesReadyForCapture, setImagesReadyForCapture] = useState(false);

  // 캡처 준비 상태 변화 로깅
  useEffect(() => {
    console.log(
      `🎯 [APP] imagesReadyForCapture 상태 변경: ${imagesReadyForCapture}`,
    );
  }, [imagesReadyForCapture]);

  // 이미지 업데이트 최적화 - 배치 처리로 리렌더링 최소화
  const updateChampionImages = useCallback(newImages => {
    // 빈 객체는 무시
    if (!newImages || Object.keys(newImages).length === 0) return;

    console.log(
      `🔄 [APP] updateChampionImages 호출됨, 새 이미지 수: ${
        Object.keys(newImages).length
      }`,
    );

    // 🔍 전달받은 newImages 샘플 확인
    const newImageSamples = Object.entries(newImages)
      .slice(0, 3)
      .map(([id, img]) => ({
        id,
        hasUrl: !!img?.url,
        hasDataUrl: !!img?.dataUrl,
        urlType: img?.url?.startsWith('data:')
          ? 'base64'
          : img?.url?.startsWith('/')
          ? 'path'
          : 'unknown',
        urlStart: img?.url?.substring(0, 30) + '...',
      }));
    console.log(`🔍 [APP] 받은 newImages 샘플:`, newImageSamples);

    setChampionImages(prev => {
      console.log(
        `🔥 [APP] setChampionImages 콜백 진입, prev: ${
          Object.keys(prev).length
        }개, newImages: ${Object.keys(newImages).length}개`,
      );

      const hasChanges = Object.keys(newImages).some(
        key => prev[key] !== newImages[key],
      );

      console.log(`🔍 [APP] hasChanges: ${hasChanges}`);

      if (hasChanges) {
        // 챔피언 이미지 업데이트
        const updated = { ...prev, ...newImages };

        // base64 이미지 개수 확인
        const base64Count = Object.values(updated).filter(img =>
          img?.url?.startsWith('data:'),
        ).length;

        console.log(
          `✅ [APP] championImages 업데이트됨, 총 ${
            Object.keys(updated).length
          }개, base64 ${base64Count}개`,
        );

        // 🔍 실제 객체 구조 확인
        const sampleEntries = Object.entries(updated).slice(0, 3);
        console.log(
          `🔍 [APP] championImages 구조 샘플:`,
          sampleEntries.map(([id, img]) => ({
            id,
            hasUrl: !!img?.url,
            hasDataUrl: !!img?.dataUrl,
            urlType: img?.url?.startsWith('data:')
              ? 'base64'
              : img?.url?.startsWith('/')
              ? 'path'
              : 'unknown',
            urlStart: img?.url?.substring(0, 30) + '...',
          })),
        );

        // base64 데이터 샘플 확인
        const base64Samples = Object.entries(updated)
          .filter(([_, img]) => img?.url?.startsWith('data:'))
          .slice(0, 3)
          .map(([id, img]) => `${id}: ${img.url?.substring(0, 30)}...`);

        if (base64Samples.length > 0) {
          console.log(`🔍 [APP] base64 샘플:`, base64Samples);
        }

        return updated;
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
        // 티어 이미지 업데이트
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

    return displayedChampionIds.every(id => championImages[id]?.url);
  }, [randomChampions, championImages]);

  const { copyImageToClipboard, copyTextToClipboard } = useClipboard(
    captureRef,
    displayCount,
    randomChampions,
    { showSuccess, showError },
    championImages,
    tierImages,
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
