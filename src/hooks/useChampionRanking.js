import { useState, useEffect } from "react";

const useChampionRanking = () => {
  const [championRanking, setChampionRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChampionRanking = async () => {
      try {
        const response = await fetch("/json/championRanking.json");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setChampionRanking(data);
        setIsLoading(false);
      } catch (error) {
        console.error("챔피언 랭킹을 가져오는 중 오류 발생:", error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchChampionRanking();
  }, []);

  return { championRanking, isLoading, error };
};

export default useChampionRanking;
