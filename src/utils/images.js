const cache = new Map();

// 동일한 이미지는 한 번만 변환하고, 실패한 요청은 다음 시도에서 다시 받습니다.
export function loadImageAsDataURL(src) {
  if (cache.has(src)) return cache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => finish(new Error('이미지 로딩 시간이 초과되었습니다.')), 15000);
    const finish = (error, value) => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      if (error) reject(error);
      else resolve(value);
    };
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        if (!canvas.width || !canvas.height) throw new Error('이미지가 비어 있습니다.');
        canvas.getContext('2d').drawImage(img, 0, 0);
        finish(null, canvas.toDataURL('image/png'));
      } catch (error) { finish(error); }
    };
    img.onerror = () => finish(new Error('이미지를 불러오지 못했습니다.'));
    img.src = src;
  }).catch(error => { cache.delete(src); throw error; });
  cache.set(src, promise);
  return promise;
}

export function waitForImage(img) {
  if (img.complete) return img.naturalWidth > 0
    ? Promise.resolve() : Promise.reject(new Error('이미지가 손상되었습니다.'));
  return new Promise((resolve, reject) => {
    const finish = error => {
      clearTimeout(timer);
      img.removeEventListener('load', loaded);
      img.removeEventListener('error', failed);
      error ? reject(error) : resolve();
    };
    const loaded = () => finish(img.naturalWidth ? null : new Error('이미지가 비어 있습니다.'));
    const failed = () => finish(new Error('이미지를 불러오지 못했습니다.'));
    const timer = setTimeout(() => finish(new Error('이미지 로딩 시간이 초과되었습니다.')), 15000);
    img.addEventListener('load', loaded);
    img.addEventListener('error', failed);
  });
}
