import React from 'react';
import Icon from './Icon';
import '../styles/ButtonContainer.css';

function ButtonContainer({
  resetRandomChampions,
  canReroll,
  bannedChampionsCount,
  displayCount,
  openBanModal,
  openOptionModal,
  copyImageToClipboard,
  copyTextToClipboard,
  imagesReadyForCapture,
}) {
  return (
    <nav className="button-container" aria-label="추첨 도구">
      <div className="toolbar-group">
        <button
          className="reroll-button"
          onClick={resetRandomChampions}
          disabled={!canReroll}
        >
          <Icon name="dice" size={16} />
          다시 뽑기
        </button>
        <button
          className={
            bannedChampionsCount ? 'ban-button has-bans' : 'ban-button'
          }
          onClick={openBanModal}
        >
          <Icon name="ban" />
          챔피언 밴<span className="button-count">{bannedChampionsCount}</span>
        </button>
        <button onClick={openOptionModal}>
          <Icon name="settings" />
          옵션<span className="toolbar-detail">팀당 {displayCount}명</span>
        </button>
      </div>
      <div className="toolbar-group share-tools">
        <button onClick={copyTextToClipboard}>
          <Icon name="copy" />
          텍스트 복사
        </button>
        <button
          onClick={copyImageToClipboard}
          disabled={displayCount > 15 || !imagesReadyForCapture}
          title={
            displayCount > 15
              ? '이미지 캡처는 팀당 15명까지 지원됩니다'
              : !imagesReadyForCapture
                ? '이미지를 준비하고 있습니다'
                : '두 팀의 챔피언을 이미지로 복사'
          }
        >
          <Icon name="image" />
          이미지 복사
        </button>
      </div>
    </nav>
  );
}
export default React.memo(ButtonContainer);
