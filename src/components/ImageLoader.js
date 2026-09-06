import React, { useEffect, useRef } from 'react';

function ImageLoader({
  champions,
  displayedChampions,
  setChampionImages,
  setTierImages,
  setImagesReadyForCapture,
}) {
  const cache = useRef(new Map());
  const load = src => {
    if (!cache.current.has(src)) {
      cache.current.set(
        src,
        new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              canvas.getContext('2d').drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            } catch {
              cache.current.delete(src);
              resolve(null);
            }
          };
          img.onerror = () => {
            cache.current.delete(src);
            resolve(null);
          };
          img.src = src;
        }),
      );
    }
    return cache.current.get(src);
  };

  useEffect(() => {
    setChampionImages(
      Object.fromEntries(
        champions.map(champion => [
          champion.id,
          { url: `/image/champion/${champion.id}.png` },
        ]),
      ),
    );
  }, [champions, setChampionImages]);

  useEffect(() => {
    let cancelled = false;
    setImagesReadyForCapture(false);
    if (!displayedChampions.length) return;
    const prepare = async () => {
      const [portraits, honey] = await Promise.all([
        Promise.all(
          displayedChampions.map(async champion => {
            const dataUrl = await load(`/image/champion/${champion.id}.png`);
            return [
              champion.id,
              { url: dataUrl || `/image/champion/${champion.id}.png`, dataUrl },
            ];
          }),
        ),
        load('/image/asset/bee_honey.png'),
      ]);
      if (cancelled) return;
      setChampionImages(Object.fromEntries(portraits));
      setTierImages({ honey });
      setImagesReadyForCapture(
        Boolean(honey) &&
          portraits.every(([, value]) => Boolean(value.dataUrl)),
      );
    };
    prepare();
    return () => {
      cancelled = true;
    };
  }, [
    displayedChampions,
    setChampionImages,
    setTierImages,
    setImagesReadyForCapture,
  ]);
  return null;
}
export default React.memo(ImageLoader);
