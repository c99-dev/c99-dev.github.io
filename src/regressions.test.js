import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Modal from 'react-modal';
import useRandomChampions from './hooks/useRandomChampions';
import useAlert from './hooks/useAlert';
import useClipboard from './hooks/useClipboard';
import { useChampionData } from './hooks/useChampionData';
import useChampionRanking from './hooks/useChampionRanking';
import { getFromStorage, setToStorage, STORAGE_KEYS } from './utils/storage';
import { sortChampions } from './utils/utils';
import AlertModal from './components/AlertModal';
import OptionModal from './components/OptionModal';
import ImageLoader from './components/ImageLoader';

jest.mock('react-ga4', () => ({ event: jest.fn(), initialize: jest.fn(), send: jest.fn() }));
jest.mock('./utils/images', () => ({ loadImageAsDataURL: jest.fn(), waitForImage: jest.fn() }));
global.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, current;
const originalFetch = global.fetch;
beforeEach(() => {
  container = document.createElement('div'); container.id = 'root';
  document.body.appendChild(container); root = createRoot(container);
  Modal.setAppElement(container);
  localStorage.clear();
  require('./utils/images').loadImageAsDataURL.mockImplementation(src => Promise.resolve(`data:${src}`));
});
afterEach(() => {
  act(() => root.unmount()); container.remove();
  jest.restoreAllMocks(); jest.clearAllMocks(); global.fetch = originalFetch;
});
function mountHook(hook, props = {}) {
  function Harness(properties) { current = hook(properties); return null; }
  const render = next => act(() => root.render(<Harness {...next} />));
  render(props); return render;
}
const champions = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, name: `챔피언${i}` }));
const gameData = { championData: { data: Object.fromEntries(champions.map(c => [c.id, c])) } };
const useSelection = props => useRandomChampions(gameData, props.bans, props.count, props.alerts);
const selected = () => [...current.randomChampions.table1, ...current.randomChampions.table2];

