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
    console.log(`🚀 [IMAGE_LOADER] 1단계: URL로 빠른 이미지 설정 시작`);
    console.log(
      '🔍 [IMAGE_LOADER] quickImages 생성:',
      Object.keys(quickImages).length + '개',
    );
    console.log(
      '🔍 [IMAGE_LOADER] quickTiers 생성:',
      Object.keys(quickTiers).length + '개',
    );
    console.log(
      '🔍 [IMAGE_LOADER] 현재 받은 championImages props:',
      Object.keys(championImages || {}).length + '개',
    );

    setChampionImages(quickImages);
    setTierImages(quickTiers);
    setLocalChampionImages(quickImages);

    console.log('🔄 [IMAGE_LOADER] setChampionImages 호출 완료');

    // 1단계 완료    // 백그라운드에서 모든 챔피언 이미지 base64로 변환 (캐시용)
    const convertAllImages = async () => {
      // 2단계 시작

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

      // 2단계 완료

      // 티어 이미지도 변환 (한 번만)
      if (!tierImagesCachedRef.current) {
        console.log('🎯 [IMAGE_LOADER] 티어 이미지 base64 변환 시작');
        const dataUrlTiers = {};
        const tierPromises = Array.from({ length: 5 }, async (_, i) => {
          const tier = i + 1;
          console.log(`🔄 [IMAGE_LOADER] 티어 ${tier} 변환 중...`);
          const dataURL = await loadImageAsDataURL(
            `/image/asset/tier_${tier}.svg`,
          );
          dataUrlTiers[tier] = dataURL;
          console.log(
            `✅ [IMAGE_LOADER] 티어 ${tier} 변환 완료: ${dataURL?.substring(
              0,
              30,
            )}...`,
          );
        });

        const specialPromises = [
          loadImageAsDataURL('/image/asset/bee_honey.png').then(dataURL => {
            dataUrlTiers['honey'] = dataURL;
            console.log(
              `✅ [IMAGE_LOADER] 꿀챔 변환 완료: ${dataURL?.substring(
                0,
                30,
              )}...`,
            );
          }),
          loadImageAsDataURL('/image/asset/is_op.svg').then(dataURL => {
            dataUrlTiers['op'] = dataURL;
            console.log(
              `✅ [IMAGE_LOADER] OP 변환 완료: ${dataURL?.substring(0, 30)}...`,
            );
          }),
        ];

        console.log('⏳ [IMAGE_LOADER] 모든 티어 이미지 변환 대기 중...');
        await Promise.all([...tierPromises, ...specialPromises]);

        console.log(
          `🎉 [IMAGE_LOADER] 티어 이미지 변환 완료, setTierImages 호출: ${
            Object.keys(dataUrlTiers).length
          }개`,
        );

        // 🔍 실제 전달할 base64 데이터 확인
        const tierSamples = Object.entries(dataUrlTiers)
          .slice(0, 3)
          .map(([key, data]) => `${key}: ${data?.substring(0, 30)}...`);
        console.log(`🔍 [IMAGE_LOADER] 티어 base64 샘플:`, tierSamples);

        setTierImages(dataUrlTiers);
        tierImagesCachedRef.current = true;
      }

      // 백그라운드 변환 완료
    };

    convertAllImages();
  }, [champions, setChampionImages, setTierImages]);

  // 현재 화면에 보이는 챔피언들만 base64로 교체
  useEffect(() => {
    console.log(
      `🎯 [IMAGE_LOADER] 3단계 시작: 표시된 ${
        displayedChampions?.length || 0
      }개 챔피언 base64 교체`,
    );

    if (!displayedChampions || displayedChampions.length === 0) {
      setImagesReadyForCapture(false);
      return;
    }

    const updateDisplayedImages = async () => {
      setImagesReadyForCapture(false);

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

      console.log(
        `📊 [IMAGE_LOADER] 상태 동기화: 표시된 ${displayedChampions.length}개 중 ${foundBase64Count}개 base64 준비됨`,
      );

      // 부모 championImages 상태 동기화
      if (Object.keys(displayedUpdates).length > 0) {
        console.log(
          `🔄 [IMAGE_LOADER] 부모 상태에 ${
            Object.keys(displayedUpdates).length
          }개 base64 동기화 중...`,
        );

        // 🔍 전달할 base64 데이터 샘플 확인
        const updateSamples = Object.entries(displayedUpdates)
          .slice(0, 3)
          .map(([id, data]) => `${id}: ${data.url?.substring(0, 30)}...`);
        console.log(`🔍 [IMAGE_LOADER] 전달할 base64 샘플:`, updateSamples);

        // 🔍 setChampionImages 함수 확인
        console.log(
          `🔍 [IMAGE_LOADER] setChampionImages 타입:`,
          typeof setChampionImages,
        );
        console.log(
          `🔍 [IMAGE_LOADER] setChampionImages 존재:`,
          !!setChampionImages,
        );

        if (typeof setChampionImages !== 'function') {
          console.error(
            `❌ [IMAGE_LOADER] setChampionImages가 함수가 아닙니다!`,
            setChampionImages,
          );
          return;
        }

        console.log(`🚀 [IMAGE_LOADER] setChampionImages 호출 시작`);

        // 🔍 실제 전달할 displayedUpdates 내용 확인
        console.log(
          `🔍 [IMAGE_LOADER] displayedUpdates 키 개수:`,
          Object.keys(displayedUpdates).length,
        );
        const updateEntries = Object.entries(displayedUpdates).slice(0, 3);
        console.log(
          `🔍 [IMAGE_LOADER] displayedUpdates 샘플:`,
          updateEntries.map(([id, data]) => ({
            id,
            hasUrl: !!data?.url,
            hasDataUrl: !!data?.dataUrl,
            urlType: data?.url?.startsWith('data:') ? 'base64' : 'path',
            urlStart: data?.url?.substring(0, 30) + '...',
          })),
        );

        setChampionImages(displayedUpdates);

        setTimeout(() => {
          console.log(`🎉 [IMAGE_LOADER] DOM 업데이트 완료, 캡처 준비`);
          setImagesReadyForCapture(true);
        }, 100);
      } else {
        console.log(`⚠️ [IMAGE_LOADER] 동기화할 base64 데이터 없음`);
        setImagesReadyForCapture(true);
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
