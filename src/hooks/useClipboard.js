import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { sortChampions } from '../utils/utils';

function useClipboard(
  captureRef,
  displayCount,
  randomChampions,
  alerts = {},
  championImages = {},
  tierImages = {},
  sortOption = 'random',
  ranking = {},
) {
  const copyImageToClipboard = async () => {
    try {
      if (displayCount > 15)
        throw new Error('이미지 복사는 팀당 15명까지 지원됩니다.');
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error(
          '이 브라우저는 이미지 복사를 지원하지 않습니다. 텍스트 복사를 이용해주세요.',
        );
      }
      const capture = captureRef.current;
      if (!capture || !capture.querySelector('.champion-pick'))
        throw new Error('복사할 챔피언이 없습니다.');
      // 복사 요청을 클릭 이벤트 안에서 시작해 Safari의 사용자 동작 조건을 지킵니다.
      const blobPromise = html2canvas(capture, {
        backgroundColor: '#161a21',
        scale: 1,
        logging: false,
        useCORS: true,
        windowWidth: 1200,
        onclone: (_document, element) => {
          element.style.width = '640px';
          element.style.padding = '8px';
          element.querySelector('.teams-layout').style.gridTemplateColumns =
            'repeat(2, minmax(0, 1fr))';
        },
      }).then(
        canvas =>
          new Promise((resolve, reject) => {
            canvas.toBlob(
              blob =>
                blob
                  ? resolve(blob)
                  : reject(new Error('이미지를 만들지 못했습니다.')),
              'image/png',
            );
          }),
      );
      // 클립보드 권한이 먼저 거절되더라도 이미지 생성 실패가 처리되지 않은 Promise로 남지 않습니다.
      blobPromise.catch(() => {});
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blobPromise }),
      ]);
      alerts.showSuccess?.(
        '이미지가 복사되었습니다. 대화창에 붙여넣어 공유하세요.',
      );
    } catch (error) {
      alerts.showError?.(
        error.name === 'NotAllowedError'
          ? '클립보드 권한이 필요합니다. 브라우저 권한을 확인한 뒤 다시 시도해주세요.'
          : error.message || '이미지 복사에 실패했습니다.',
      );
    }
  };

  const copyTextToClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('이 브라우저는 클립보드 복사를 지원하지 않습니다.');
      const blue = sortChampions(randomChampions.table1, sortOption, ranking)
        .map(champion => champion.name)
        .join(', ');
      const red = sortChampions(randomChampions.table2, sortOption, ranking)
        .map(champion => champion.name)
        .join(', ');
      await navigator.clipboard.writeText(
        `블루 팀(${randomChampions.table1.length}): ${blue}\n레드 팀(${randomChampions.table2.length}): ${red}`,
      );
      alerts.showSuccess?.(
        '텍스트가 복사되었습니다. 대화창에 붙여넣어 공유하세요.',
      );
    } catch (error) {
      alerts.showError?.(
        '텍스트를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해주세요.',
      );
    }
  }, [randomChampions, sortOption, ranking, alerts]);
  return { copyImageToClipboard, copyTextToClipboard };
}
export default useClipboard;
