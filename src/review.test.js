/* eslint-disable testing-library/no-unnecessary-act, testing-library/render-result-naming-convention -- Testing Library 없이 React DOM의 act로 직접 검증합니다. */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import useRandomChampions from './hooks/useRandomChampions';
import useAlert from './hooks/useAlert';
import { getFromStorage, setToStorage, STORAGE_KEYS } from './utils/storage';
import { sortChampions } from './utils/utils';
import { useChampionData } from './hooks/useChampionData';
import ImageLoader from './components/ImageLoader';

jest.mock('react-ga4', () => ({
  event: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
}));
global.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, current;
beforeEach(() => {
  container = document.createElement('div');
  container.id = 'root';
  document.body.append(container);
  root = createRoot(container);
  localStorage.clear();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

function mountHook(hook, props) {
  function Harness(properties) {
    current = hook(properties);
    return null;
  }
  const render = next => act(() => root.render(<Harness {...next} />));
  render(props);
  return render;
}
const champions = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  name: `챔피언${i}`,
}));
const gameData = {
  championData: { data: Object.fromEntries(champions.map(c => [c.id, c])) },
};
const useSelection = props =>
  useRandomChampions(gameData, props.bans, props.count);

test('두 팀에 중복 없이 같은 수의 챔피언을 뽑는다', () => {
  mountHook(useSelection, { bans: [], count: 3 });
  const all = [
    ...current.randomChampions.table1,
    ...current.randomChampions.table2,
  ];
  expect(all).toHaveLength(6);
  expect(new Set(all.map(c => c.id)).size).toBe(6);
});

test('밴으로 풀이 부족해져도 인원을 제한하고 반복 추첨하지 않는다', () => {
  const render = mountHook(useSelection, { bans: [], count: 4 });
  render({ bans: ['0', '1', '2', '3', '4'], count: 4 });
  expect(current.randomChampions.table1).toHaveLength(1);
  expect(current.randomChampions.table2).toHaveLength(1);
  const previousCount = current.resetCount;
  render({ bans: ['0', '1', '2', '3', '4'], count: 4 });
  expect(current.resetCount).toBe(previousCount);
});

test('전체 밴과 밴 해제 시 빈 팀에서 복구한다', () => {
  const render = mountHook(useSelection, { bans: [], count: 3 });
  render({ bans: champions.map(c => c.id), count: 3 });
  expect(current.randomChampions.table1).toHaveLength(0);
  render({ bans: [], count: 3 });
  expect(current.randomChampions.table1).toHaveLength(3);
  expect(current.randomChampions.table2).toHaveLength(3);
});

test('현재 선택한 챔피언을 밴하면 두 팀에서 제외한다', () => {
  const render = mountHook(useSelection, { bans: [], count: 2 });
  const banned = current.randomChampions.table1[0].id;
  render({ bans: [banned], count: 2 });
  expect(
    [...current.randomChampions.table1, ...current.randomChampions.table2].some(
      c => c.id === banned,
    ),
  ).toBe(false);
});

test('확인 창을 취소하면 대기 Promise가 false로 종료된다', async () => {
  mountHook(() => useAlert(), {});
  let result;
  act(() => {
    result = current.showConfirm('확인');
  });
  act(() => current.closeAlert());
  await expect(result).resolves.toBe(false);
});

test('확인 창에서 확인하면 true로 종료된다', async () => {
  mountHook(() => useAlert(), {});
  let result;
  act(() => {
    result = current.showConfirm('확인');
  });
  act(() => current.alertState.onConfirm());
  await expect(result).resolves.toBe(true);
});

test.each([null, -1, 0, 1.5, '15', 999])(
  '잘못된 저장 인원 %p는 기본값을 사용한다',
  value => {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_COUNT, JSON.stringify(value));
    expect(getFromStorage(STORAGE_KEYS.DISPLAY_COUNT, 15)).toBe(15);
  },
);

test('저장소 접근이 차단되어도 초기화와 설정 저장이 중단되지 않는다', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('차단');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('차단');
  });
  expect(getFromStorage(STORAGE_KEYS.BANNED_CHAMPIONS, [])).toEqual([]);
  expect(() => setToStorage(STORAGE_KEYS.DISPLAY_COUNT, 15)).not.toThrow();
});

test('표시와 복사에 쓰는 정렬은 원본을 바꾸지 않고 미집계 챔피언을 마지막에 둔다', () => {
  const source = [{ name: '나' }, { name: '가' }, { name: '다' }];
  expect(
    sortChampions(source, 'tier', {
      가: { ranking: 1 },
      나: { ranking: 2 },
    }).map(c => c.name),
  ).toEqual(['가', '나', '다']);
  expect(source.map(c => c.name)).toEqual(['나', '가', '다']);
});

test('외부 CDN 호출 없이 배포된 동일 버전 데이터를 읽는다', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '16.17.1', patch: '26.17' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        version: '16.17.1',
        data: gameData.championData.data,
      }),
    });
  await act(async () => {
    mountHook(() => useChampionData(), {});
  });
  expect(current.error).toBe(null);
  expect(current.gameData.version).toBe('16.17.1');
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    '/json/version.json',
    '/json/championData.json',
  ]);
});

test('HTTP 오류는 사용자에게 보여줄 오류 상태가 된다', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  await act(async () => {
    mountHook(() => useChampionData(), {});
  });
  expect(current.error.message).toContain('불러오지 못했습니다');
  expect(current.isLoading).toBe(false);
});

test('서로 다른 버전의 파일을 섞어 사용하지 않는다', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '16.17.1' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        version: '16.1.1',
        data: gameData.championData.data,
      }),
    });
  await act(async () => {
    mountHook(() => useChampionData(), {});
  });
  expect(current.error.message).toContain('업데이트 중');
});

test('표시할 이미지만 준비하며 하나라도 실패하면 이미지 복사를 활성화하지 않는다', async () => {
  const requests = [];
  const OriginalImage = global.Image;
  global.Image = class {
    set src(url) {
      this.url = url;
      requests.push(this);
    }
  };
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({ drawImage: jest.fn() });
  jest
    .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    .mockReturnValue('data:image/png;base64,test');
  const ready = jest.fn();
  try {
    act(() =>
      root.render(
        <ImageLoader
          champions={champions}
          displayedChampions={champions.slice(0, 2)}
          setChampionImages={jest.fn()}
          setTierImages={jest.fn()}
          setImagesReadyForCapture={ready}
        />,
      ),
    );
    expect(requests).toHaveLength(3);
    await act(async () => {
      requests[0].onload();
      requests[1].onerror();
      requests[2].onload();
    });
    expect(ready).toHaveBeenLastCalledWith(false);
  } finally {
    global.Image = OriginalImage;
  }
});

test('통계 요청만 실패해도 앱이 추첨 기능을 제공한다', async () => {
  const App = require('./App').default;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn(async url => ({
    ok: url !== '/json/championRanking.json',
    json: async () =>
      url === '/json/version.json'
        ? { version: '16.17.1', patch: '26.17' }
        : { version: '16.17.1', data: gameData.championData.data },
  }));
  await act(async () => root.render(<App />));
  expect(container.textContent).toContain('추첨은 계속 사용할 수 있습니다');
  expect(container.querySelectorAll('.champion-pick')).toHaveLength(8);
});

test('챔피언 요청 실패 시 오류 화면과 재시도 버튼을 제공한다', async () => {
  const App = require('./App').default;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  await act(async () => root.render(<App />));
  expect(container.querySelector('[role="alert"]').textContent).toContain(
    '불러오지 못했어요',
  );
  expect(container.querySelector('button').textContent).toBe('다시 시도');
});
