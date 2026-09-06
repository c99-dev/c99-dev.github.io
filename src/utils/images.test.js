import { loadImageAsDataURL, waitForImage } from './images';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const OriginalImage = global.Image;
let requested;
beforeEach(() => {
  requested = [];
  global.Image = class {
    naturalWidth = 40;
    naturalHeight = 40;
    set src(value) { this.url = value; requested.push(this); }
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() });
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,ok');
});
afterEach(() => { global.Image = OriginalImage; vi.restoreAllMocks(); });

test('이미지 실패는 원본 URL을 성공 결과로 반환하지 않고 재시도를 허용한다', async () => {
  const failed = loadImageAsDataURL('/failure.png');
  requested[0].onerror();
  await expect(failed).rejects.toThrow('불러오지 못했습니다');
  const retry = loadImageAsDataURL('/failure.png');
  expect(requested).toHaveLength(2);
  requested[1].onload();
  await expect(retry).resolves.toBe('data:image/png;base64,ok');
});
test('canvas 변환 오류가 나도 Promise가 대기 상태로 남지 않는다', async () => {
  HTMLCanvasElement.prototype.toDataURL.mockImplementation(() => { throw Error('변환 실패'); });
  const result = loadImageAsDataURL('/canvas-error.png');
  requested[0].onload();
  await expect(result).rejects.toThrow('변환 실패');
});
test('동일한 이미지의 동시 요청은 한 번만 변환한다', async () => {
  const first = loadImageAsDataURL('/cached.png');
  const second = loadImageAsDataURL('/cached.png');
  expect(requested).toHaveLength(1);
  requested[0].onload();
  await expect(first).resolves.toBe('data:image/png;base64,ok');
  expect(second).toBe(first);
});
test('DOM 이미지가 실패하면 캡처를 시작하지 않는다', async () => {
  await expect(waitForImage({ complete: true, naturalWidth: 0 })).rejects.toThrow('손상');
  const image = document.createElement('img');
  Object.defineProperty(image, 'complete', { value: false });
  const result = waitForImage(image);
  image.dispatchEvent(new Event('error'));
  await expect(result).rejects.toThrow('불러오지 못했습니다');
});
