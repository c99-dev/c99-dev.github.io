import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { shuffleArray } from '../utils/utils';
import ReactGA from 'react-ga4';

function useRandomChampions(
  gameData,
  bannedChampions,
  displayCount,
  alerts = {},
  championImages = {},
) {
  const [randomChampions, setRandomChampions] = useState({
    table1: [],
    table2: [],
  });
  const resetCountRef = useRef(0);
  const requestedCountRef = useRef(null);
  const rerollPending = useRef(false);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  const currentChampions = useRef(randomChampions);
  currentChampions.current = randomChampions;

  const availableChampions = useMemo(() => {
    if (!gameData.championData) return [];
    return Object.values(gameData.championData.data).filter(
      champion => !bannedChampions.includes(champion.id),
    );
  }, [gameData.championData, bannedChampions]);

  const currentAvailable = useRef(availableChampions);
  currentAvailable.current = availableChampions;

  const resetRandomChampions = useCallback(() => {
    if (!Number.isInteger(displayCount) || displayCount < 1 || availableChampions.length < displayCount * 2) {
      alertsRef.current.showError?.(`팀당 ${displayCount}명을 뽑으려면 ${displayCount * 2}명이 필요합니다. 현재 후보는 ${availableChampions.length}명입니다. 밴을 해제하거나 옵션에서 인원을 줄여주세요.`);
      return false;
    }
    const shuffled = shuffleArray(availableChampions);
    setRandomChampions({
      table1: shuffled.slice(0, displayCount),
      table2: shuffled.slice(displayCount, displayCount * 2),
    });
    resetCountRef.current += 1;

    ReactGA.event({
      category: 'Button',
      action: 'Click',
      label: 'Reset Champions',
    });
    return true;
  }, [availableChampions, displayCount]);

  // 처음 로드하거나 인원을 바꿀 때만 추첨합니다. 부족했던 후보가 복구되면 시작합니다.
  useEffect(() => {
    if (!gameData.championData) return;
    if (requestedCountRef.current !== displayCount ||
        (randomChampions.table1.length === 0 && availableChampions.length >= displayCount * 2)) {
      requestedCountRef.current = displayCount;
      resetRandomChampions();
    }
  }, [gameData.championData, displayCount, availableChampions.length,
      randomChampions.table1.length, resetRandomChampions]);

  const handleReRollChampion = useCallback(
    (table, index) => {
      const selected = currentChampions.current[table]?.[index];
      if (!selected || rerollPending.current) return Promise.resolve(false);
      const selectedChampion = selected.name;
      rerollPending.current = true;

      const confirmReRoll = async () => {
        // 1단계: 현재 챔피언 이미지와 함께 확인 요청
        if (alerts.showConfirmWithContent) {
          const currentChampion = randomChampions[table][index];

          const confirmContent = React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                margin: '20px 0',
              },
            },
            [
              championImages[currentChampion.id]?.url
                ? React.createElement('img', {
                    key: 'current-img',
                    src: championImages[currentChampion.id].url,
                    alt: currentChampion.name,
                    style: {
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                    },
                  })
                : React.createElement(
                    'div',
                    {
                      key: 'current-placeholder',
                      style: {
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#333',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '24px',
                      },
                    },
                    '?',
                  ),
              React.createElement(
                'div',
                {
                  key: 'current-name',
                  style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  },
                },
                currentChampion.name,
              ),
            ],
          );

          const confirmed = await alerts.showConfirmWithContent(
            `"${selectedChampion}"을(를) 다시 랜덤하게 돌리시겠습니까?`,
            '챔피언 리롤',
            confirmContent,
          );

          if (!confirmed) return;
        }

        // 2단계: 리롤 실행
        if (currentChampions.current[table]?.[index]?.id !== selected.id) return false;
        const currentTableChampions = new Set([
          ...currentChampions.current.table1.map(champ => champ.id),
          ...currentChampions.current.table2.map(champ => champ.id),
        ]);

        const availableChampionsForReroll = currentAvailable.current.filter(
          champion => !currentTableChampions.has(champion.id),
        );

        if (availableChampionsForReroll.length === 0) {
          if (alerts.showError) {
            alerts.showError('사용 가능한 챔피언이 없습니다.');
          }
          return;
        }

        const newChampion =
          availableChampionsForReroll[
            Math.floor(Math.random() * availableChampionsForReroll.length)
          ];

        const oldChampion = selected;

        // 3단계: 상태 업데이트
        setRandomChampions(prevChampions => ({
          ...prevChampions,
          [table]: prevChampions[table].map((champ, idx) =>
            idx === index ? newChampion : champ,
          ),
        }));

        // 4단계: 결과 표시 (이전 챔피언 → 새 챔피언)
        if (alerts.showInfoWithContent) {
          const resultContent = React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                margin: '20px 0',
              },
            },
            [
              React.createElement(
                'div',
                {
                  key: 'old',
                  style: { textAlign: 'center' },
                },
                [
                  React.createElement(
                    'div',
                    {
                      key: 'old-label',
                      style: {
                        fontSize: '14px',
                        marginBottom: '8px',
                        color: '#666',
                      },
                    },
                    '이전 챔피언',
                  ),
                  championImages[oldChampion.id]?.url
                    ? React.createElement('img', {
                        key: 'old-img',
                        src: championImages[oldChampion.id].url,
                        alt: oldChampion.name,
                        style: {
                          width: '64px',
                          height: '64px',
                          borderRadius: '8px',
                          opacity: '0.7',
                        },
                      })
                    : React.createElement(
                        'div',
                        {
                          key: 'old-placeholder',
                          style: {
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#333',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            opacity: '0.7',
                          },
                        },
                        '?',
                      ),
                  React.createElement(
                    'div',
                    {
                      key: 'old-name',
                      style: {
                        fontSize: '12px',
                        marginTop: '4px',
                        fontWeight: 'bold',
                        opacity: '0.7',
                      },
                    },
                    oldChampion.name,
                  ),
                ],
              ),
              React.createElement(
                'div',
                {
                  key: 'arrow',
                  style: { fontSize: '24px', color: '#10b981' },
                },
                '→',
              ),
              React.createElement(
                'div',
                {
                  key: 'new',
                  style: { textAlign: 'center' },
                },
                [
                  React.createElement(
                    'div',
                    {
                      key: 'new-label',
                      style: {
                        fontSize: '14px',
                        marginBottom: '8px',
                        color: '#10b981',
                      },
                    },
                    '새로운 챔피언',
                  ),
                  championImages[newChampion.id]?.url
                    ? React.createElement('img', {
                        key: 'new-img',
                        src: championImages[newChampion.id].url,
                        alt: newChampion.name,
                        style: {
                          width: '64px',
                          height: '64px',
                          borderRadius: '8px',
                        },
                      })
                    : React.createElement(
                        'div',
                        {
                          key: 'new-placeholder',
                          style: {
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#333',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          },
                        },
                        '?',
                      ),
                  React.createElement(
                    'div',
                    {
                      key: 'new-name',
                      style: {
                        fontSize: '12px',
                        marginTop: '4px',
                        fontWeight: 'bold',
                        color: '#10b981',
                      },
                    },
                    newChampion.name,
                  ),
                ],
              ),
            ],
          );

          alerts.showInfoWithContent(
              `리롤 완료! "${oldChampion.name}"이(가) "${newChampion.name}"으로 변경되었습니다.`,
              '리롤 결과',
              resultContent,
          );
        }
        return true;
      };

      return confirmReRoll().finally(() => { rerollPending.current = false; });
    },
    [randomChampions, availableChampions, alerts, championImages],
  );

  return {
    randomChampions,
    resetCount: resetCountRef.current,
    resetRandomChampions,
    handleReRollChampion,
  };
}

export default useRandomChampions;
