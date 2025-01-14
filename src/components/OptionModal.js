import React, { useState, useEffect, useCallback } from "react";
import Modal from "react-modal";

function OptionModal({
  isOpen,
  displayCount,
  setDisplayCount,
  sortOption,
  setSortOption,
  closeModal,
  maxDisplayCount,
}) {
  const [inputValue, setInputValue] = useState(String(displayCount));

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      if (
        value === "" ||
        (Number(value) >= 1 && Number(value) <= maxDisplayCount)
      ) {
        setInputValue(value);
      }
    },
    [maxDisplayCount]
  );

  const handleSave = useCallback(() => {
    const numValue = Number(inputValue);
    if (numValue >= 1 && numValue <= maxDisplayCount) {
      setDisplayCount(numValue);
      closeModal();
    } else {
      alert(`챔피언 수는 1에서 ${maxDisplayCount} 사이의 값이어야 합니다.`);
    }
  }, [inputValue, maxDisplayCount, setDisplayCount, closeModal]);

  useEffect(() => {
    setInputValue(String(displayCount));
  }, [displayCount]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      className="modal-overlay"
      ariaHideApp={false}
    >
      <div className="modal-wrapper">
        <h2 className="option-modal-title">옵션 설정</h2>

        <div className="option-section">
          <label className="option-label" htmlFor="displayCount">
            챔피언 수:
          </label>
          <input
            type="number"
            id="displayCount"
            value={inputValue}
            onChange={handleInputChange}
            className="option-input"
            min="1"
            max={maxDisplayCount}
          />
        </div>

        <div className="option-section">
          <label className="option-label" htmlFor="sortOption">
            정렬 옵션:
          </label>
          <select
            id="sortOption"
            className="option-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="tier">티어순</option>
            <option value="alphabetical">이름순</option>
            <option value="random">무작위</option>
          </select>
        </div>

        <div className="option-buttons">
          <button className="option-save-button" onClick={handleSave}>
            저장
          </button>
          <button onClick={closeModal} className="close-button">
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default React.memo(OptionModal);
