import React, { useEffect, useRef, useState } from 'react';

function ImageLoader({
  champions,
  championImages, // 현재 championImages 상태 읽기용
  setChampionImages,
  setTierImages,
  setImagesReadyForCapture,
  displayedChampions, // 현재 화면에 보이는 챔피언들만
}) {
  const tierImagesCachedRef = useRef(false);
  const convertedChampionsRef = useRef(new Set());
  const [localChampionImages, setLocalChampionImages] = useState({});

  const loadImageAsDataURL = src => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        // Base64 변환만 로그 제거
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = () => {
        console.warn(`❌ [IMAGE_LOADER] Base64 변환 실패: ${src}`);
        resolve(src); // 실패 시 원본 URL 반환
      };
      img.src = src;
    });
  };

  // 전체 챔피언 이미지 URL 설정 (한 번만)
  useEffect(() => {
    if (!champions || champions.length === 0) return;

    // 전체 챔피언 이미지 URL 설정 (화면 표시용)
    const quickImages = {};
    champions.forEach(champion => {
      if (champion?.id) {
        quickImages[champion.id] = {
          url: `/image/champion/${champion.id}.png`,
          dataUrl: null,
        };
      }
    });

    // 티어 이미지 URL 설정
    const quickTiers = {};
    for (let i = 1; i <= 5; i++) {
      quickTiers[i] = `/image/asset/tier_${i}.svg`;
    }
    quickTiers['honey'] = '/image/asset/bee_honey.png';
    quickTiers['op'] = '/image/asset/is_op.svg';

    // 빠른 화면 표시를 위해 상태 업데이트

    setChampionImages(quickImages);
    setTierImages(quickTiers);
    setLocalChampionImages(quickImages);

    // 백그라운드에서 모든 챔피언 이미지 base64로 변환 (캐시용)
    const convertAllImages = async () => {
      const allDataUrlImages = {};
      const allPromises = champions.map(async champion => {
        if (champion?.id) {
          const dataURL = await loadImageAsDataURL(
            `/image/champion/${champion.id}.png`,
          );
          allDataUrlImages[champion.id] = dataURL;
          convertedChampionsRef.current.add(champion.id);
        }
      });

      await Promise.all(allPromises);

      // localChampionImages에 base64 데이터 추가
      setLocalChampionImages(prev => {
        const updated = { ...prev };
        Object.entries(allDataUrlImages).forEach(([id, dataUrl]) => {
          if (updated[id]) {
            updated[id] = { ...updated[id], dataUrl };
          }
        });
        return updated;
      });

      // 티어 이미지도 변환 (한 번만)
      if (!tierImagesCachedRef.current) {
        const dataUrlTiers = {};
        const tierPromises = Array.from({ length: 5 }, async (_, i) => {
          const tier = i + 1;

          const dataURL = await loadImageAsDataURL(
            `/image/asset/tier_${tier}.svg`,
          );
          dataUrlTiers[tier] = dataURL;
        });

        const specialPromises = [
          loadImageAsDataURL('/image/asset/bee_honey.png').then(dataURL => {
            dataUrlTiers['honey'] = dataURL;
          }),
          loadImageAsDataURL('/image/asset/is_op.svg').then(dataURL => {
            dataUrlTiers['op'] = dataURL;
          }),
        ];

        await Promise.all([...tierPromises, ...specialPromises]);

        setTierImages(dataUrlTiers);
        tierImagesCachedRef.current = true;
      }

      // 백그라운드 변환 완료
    };

    convertAllImages();
  }, [champions, setChampionImages, setTierImages]);

  // 현재 화면에 보이는 챔피언들만 base64로 교체
  useEffect(() => {
    if (!displayedChampions || displayedChampions.length === 0) {
      setImagesReadyForCapture(false);
      return;
    }

    const updateDisplayedImages = async () => {
      // localChampionImages에서 표시된 챔피언들의 base64 데이터 확인
      const displayedUpdates = {};
      let foundBase64Count = 0;

      for (const champion of displayedChampions) {
        if (champion?.id) {
          const localData = localChampionImages[champion.id];
          if (localData?.dataUrl) {
            // localChampionImages에 base64 데이터가 있으면 부모 상태에 동기화
            displayedUpdates[champion.id] = {
              url: localData.dataUrl,
              dataUrl: localData.dataUrl,
            };
            foundBase64Count++;
          }
        }
      }

      // 부모 championImages 상태 동기화
      if (Object.keys(displayedUpdates).length > 0) {
        if (typeof setChampionImages !== 'function') {
          console.error(
            `❌ [IMAGE_LOADER] setChampionImages가 함수가 아닙니다!`,
            setChampionImages,
          );
          return;
        }

        // base64 데이터가 준비되지 않은 상태에서만 false로 설정
        if (foundBase64Count < displayedChampions.length) {
          setImagesReadyForCapture(false);
        }

        setChampionImages(displayedUpdates);

        // 모든 이미지가 준비되었으면 즉시 활성화, 아니면 100ms 대기
        if (foundBase64Count === displayedChampions.length) {
          setImagesReadyForCapture(true);
        } else {
          setTimeout(() => {
            setImagesReadyForCapture(true);
          }, 100);
        }
      } else {
        // base64 데이터가 아직 없는 경우에만 false로 설정
        setImagesReadyForCapture(false);
      }
    };

    const timer = setTimeout(updateDisplayedImages, 50);
    return () => clearTimeout(timer);
  }, [
    displayedChampions,
    localChampionImages,
    setChampionImages,
    setImagesReadyForCapture,
  ]);

  return null;
}

export default React.memo(ImageLoader);
