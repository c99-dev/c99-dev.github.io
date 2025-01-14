import React, { useMemo } from "react";

function ChampionTable({
  champions,
  teamName,
  reRoll,
  table,
  tableOptions,
  sortOption,
  championImages,
  championRanking, // 랭킹 데이터 props 추가
  tierImages, // 티어 이미지 props 추가
}) {
  const sortedChampions = useMemo(() => {
    const championsCopy = [...champions];

    const getSortedChampions = () => {
      switch (sortOption) {
        case "alphabetical":
          return championsCopy.sort((a, b) => a.name.localeCompare(b.name));
        case "random":
          return champions;
        case "tier":
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

  if (!champions || champions.length === 0) {
    return null;
  }

  return (
    <table
      className={`${!tableOptions.rank ? "hide-rank" : ""} ${
        !tableOptions.winrate ? "hide-winrate" : ""
      } ${!tableOptions.tier ? "hide-tier" : ""}`}
    >
      <thead>
        <tr>
          <th
            className={`${teamName === "블루 팀" ? "blue-team" : "red-team"}`}
            colSpan="4"
          >
            {teamName}
          </th>
        </tr>
        <tr>
          <th className="champion">챔피언</th>
        </tr>
      </thead>
      <tbody>
        {sortedChampions.map((champion) => {
          if (!champion || !champion.id) return null;
          const originalIndex = champions.findIndex(
            (ch) => ch && ch.id === champion.id
          );

          // 랭킹 데이터에서 해당 챔피언 찾기
          const rankData = championRanking[champion.name];

          return (
            <tr key={champion.id} onClick={() => reRoll(table, originalIndex)}>
              <td className="champion">
                <div className="champion-name">
                  <div className="champion-image-wrapper">
                    {championImages[champion.id] ? (
                      <>
                        <img
                          src={championImages[champion.id]}
                          alt={champion.name}
                          className="champion-portrait"
                        />
                        {rankData && tierImages[rankData.opTier] && (
                          <img
                            src={tierImages[rankData.opTier]}
                            alt={`Tier ${rankData.opTier}`}
                            className="tier-badge"
                          />
                        )}
                      </>
                    ) : (
                      <div className="loading-indicator">로딩 중...</div>
                    )}
                  </div>
                  {champion.name}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default ChampionTable;
