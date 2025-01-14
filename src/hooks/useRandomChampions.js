import { useState, useCallback, useMemo, useRef } from "react";
import { shuffleArray } from "../utils/utils";
import ReactGA from "react-ga4";

function useRandomChampions(gameData, bannedChampions, displayCount) {
  const [randomChampions, setRandomChampions] = useState({
    table1: [],
    table2: [],
  });
  const resetCountRef = useRef(0);

  const availableChampions = useMemo(() => {
    if (!gameData.championData) return [];
    return Object.values(gameData.championData.data).filter(
      (champion) => !bannedChampions.includes(champion.id)
    );
  }, [gameData.championData, bannedChampions]);

  const resetRandomChampions = useCallback(() => {
    const shuffled = shuffleArray(availableChampions);
    setRandomChampions({
      table1: shuffled.slice(0, displayCount),
      table2: shuffled.slice(displayCount, displayCount * 2),
    });
    resetCountRef.current += 1;

    ReactGA.event({
      category: "Button",
      action: "Click",
      label: "Reset Champions",
    });
  }, [availableChampions, displayCount]);

  const handleReRollChampion = useCallback(
    (table, index) => {
      const selectedChampion = randomChampions[table][index].name;

      if (
        window.confirm(
          `"${selectedChampion}"을(를) 다시 랜덤하게 돌리시겠습니까?`
        )
      ) {
        const currentTableChampions = new Set([
          ...randomChampions.table1.map((champ) => champ.id),
          ...randomChampions.table2.map((champ) => champ.id),
        ]);

        const availableChampionsForReroll = availableChampions.filter(
          (champion) => !currentTableChampions.has(champion.id)
        );

        if (availableChampionsForReroll.length === 0) {
          alert("사용 가능한 챔피언이 없습니다.");
          return;
        }

        const randomChampion =
          availableChampionsForReroll[
            Math.floor(Math.random() * availableChampionsForReroll.length)
          ];

        setRandomChampions((prevChampions) => ({
          ...prevChampions,
          [table]: prevChampions[table].map((champ, idx) =>
            idx === index ? randomChampion : champ
          ),
        }));

        alert(
          `"${selectedChampion}"을(를) 돌려서 "${randomChampion.name}"이(가) 나왔습니다.`
        );
      }
    },
    [randomChampions, availableChampions]
  );

  return {
    randomChampions,
    resetCount: resetCountRef.current,
    resetRandomChampions,
    handleReRollChampion,
  };
}

export default useRandomChampions;
