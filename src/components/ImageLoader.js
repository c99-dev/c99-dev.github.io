import React, { useEffect } from 'react';

function ImageLoader({
  champions,
  setChampionImages,
  setTierImages,
  setImagesReadyForCapture,
}) {
  useEffect(() => {
    if (!champions || champions.length === 0) return;

    const loadImageAsDataURL = src => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${src}`);
          resolve(src); // 실패 시 원본 URL 반환
        };
        img.src = src;
      });
    };

    const loadImages = async () => {
      // 1단계: 빠른 화면 표시를 위해 원본 URL로 먼저 설정
      const quickImages = {};
      const quickTiers = {};

      // 챔피언 이미지 URL 설정
      champions.forEach(champion => {
        if (champion?.id) {
          quickImages[champion.id] = `/image/champion/${champion.id}.png`;
        }
      });

      // 티어 이미지 URL 설정
      for (let i = 1; i <= 5; i++) {
        quickTiers[i] = `/image/asset/tier_${i}.svg`;
      }
      quickTiers['honey'] = '/image/asset/bee_honey.png';
      quickTiers['op'] = '/image/asset/is_op.svg';

      // 빠른 화면 표시를 위해 먼저 상태 업데이트
      setChampionImages(quickImages);
      setTierImages(quickTiers);
      setImagesReadyForCapture(false);

      console.log(
        `⚡ Quick loaded ${
          Object.keys(quickImages).length
        } champion images and ${
          Object.keys(quickTiers).length
        } tier images with URLs`,
      );

      // 2단계: 백그라운드에서 base64 변환 작업
      const dataUrlImages = {};
      const dataUrlTiers = {};

      // 챔피언 이미지를 data URL로 변환
      const championPromises = champions.map(async champion => {
        if (champion?.id) {
          const dataURL = await loadImageAsDataURL(
            `/image/champion/${champion.id}.png`,
          );
          dataUrlImages[champion.id] = dataURL;
        }
      });

      // 티어 이미지를 data URL로 변환
      const tierPromises = Array.from({ length: 5 }, async (_, i) => {
        const tier = i + 1;
        const dataURL = await loadImageAsDataURL(
          `/image/asset/tier_${tier}.svg`,
        );
        dataUrlTiers[tier] = dataURL;
      });

      // 꿀챔과 OP 이미지를 data URL로 변환
      const specialPromises = [
        loadImageAsDataURL('/image/asset/bee_honey.png').then(dataURL => {
          dataUrlTiers['honey'] = dataURL;
        }),
        loadImageAsDataURL('/image/asset/is_op.svg').then(dataURL => {
          dataUrlTiers['op'] = dataURL;
        }),
      ];

      // 모든 이미지 base64 변환 완료 대기
      await Promise.all([
        ...championPromises,
        ...tierPromises,
        ...specialPromises,
      ]);

      // base64 이미지로 상태 업데이트
      setChampionImages(dataUrlImages);
      setTierImages(dataUrlTiers);
      setImagesReadyForCapture(true);

      console.log(
        `✅ Converted ${
          Object.keys(dataUrlImages).length
        } champion images and ${
          Object.keys(dataUrlTiers).length
        } tier images to data URLs for capture`,
      );
    };

    loadImages();
  }, [champions, setChampionImages, setTierImages, setImagesReadyForCapture]);

  return null;
}

export default React.memo(ImageLoader);
