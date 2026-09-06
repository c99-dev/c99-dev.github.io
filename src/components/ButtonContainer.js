import React from 'react';
import './../styles/ButtonContainer.css';

function ButtonContainer({
  bannedChampionsCount,
  displayCount,
  openBanModal,
  openOptionModal,
  copyImageToClipboard,
  copyTextToClipboard,
  imagesReadyForCapture,
}) {
  return (
    <div className="button-container">
      <button
        className={`ban-button ${
          bannedChampionsCount === 0 ? 'ban-button-empty' : ''
        }`}
        onClick={openBanModal}
      >
        🚫 챔피언 밴 ({bannedChampionsCount})
      </button>
      <button
        className={`copy-button ${
          displayCount > 15 || !imagesReadyForCapture ? 'disabled' : ''
        }`}
        onClick={copyImageToClipboard}
        disabled={displayCount > 15 || !imagesReadyForCapture}
        title={
          displayCount > 15
            ? '이미지 캡처는 15명까지만 지원됩니다'
            : !imagesReadyForCapture
            ? '이미지 캡처 준비 중...'
            : ''
        }
      >
        🖼️ 이미지 복사
      </button>
      <button className="copy-text-button" onClick={copyTextToClipboard}>
        📝 텍스트 복사
      </button>
      <button className="option-button" onClick={openOptionModal}>
        ⚙️ 옵션
      </button>
    </div>
  );
}

export default React.memo(ButtonContainer);
