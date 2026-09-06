import React, { useEffect, useState } from 'react';
import { loadImageAsDataURL } from '../utils/images';

const badgeSources = {
  1: '/image/asset/tier_1.svg', 2: '/image/asset/tier_2.svg',
  3: '/image/asset/tier_3.svg', 4: '/image/asset/tier_4.svg',
  5: '/image/asset/tier_5.svg', honey: '/image/asset/bee_honey.png',
  op: '/image/asset/is_op.svg',
};

function ImageLoader({ champions, displayedChampions, setChampionImages,
  setTierImages, setImagesReadyForCapture, version }) {
  const [badgesReady, setBadgesReady] = useState(false);
  useEffect(() => {
    // 밴 목록은 원본 URL을 사용하고 현재 추첨된 이미지만 우선 변환합니다.
    setChampionImages(Object.fromEntries(champions.map(champion => [champion.id, {
      url: `/image/champion/${champion.id}.png?v=${version}`, loaded: false,
    }])));
  }, [champions, version, setChampionImages]);

  useEffect(() => {
    let active = true;
    Promise.all(Object.entries(badgeSources).map(async ([key, source]) =>
      [key, await loadImageAsDataURL(source)]
    )).then(entries => {
      if (active) { setTierImages(Object.fromEntries(entries)); setBadgesReady(true); }
    }).catch(error => { if (active) console.error('마크 이미지 로딩 실패:', error); });
    return () => { active = false; };
  }, [setTierImages]);

  useEffect(() => {
    let active = true;
    setImagesReadyForCapture(false);
    if (!displayedChampions.length) return;
    Promise.all(displayedChampions.map(async champion => {
      const dataUrl = await loadImageAsDataURL(`/image/champion/${champion.id}.png?v=${version}`);
      return [champion.id, { url: dataUrl, dataUrl, loaded: true }];
    })).then(entries => {
      if (active) {
        setChampionImages(Object.fromEntries(entries));
        setImagesReadyForCapture(badgesReady);
      }
    }).catch(error => { if (active) console.error('챔피언 이미지 로딩 실패:', error); });
    return () => { active = false; };
  }, [displayedChampions, version, badgesReady, setChampionImages, setImagesReadyForCapture]);
  return null;
}
export default React.memo(ImageLoader);
