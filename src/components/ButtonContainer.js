import React from 'react';
import './../styles/ButtonContainer.css';

function ButtonContainer({
  bannedChampionsCount,
  openBanModal,
  openOptionModal,
  copyImageToClipboard,
  copyTextToClipboard,
}) {
  return (
    <div className="button-container">
      <button className="ban-button" onClick={openBanModal}>
        챔피언 밴 ({bannedChampionsCount})
      </button>
      <button className="copy-button" onClick={copyImageToClipboard}>
        이미지 복사
      </button>
      <button className="copy-text-button" onClick={copyTextToClipboard}>
        텍스트 복사
      </button>
      <button className="option-button" onClick={openOptionModal}>
        옵션
      </button>
    </div>
  );
}

export default ButtonContainer;
