import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from 'react-modal';
import ReactGA from 'react-ga4';
import ButtonContainer from './components/ButtonContainer';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import PatchNotesModal from './components/PatchNotesModal';
import AnnouncementModal from './components/AnnouncementModal';
import AlertModal from './components/AlertModal';
import Icon from './components/Icon';
import useRandomChampions from './hooks/useRandomChampions';
import useClipboard from './hooks/useClipboard';
import { useChampionData } from './hooks/useChampionData';
import useChampionRanking from './hooks/useChampionRanking';
import useModal from './hooks/useModal';
import useAlert from './hooks/useAlert';
import {
  STORAGE_KEYS,
  DEFAULT_TABLE_OPTIONS,
  getFromStorage,
  setToStorage,
} from './utils/storage';
import './reset.css';
import './App.css';

Modal.setAppElement('#root');

function App() {
  const { gameData, isLoading, error } = useChampionData();
  const { championRanking, error: rankingError } = useChampionRanking();
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
  const [championImages, setChampionImages] = useState({});
  const [tierImages, setTierImages] = useState({});
  const [imagesReadyForCapture, setImagesReadyForCapture] = useState(false);
  const captureRef = useRef(null);
  const alerts = useAlert();
  const {
    randomChampions,
    resetCount,
    resetRandomChampions,
    handleReRollChampion,
  } = useRandomChampions(
    gameData,
    bannedChampions,
    displayCount,
    alerts,
    championImages,
  );
  const { copyImageToClipboard, copyTextToClipboard } = useClipboard(
    captureRef,
    displayCount,
    randomChampions,
    alerts,
    championImages,
    tierImages,
    sortOption,
    championRanking,
  );
  const banModal = useModal();
  const optionModal = useModal();
  const patchNotesModal = useModal();
  const announcementModal = useModal();

  const updateChampionImages = useCallback(
    images => setChampionImages(previous => ({ ...previous, ...images })),
    [],
  );
  const toggleBan = useCallback(
    id =>
      setBannedChampions(previous =>
        previous.includes(id)
          ? previous.filter(item => item !== id)
          : [...previous, id],
      ),
    [],
  );

  useEffect(() => {
    setToStorage(STORAGE_KEYS.BANNED_CHAMPIONS, bannedChampions);
    setToStorage(STORAGE_KEYS.DISPLAY_COUNT, displayCount);
    setToStorage(STORAGE_KEYS.TABLE_OPTIONS, tableOptions);
    setToStorage(STORAGE_KEYS.SORT_OPTION, sortOption);
    setToStorage(STORAGE_KEYS.TIER_DISPLAY, tierDisplay);
  }, [bannedChampions, displayCount, tableOptions, sortOption, tierDisplay]);

  useEffect(() => {
    if (process.env.REACT_APP_GA_TRACKING_ID) {
      ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
      ReactGA.send('pageview');
    }
  }, []);

  if (isLoading)
    return (
      <div className="app-status" role="status">
        <Icon name="dice" size={36} />
        <h1>챔피언을 불러오고 있어요</h1>
        <p>잠시만 기다려주세요.</p>
      </div>
    );
  if (error)
    return (
      <div className="app-status" role="alert">
        <h1>데이터를 불러오지 못했어요</h1>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );

  const availableCount = Object.values(gameData.championData.data).filter(
    champion => !bannedChampions.includes(champion.id),
  ).length;
  const actualCount = randomChampions.table1.length;
  return (
    <div className="App">
      <header className="site-header">
        <a className="brand" href="/" aria-label="칼바람 랜덤 픽 홈">
          <span className="brand-mark">
            <Icon name="dice" size={19} />
          </span>
          <h1>
            칼바람 <strong>랜덤 픽</strong>
          </h1>
        </a>
        <div className="header-meta">
          <span className="status-dot" />
          패치 {gameData.patch || gameData.version}
          <span className="header-divider">/</span>
          <span>챔피언 {Object.keys(gameData.championData.data).length}명</span>
        </div>
      </header>
      <main className="workspace">
        <ButtonContainer
          resetRandomChampions={resetRandomChampions}
          canReroll={availableCount >= 2}
          bannedChampionsCount={bannedChampions.length}
          displayCount={displayCount}
          openBanModal={banModal.openModal}
          openOptionModal={optionModal.openModal}
          copyImageToClipboard={copyImageToClipboard}
          copyTextToClipboard={copyTextToClipboard}
          imagesReadyForCapture={imagesReadyForCapture}
        />
        {rankingError && (
          <p className="notice" role="status">
            통계를 불러오지 못했습니다. 챔피언 추첨은 계속 사용할 수 있습니다.
          </p>
        )}
        {actualCount < displayCount && (
          <p className="notice" role="status">
            밴을 제외한 챔피언이 부족해 팀당 {actualCount}명으로 표시합니다.
            밴을 해제하면 설정한 인원이 복원됩니다.
          </p>
        )}
        <div className="draft-caption">
          <span>팀당 {actualCount}명 · 중복 없이 추첨</span>
          <span aria-live="polite">{Math.max(1, resetCount)}번째 추첨</span>
        </div>
        <MainContent
          captureRef={captureRef}
          gameData={gameData}
          randomChampions={randomChampions}
          handleReRollChampion={handleReRollChampion}
          tableOptions={tableOptions}
          sortOption={sortOption}
          isBanModalOpen={banModal.isOpen}
          isOptionModalOpen={optionModal.isOpen}
          closeBanModal={banModal.closeModal}
          closeOptionModal={optionModal.closeModal}
          bannedChampions={bannedChampions}
          setBannedChampions={setBannedChampions}
          toggleBan={toggleBan}
          displayCount={displayCount}
          setDisplayCount={setDisplayCount}
          tierDisplay={tierDisplay}
          setTierDisplay={setTierDisplay}
          setTableOptions={setTableOptions}
          setSortOption={setSortOption}
          championImages={championImages}
          setChampionImages={updateChampionImages}
          tierImages={tierImages}
          setTierImages={setTierImages}
          championRanking={championRanking}
          alerts={alerts}
          setImagesReadyForCapture={setImagesReadyForCapture}
        />
        <p className="draft-help">
          <Icon name="refresh" size={14} />
          챔피언을 누르면 해당 챔피언만 다시 뽑을 수 있어요.
          <span>티어는 lol.ps 통계 기준이며, 팀 전력을 보장하지 않습니다.</span>
        </p>
      </main>
      <Footer
        version={gameData.patch || gameData.version}
        rankingFetchedAt={gameData.rankingFetchedAt}
        openReleaseNotesModal={patchNotesModal.openModal}
        openAnnouncementModal={announcementModal.openModal}
      />
      <PatchNotesModal
        isOpen={patchNotesModal.isOpen}
        closeModal={patchNotesModal.closeModal}
      />
      <AnnouncementModal
        isOpen={announcementModal.isOpen}
        closeModal={announcementModal.closeModal}
      />
      <AlertModal {...alerts.alertState} closeModal={alerts.closeAlert} />
    </div>
  );
}
export default App;
