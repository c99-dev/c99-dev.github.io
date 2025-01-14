import { useState, useEffect } from "react";

export function useChampionData() {
  const [gameData, setGameData] = useState({
    championData: null,
    version: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response1 = await fetch("/json/version.json");
        const championVersion = await response1.json();
        const version = championVersion["version"];
        const response2 = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`
        );
        const data2 = await response2.json();

        setGameData({
          championData: data2,
          version: version,
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching the data", error);
        setError(error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { gameData, isLoading, error };
}