test('두 팀에 밴을 제외하고 같은 수를 중복 없이 추첨한다', () => {
  mountHook(useSelection, { bans: ['c0'], count: 15 });
  expect(current.randomChampions.table1).toHaveLength(15);
  expect(current.randomChampions.table2).toHaveLength(15);
  expect(new Set(selected().map(c => c.id)).size).toBe(30);
  expect(selected().some(c => c.id === 'c0')).toBe(false);
});
test('후보 20명으로 30명을 요청하면 기존 결과를 보존하고 안내한다', () => {
  const showError = jest.fn();
  const render = mountHook(useSelection, { bans: [], count: 15, alerts: { showError } });
  const previous = current.randomChampions;
  render({ bans: champions.slice(0, 20).map(c => c.id), count: 15, alerts: { showError } });
  act(() => expect(current.resetRandomChampions()).toBe(false));
  expect(current.randomChampions).toBe(previous);
  expect(showError).toHaveBeenCalledWith(expect.stringContaining('현재 후보는 20명'));
});
test('처음부터 후보가 부족해도 밴 해제 후 빈 결과에서 복구한다', () => {
  const render = mountHook(useSelection, { bans: champions.map(c => c.id), count: 15 });
  expect(selected()).toHaveLength(0);
  render({ bans: [], count: 15 });
  expect(selected()).toHaveLength(30);
});
test('표시 개수 변경으로 양 팀을 재구성하며 소수는 거부한다', () => {
  const render = mountHook(useSelection, { bans: [], count: 15 });
  render({ bans: [], count: 4 });
  expect(selected()).toHaveLength(8);
  const previous = current.randomChampions;
  render({ bans: [], count: 1.5 });
  expect(current.randomChampions).toBe(previous);
});
test('개별 리롤을 취소하면 챔피언이 바뀌지 않는다', async () => {
  mountHook(useSelection, { bans: [], count: 15, alerts: { showConfirmWithContent: async () => false } });
  const previous = current.randomChampions;
  await act(async () => current.handleReRollChampion('table1', 0));
  expect(current.randomChampions).toBe(previous);
});
test('확인 대기 중 밴이 바뀌면 최신 후보만 사용한다', async () => {
  let confirm;
  const alerts = { showConfirmWithContent: () => new Promise(resolve => { confirm = resolve; }) };
  const render = mountHook(useSelection, { bans: [], count: 15, alerts });
  const old = current.randomChampions.table1[0].id;
  const displayed = new Set(selected().map(c => c.id));
  const remaining = champions.filter(c => !displayed.has(c.id));
  let pending;
  act(() => { pending = current.handleReRollChampion('table1', 0); });
  render({ bans: remaining.slice(1).map(c => c.id), count: 15, alerts });
  await act(async () => { confirm(true); await pending; });
  expect(current.randomChampions.table1[0].id).toBe(remaining[0].id);
  expect(current.randomChampions.table1[0].id).not.toBe(old);
  expect(new Set(selected().map(c => c.id)).size).toBe(30);
});
test.each([false, true])('확인창 결과 %p는 Promise를 종료한다', async confirmed => {
  mountHook(() => useAlert()); let pending;
  act(() => { pending = current.showConfirm('확인'); });
  act(() => confirmed ? current.alertState.onConfirm() : current.closeAlert());
  await expect(pending).resolves.toBe(confirmed);
});
test('새 알림과 unmount는 이전 대기를 취소한다', async () => {
  mountHook(() => useAlert()); let first, second;
  act(() => { first = current.showConfirm('첫 번째'); });
  act(() => { second = current.showConfirm('두 번째'); });
  await expect(first).resolves.toBe(false);
  act(() => root.render(null)); await expect(second).resolves.toBe(false);
});
test('취소 버튼의 Enter를 문서 단위 확인 처리로 가로채지 않는다', () => {
  const confirm = jest.fn(), close = jest.fn();
  act(() => root.render(<AlertModal isOpen type="confirm" onConfirm={confirm} closeModal={close} message="확인" />));
  const cancel = Array.from(document.querySelectorAll('button')).find(button => button.textContent === '취소');
  cancel.focus();
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  act(() => cancel.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(false);
  expect(confirm).not.toHaveBeenCalled();
  act(() => cancel.click()); expect(close).toHaveBeenCalledTimes(1);
});
test.each([null, -1, 0, 1.5, '15', 999])('잘못된 저장 인원 %p를 복구한다', value => {
  localStorage.setItem(STORAGE_KEYS.DISPLAY_COUNT, JSON.stringify(value));
  expect(getFromStorage(STORAGE_KEYS.DISPLAY_COUNT, 15)).toBe(15);
});
test('잘못된 밴 목록과 저장소 접근 차단을 처리한다', () => {
  localStorage.setItem(STORAGE_KEYS.BANNED_CHAMPIONS, 'null');
  expect(getFromStorage(STORAGE_KEYS.BANNED_CHAMPIONS, [])).toEqual([]);
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw Error('차단'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('차단'); });
  expect(getFromStorage(STORAGE_KEYS.DISPLAY_COUNT, 15)).toBe(15);
  expect(() => setToStorage(STORAGE_KEYS.DISPLAY_COUNT, 15)).not.toThrow();
});
test('닫고 다시 연 옵션은 저장된 설정을 표시한다', () => {
  const props = { isOpen: true, displayCount: 15, sortOption: 'tier', tierDisplay: true, maxDisplayCount: 20, closeModal: jest.fn() };
  act(() => root.render(<OptionModal {...props} />));
  const select = document.querySelector('select');
  act(() => { select.value = 'random'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  act(() => root.render(<OptionModal {...props} isOpen={false} />));
  act(() => root.render(<OptionModal {...props} />));
  expect(document.querySelector('select').value).toBe('tier');
});
test('화면 정렬과 텍스트 복사 순서가 일치하고 원본을 보존한다', async () => {
  const source = [{ name: '나' }, { name: '가' }, { name: '다' }];
  const ranking = { 가: { ranking: 1 }, 나: { ranking: 2 } };
  expect(sortChampions(source, 'tier', ranking).map(c => c.name)).toEqual(['가', '나', '다']);
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  mountHook(() => useClipboard({}, 3, { table1: source, table2: [] }, {}, {}, {}, 'tier', ranking));
  await act(async () => current.copyTextToClipboard());
  expect(writeText).toHaveBeenCalledWith('블루 팀(3): 가, 나, 다\n레드 팀(0): ');
  expect(source.map(c => c.name)).toEqual(['나', '가', '다']);
});
test('클립보드 API가 없어도 오류를 안내한다', async () => {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const showError = jest.fn();
  mountHook(() => useClipboard({}, 1, { table1: [], table2: [] }, { showError }));
  await act(async () => current.copyTextToClipboard());
  expect(showError).toHaveBeenCalledTimes(1);
});
function mockDataFetch(version = '16.17.1') {
  global.fetch = jest.fn(async url => ({ ok: true, json: async () => url.includes('version')
    ? { version: '16.17.1', patch: '26.17' }
    : { version, data: gameData.championData.data } }));
}
test('외부 CDN 없이 배포된 챔피언 데이터를 읽는다', async () => {
  mockDataFetch();
  await act(async () => { mountHook(() => useChampionData()); });
  expect(current.error).toBe(null);
  expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/json/version.json', '/json/championData.json']);
});
test('파일 버전이 다르면 섞어서 사용하지 않는다', async () => {
  mockDataFetch('16.1.1');
  await act(async () => { mountHook(() => useChampionData()); });
  expect(current.error.message).toContain('업데이트 중');
});
test('랭킹 실패는 빈 통계와 오류 객체로 반환한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  await act(async () => { mountHook(() => useChampionRanking()); });
  expect(current.championRanking).toEqual({}); expect(current.error).toBeInstanceOf(Error);
  expect(current.isLoading).toBe(false);
});
test('이미지 또는 마크가 준비되기 전에 복사를 활성화하지 않는다', async () => {
  const { loadImageAsDataURL } = require('./utils/images');
  const ready = jest.fn(); let resolvePortrait;
  loadImageAsDataURL.mockImplementation(src => src.includes('/champion/')
    ? new Promise(resolve => { resolvePortrait = resolve; }) : Promise.resolve(`data:${src}`));
  const props = { champions, displayedChampions: [champions[0]], setChampionImages: jest.fn(), setTierImages: jest.fn(), setImagesReadyForCapture: ready, version: '16.17.1' };
  await act(async () => root.render(<ImageLoader {...props} />));
  expect(ready).not.toHaveBeenCalledWith(true);
  await act(async () => resolvePortrait('data:image/png;base64,test'));
  expect(ready).toHaveBeenLastCalledWith(true);
});
test('랭킹만 실패해도 앱은 15명씩 표시하며 제거한 버튼을 만들지 않는다', async () => {
  const App = require('./App').default;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn(async url => ({ ok: !url.includes('Ranking'), json: async () =>
    url.includes('version') ? { version: '16.17.1', patch: '26.17' } : { version: '16.17.1', data: gameData.championData.data } }));
  await act(async () => root.render(<App />));
  expect(container.querySelectorAll('tbody tr')).toHaveLength(30);
  expect(container.textContent).not.toMatch(/공지사항|패치 노트/);
  expect(container.querySelector('[role="alert"]')).toBe(null);
});
