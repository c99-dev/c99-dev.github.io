import React, { useState, useEffect, useCallback } from 'react';
import BaseModal from './BaseModal';
import './../styles/OptionModal.css';

function OptionModal({
  isOpen,
  displayCount,
  setDisplayCount,
  sortOption,
  setSortOption,
  tierDisplay,
  setTierDisplay,
  closeModal,
  maxDisplayCount,
  alerts,
}) {
  const [inputValue, setInputValue] = useState(String(displayCount));
  const [sortValue, setSortValue] = useState(sortOption);
  const [tierDisplayValue, setTierDisplayValue] = useState(tierDisplay);

  const handleInputChange = useCallback(
    e => {
      const value = e.target.value;
      if (
        value === '' ||
        (Number(value) >= 1 && Number(value) <= maxDisplayCount)
      ) {
        setInputValue(value);
      }
    },
    [maxDisplayCount],
  );

  const handleSortChange = useCallback(e => {
    setSortValue(e.target.value);
  }, []);

  const handleTierDisplayChange = useCallback(e => {
    setTierDisplayValue(e.target.checked);
  }, []);

  const handleSave = useCallback(() => {
    const numValue = Number(inputValue);
    if (Number.isInteger(numValue) && numValue >= 1 && numValue <= maxDisplayCount) {
      setDisplayCount(numValue);
      setSortOption(sortValue);
      setTierDisplay(tierDisplayValue);
      closeModal();
    } else {
      if (alerts && alerts.showError) {
        alerts.showError(
          maxDisplayCount < 1
            ? '챔피언 밴을 해제한 뒤 인원을 설정해주세요.'
            : `챔피언 수는 1에서 ${maxDisplayCount} 사이의 정수여야 합니다.`,
        );
      }
    }
  }, [
    inputValue,
    sortValue,
    tierDisplayValue,
    maxDisplayCount,
    setDisplayCount,
    setSortOption,
    setTierDisplay,
    closeModal,
    alerts,
  ]);

  useEffect(() => {
    setInputValue(String(displayCount));
    setSortValue(sortOption);
    setTierDisplayValue(tierDisplay);
  }, [isOpen, displayCount, sortOption, tierDisplay]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title="⚙️ 옵션 설정"
      maxWidth="500px"
      className="option-modal"
    >
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
        <div className="option-help-text">
          ※ 이미지 캡처는 15명까지만 지원됩니다 (16명 이상 선택 시 캡처 불가)
        </div>
      </div>

      <div className="option-section">
        <label className="option-label" htmlFor="sortOption">
          정렬 옵션:
        </label>
        <select
          id="sortOption"
          className="option-select"
          value={sortValue}
          onChange={handleSortChange}
        >
          <option value="tier">티어순</option>
          <option value="alphabetical">이름순</option>
          <option value="random">무작위</option>
        </select>
      </div>

      <div className="option-section">
        <label className="option-label checkbox-label">
          <input
            type="checkbox"
            id="tierDisplay"
            checked={tierDisplayValue}
            onChange={handleTierDisplayChange}
            className="option-checkbox"
          />
          티어표시 (티어, 꿀벌, OP 표시)
        </label>
      </div>

      <div className="base-modal-footer">
        <button
          className="base-modal-button base-modal-button-primary"
          onClick={handleSave}
        >
          저장
        </button>
        <button
          onClick={closeModal}
          className="base-modal-button base-modal-button-secondary"
        >
          닫기
        </button>
      </div>
    </BaseModal>
  );
}

export default React.memo(OptionModal);
