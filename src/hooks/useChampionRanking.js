import { useState, useEffect } from 'react';

const useChampionRanking = () => {
  const [championRanking, setChampionRanking] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchChampionRanking = async () => {
      try {
        const response = await fetch('/json/championRanking.json', {
          signal: controller.signal,
          cache: 'no-cache',
        });
        if (!response.ok) {
          throw new Error('챔피언 통계를 불러오지 못했습니다.');
        }

        const data = await response.json();
        setChampionRanking(data);
        setIsLoading(false);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('챔피언 랭킹을 가져오는 중 오류 발생:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchChampionRanking();
    return () => controller.abort();
  }, []);

  return { championRanking, isLoading, error };
};

export default useChampionRanking;
