import { useState, useEffect } from 'react';

export function useChampionData() {
  const [gameData, setGameData] = useState({
    championData: null,
    version: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const responses = await Promise.all([
          fetch('/json/version.json', {
            signal: controller.signal,
            cache: 'no-cache',
          }),
          fetch('/json/championData.json', {
            signal: controller.signal,
            cache: 'no-cache',
          }),
        ]);
        if (responses.some(response => !response.ok))
          throw new Error('챔피언 데이터를 불러오지 못했습니다.');
        const [metadata, championData] = await Promise.all(
          responses.map(response => response.json()),
        );
        if (
          !championData.data ||
          !Object.keys(championData.data).length ||
          championData.version !== metadata.version
        ) {
          throw new Error(
            '데이터 업데이트 중입니다. 잠시 후 다시 시도해주세요.',
          );
        }
        setGameData({ championData, ...metadata });
      } catch (error) {
        if (error.name !== 'AbortError') setError(error);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, []);
  return { gameData, isLoading, error };
}
