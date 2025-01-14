import React, { useEffect, useRef, useCallback } from "react";

function ImageLoader({ champions, setChampionImages, setTierImages, randomChampions }) {
  const loadedImagesRef = useRef(new Set());

  // 이미지 로드 함수를 useCallback으로 분리하여 재사용성 향상
  const loadImage = useCallback(async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadImages = async () => {
      // 이미 로드된 이미지 체크
      const allChampionIds = new Set(champions.map(champ => champ.id));
      const needsLoading = [...allChampionIds].some(id => !loadedImagesRef.current.has(id));
      
      if (!needsLoading) return;

      const images = {};
      const tiers = {};

      try {
        // 현재 표시되는 챔피언 ID 목록
        const displayedChampionIds = new Set([
          ...(randomChampions?.table1?.map(champ => champ.id) || []),
          ...(randomChampions?.table2?.map(champ => champ.id) || [])
        ]);

        // 챔피언 필터링
        const [displayedChampions, remainingChampions] = champions.reduce((acc, champ) => {
          if (!loadedImagesRef.current.has(champ.id)) {
            acc[displayedChampionIds.has(champ.id) ? 0 : 1].push(champ);
          }
          return acc;
        }, [[], []]);

        // 티어 이미지 로드
        const tierPromises = Array.from({ length: 5 }, async (_, i) => {
          const tier = i + 1;
          try {
            const result = await loadImage(
              `/image/asset/tier_${tier}.svg`,
              abortController.signal
            );
            if (isMounted) tiers[tier] = result;
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error(`Failed to load tier image ${tier}:`, error);
            }
          }
        });

        // 챔피언 이미지 로드 함수
        const loadChampionBatch = async (champions) => {
          const promises = champions.map(async (champion) => {
            if (!champion?.id || !isMounted) return;
            
            try {
              const result = await loadImage(
                `/image/champion/${champion.id}.png`,
                abortController.signal
              );
              if (isMounted) {
                images[champion.id] = result;
                loadedImagesRef.current.add(champion.id);
              }
            } catch (error) {
              if (error.name !== 'AbortError') {
                console.error(`Failed to load image for champion ${champion.id}:`, error);
              }
            }
          });

          await Promise.all(promises);
          return Object.keys(images).length;
        };

        // 우선순위 이미지 로드 (티어 + 표시 중인 챔피언)
        await Promise.all([
          ...tierPromises,
          loadChampionBatch(displayedChampions)
        ]);

        // 첫 번째 배치 상태 업데이트
        if (isMounted && Object.keys(images).length > 0) {
          setChampionImages(prev => ({...prev, ...images}));
          setTierImages(tiers);
        }

        // 나머지 챔피언 이미지 로드
        await loadChampionBatch(remainingChampions);

        // 최종 상태 업데이트
        if (isMounted && Object.keys(images).length > displayedChampions.length) {
          setChampionImages(prev => ({...prev, ...images}));
        }
      } catch (error) {
        console.error("Error in loadImages:", error);
      }
    };

    if (champions?.length > 0) {
      loadImages();
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [champions, setChampionImages, setTierImages, randomChampions, loadImage]);

  return null;
}

export default React.memo(ImageLoader);
