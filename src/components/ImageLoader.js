import React, { useEffect, useRef, useCallback } from 'react';
import {
  startPerformanceMeasure,
  endPerformanceMeasure,
  trackLazyLoadingProgress,
  logMemoryUsage,
} from '../utils/performance';

function ImageLoader({
  champions,
  setChampionImages,
  setTierImages,
  randomChampions,
}) {
  const loadedImagesRef = useRef(new Set());

  // 이미지 로드 함수 - 캐싱 및 성능 최적화
  const loadImage = useCallback(async (url, signal) => {
    try {
      const response = await fetch(url, {
        signal,
        cache: 'force-cache', // 브라우저 캐시 적극 활용
        headers: {
          'Cache-Control': 'max-age=86400', // 24시간 캐싱
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn(`Image load failed for ${url}:`, error.message);
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadImages = async () => {
      // 성능 측정 시작
      startPerformanceMeasure('image-loading-total');
      logMemoryUsage('before image loading');

      // 이미 로드된 이미지 체크
      const allChampionIds = new Set(champions.map(champ => champ.id));
      const needsLoading = [...allChampionIds].some(
        id => !loadedImagesRef.current.has(id),
      );

      if (!needsLoading) {
        console.log('✅ All images already loaded - skipping');
        return;
      }

      const images = {};
      const tiers = {};

      try {
        // 현재 표시되는 챔피언 ID 목록
        const displayedChampionIds = new Set([
          ...(randomChampions?.table1?.map(champ => champ.id) || []),
          ...(randomChampions?.table2?.map(champ => champ.id) || []),
        ]);

        // 챔피언 필터링
        const [displayedChampions, remainingChampions] = champions.reduce(
          (acc, champ) => {
            if (!loadedImagesRef.current.has(champ.id)) {
              acc[displayedChampionIds.has(champ.id) ? 0 : 1].push(champ);
            }
            return acc;
          },
          [[], []],
        );

        // 티어 이미지 로드
        const tierPromises = Array.from({ length: 5 }, async (_, i) => {
          const tier = i + 1;
          try {
            const result = await loadImage(
              `/image/asset/tier_${tier}.svg`,
              abortController.signal,
            );
            if (isMounted) tiers[tier] = result;
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error(`Failed to load tier image ${tier}:`, error);
            }
          }
        });

        // 꿀챔과 OP 이미지 로드
        const specialImagePromises = [
          (async () => {
            try {
              const result = await loadImage(
                `/image/asset/bee_honey.png`,
                abortController.signal,
              );
              if (isMounted) tiers['honey'] = result;
            } catch (error) {
              if (error.name !== 'AbortError') {
                console.error('Failed to load honey image:', error);
              }
            }
          })(),
          (async () => {
            try {
              const result = await loadImage(
                `/image/asset/is_op.svg`,
                abortController.signal,
              );
              if (isMounted) tiers['op'] = result;
            } catch (error) {
              if (error.name !== 'AbortError') {
                console.error('Failed to load OP image:', error);
              }
            }
          })(),
        ];

        // 챔피언 이미지 로드 함수 - 배치 크기 제한으로 성능 최적화
        const loadChampionBatch = async (champions, batchSize = 8) => {
          const results = [];

          for (let i = 0; i < champions.length; i += batchSize) {
            const batch = champions.slice(i, i + batchSize);
            const batchPromises = batch.map(async champion => {
              if (!champion?.id || !isMounted) return;

              try {
                const result = await loadImage(
                  `/image/champion/${champion.id}.png`,
                  abortController.signal,
                );
                if (isMounted) {
                  images[champion.id] = result;
                  loadedImagesRef.current.add(champion.id);
                }
              } catch (error) {
                if (error.name !== 'AbortError') {
                  console.error(
                    `Failed to load image for champion ${champion.id}:`,
                    error,
                  );
                }
              }
            });

            await Promise.all(batchPromises);
            results.push(...batch);

            // 각 배치 완료 후 상태 업데이트 (더 빠른 사용자 피드백)
            if (isMounted && i === 0 && Object.keys(images).length > 0) {
              console.log(
                `🚀 First batch loaded: ${Object.keys(images).length} images`,
              );
              setChampionImages(images); // 처리됨을 보장하기 위해 직접 전달
            }
          }

          return results.length;
        };

        // 우선순위 이미지 로드 (티어 + 꿀챔/OP + 표시 중인 챔피언)
        startPerformanceMeasure('priority-images');
        await Promise.all([
          ...tierPromises,
          ...specialImagePromises,
          loadChampionBatch(displayedChampions),
        ]);
        endPerformanceMeasure('priority-images');

        // 첫 번째 배치 상태 업데이트
        if (isMounted) {
          if (Object.keys(images).length > 0) {
            console.log(
              `🎆 Priority batch completed: ${
                Object.keys(images).length
              } champion images`,
            );
            setChampionImages(images);
          }
          if (Object.keys(tiers).length > 0) {
            console.log(
              `🏆 Tier images loaded: ${Object.keys(tiers).length} images`,
            );
            setTierImages(tiers);
          }

          const loadedCount = Object.keys(images).length;
          if (loadedCount > 0) {
            trackLazyLoadingProgress(
              loadedCount,
              champions.length,
              'Priority Images',
            );
          }
        }

        // 나머지 챔피언 이미지 로드
        startPerformanceMeasure('remaining-images');
        await loadChampionBatch(remainingChampions);
        endPerformanceMeasure('remaining-images');

        // 최종 상태 업데이트
        if (isMounted && Object.keys(images).length > 0) {
          const totalLoaded = Object.keys(images).length;
          console.log(`🏁 Final update: ${totalLoaded} total images loaded`);
          setChampionImages(images);

          trackLazyLoadingProgress(totalLoaded, champions.length, 'All Images');
        }

        // 전체 로딩 완료
        endPerformanceMeasure('image-loading-total');
        logMemoryUsage('after image loading');
        console.log('✅ Image loading completed successfully');
      } catch (error) {
        console.error('❌ Error in loadImages:', error);
        endPerformanceMeasure('image-loading-total');
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

  // 메모리 정리 - 사용하지 않는 이미지 제거 (선택적)
  useEffect(() => {
    const currentChampionIds = new Set(champions.map(champ => champ.id));
    const loadedIds = Array.from(loadedImagesRef.current);

    // 현재 챔피언 목록에 없는 로드된 이미지 ID 찾기
    const unusedIds = loadedIds.filter(id => !currentChampionIds.has(id));

    if (unusedIds.length > 50) {
      // 임계값 초과 시에만 정리
      unusedIds.forEach(id => loadedImagesRef.current.delete(id));
      console.log(
        `Memory cleanup: removed ${unusedIds.length} unused image references`,
      );
    }
  }, [champions]);

  return null;
}

export default React.memo(ImageLoader);
