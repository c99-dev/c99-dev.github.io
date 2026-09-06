import { useState, useEffect } from "react";

const useChampionRanking = () => {
  const [championRanking, setChampionRanking] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
    const fetchChampionRanking = async () => {
      try {
        const response = await fetch("/json/championRanking.json", {
          signal: controller.signal, cache: 'no-cache',
        });
        if (!response.ok) {
          throw new Error('랭킹 데이터를 불러오지 못했습니다.');
        }

        const data = await response.json();
        if (!data || Array.isArray(data) || typeof data !== 'object') {
          throw new Error('랭킹 데이터 형식이 올바르지 않습니다.');
        }
        if (active) setChampionRanking(data);
      } catch (error) {
        if (active) setError(error);
      } finally {
        clearTimeout(timer);
        if (active) setIsLoading(false);
      }
    };

    fetchChampionRanking();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);

  return { championRanking, isLoading, error };
};

export default useChampionRanking;
