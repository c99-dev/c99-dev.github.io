import React, { useMemo, useState, useCallback } from 'react';
import SkeletonLoader from './SkeletonLoader';
import './../styles/ChampionTable.css';

function ChampionTable({
  champions,
  teamName,
  reRoll,
  table,
  tableOptions,
  sortOption,
  tierDisplay, // 티어표시 옵션 추가
  championImages,
  championRanking, // 랭킹 데이터 props 추가
  tierImages, // 티어 이미지 props 추가
  isTeamRerolling, // 팀 전체 리롤 상태 추가
  areDisplayedImagesLoaded, // 화면에 보이는 이미지 로딩 완료 여부
}) {
  const [rerollingIndex, setRerollingIndex] = useState(null);

  const sortedChampions = useMemo(() => {
    const championsCopy = [...champions];

    const getSortedChampions = () => {
      switch (sortOption) {
        case 'alphabetical':
          return championsCopy.sort((a, b) => a.name.localeCompare(b.name));
        case 'random':
          return champions;
        case 'tier':
        default: // tier를 기본 정렬로 설정
          return championsCopy.sort((a, b) => {
            const rankA = championRanking[a.name]?.ranking || 999;
            const rankB = championRanking[b.name]?.ranking || 999;
            return rankA - rankB;
          });
      }
    };

    return getSortedChampions();
  }, [champions, sortOption, championRanking]);

  const handleReRoll = useCallback(
    async (table, index) => {
      // 이미지 로딩이 완료되지 않았으면 리롤 방지
      if (!areDisplayedImagesLoaded) return;

      const originalIndex = champions.findIndex(
        ch => ch && ch.id === sortedChampions[index].id,
      );

      setRerollingIndex(index);

      // 애니메이션을 위한 지연
      setTimeout(() => {
        reRoll(table, originalIndex);
        setTimeout(() => {
          setRerollingIndex(null);
        }, 80); // 페이드 인 완료 후 상태 리셋
      }, 50); // 페이드 아웃 시간
    },
    [champions, sortedChampions, reRoll, areDisplayedImagesLoaded],
  );

  // 디버깅: championImages 상태 확인
  React.useEffect(() => {
    const championIds = champions.map(c => c?.id).filter(Boolean);
    const loadedImageIds = Object.keys(championImages);
    const missingImages = championIds.filter(id => !championImages[id]);

    if (missingImages.length > 0) {
      console.log(
        `🔍 ${teamName} - Missing images for: ${missingImages.join(', ')}`,
      );
    } else if (championIds.length > 0) {
      console.log(`✅ ${teamName} - All ${championIds.length} images loaded`);
    }
  }, [championImages, champions, teamName]);

  if (!champions || champions.length === 0) {
    return null;
  }

  return (
    <table
      className={`${!tableOptions.rank ? 'hide-rank' : ''} ${
        !tableOptions.winrate ? 'hide-winrate' : ''
      } ${!tableOptions.tier ? 'hide-tier' : ''} ${
        isTeamRerolling ? 'team-rerolling' : ''
      }`}
    >
      <thead>
        <tr>
          <th
            className={`${teamName === '블루 팀' ? 'blue-team' : 'red-team'}`}
            colSpan="4"
          >
            {teamName}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedChampions.map((champion, index) => {
          if (!champion || !champion.id) return null;
          const originalIndex = champions.findIndex(
            ch => ch && ch.id === champion.id,
          );

          // 랭킹 데이터에서 해당 챔피언 찾기
          const rankData = championRanking[champion.name];

          return (
            <tr
              key={champion.id}
              onClick={() => handleReRoll(table, index)}
              className={`${rerollingIndex === index ? 'rerolling' : ''} ${
                !areDisplayedImagesLoaded ? 'loading-disabled' : ''
              }`}
              style={{
                cursor: !areDisplayedImagesLoaded ? 'not-allowed' : 'pointer',
                opacity: !areDisplayedImagesLoaded ? 0.6 : 1,
              }}
              title={
                !areDisplayedImagesLoaded ? '챔피언 이미지 로딩 중...' : ''
              }
            >
              <td className="champion">
                <div className="champion-name">
                  {championImages[champion.id] ? (
                    <>
                      <div className="champion-image-wrapper">
                        <img
                          src={championImages[champion.id]}
                          alt={champion.name}
                          className="champion-portrait"
                        />
                        {tierDisplay &&
                          rankData &&
                          tierImages[rankData.opTier] && (
                            <img
                              src={tierImages[rankData.opTier]}
                              alt={`Tier ${rankData.opTier}`}
                              className="tier-badge"
                            />
                          )}
                        {tierDisplay &&
                          rankData &&
                          rankData.isHoney &&
                          tierImages['honey'] && (
                            <img
                              src={tierImages['honey']}
                              alt="꿀챔"
                              className="honey-badge"
                            />
                          )}
                        {tierDisplay &&
                          rankData &&
                          rankData.isOp &&
                          tierImages['op'] && (
                            <img
                              src={tierImages['op']}
                              alt="OP"
                              className="op-badge"
                            />
                          )}
                      </div>
                      <span>{champion.name}</span>
                    </>
                  ) : (
                    <SkeletonLoader type="champion" />
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default React.memo(ChampionTable);
