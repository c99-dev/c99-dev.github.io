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
    let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
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
        if (active) setGameData({ ...metadata, championData });
      } catch (error) {
        if (active) setError(error.name === 'AbortError'
          ? new Error('데이터 요청 시간이 초과되었습니다. 새로고침 후 다시 시도해주세요.')
          : error);
      } finally {
        clearTimeout(timer);
        if (active) setIsLoading(false);
      }
    };
    fetchData();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);
  return { gameData, isLoading, error };
}
