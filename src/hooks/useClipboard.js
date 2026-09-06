import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import ReactGA from 'react-ga4';
import { sortChampions } from '../utils/utils';
import { waitForImage } from '../utils/images';

function useClipboard(
  captureRef,
  displayCount,
  randomChampions,
  alerts = {},
  championImages = {},
  tierImages = {},
  sortOption = 'tier',
  championRanking = {},
) {
  const copyImageToClipboard = async () => {
    try {
      // 이미지 캡처는 15명까지만 지원
      if (displayCount > 15) {
        if (alerts.showError) {
          alerts.showError(
            '이미지 캡처는 최대 15명까지만 지원됩니다.\n옵션에서 챔피언 수를 15 이하로 설정해주세요.',
          );
        }
        return;
      }

      if (!captureRef.current || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('이 브라우저에서는 이미지 복사를 지원하지 않습니다.');
      }
      const captureImage = async () => {
        const target = captureRef.current;
        await Promise.all(Array.from(target.querySelectorAll('img'), waitForImage));
        if (document.fonts?.ready) await document.fonts.ready;
        const marginX = 32;
        const marginTop = 16;
        const marginBottom = 0;
        const scale = 1;

        // 실제 테이블들 찾기
        const tables = captureRef.current.querySelectorAll('table');

        if (tables.length === 0) throw new Error('캡처할 챔피언 테이블을 찾을 수 없습니다.');

        // 모든 테이블의 경계를 계산
        const containerRect = captureRef.current.getBoundingClientRect();
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        tables.forEach(table => {
          const tableRect = table.getBoundingClientRect();
          const relativeX =
            tableRect.left - containerRect.left + captureRef.current.scrollLeft;
          const relativeY =
            tableRect.top - containerRect.top + captureRef.current.scrollTop;

          minX = Math.min(minX, relativeX);
          minY = Math.min(minY, relativeY);
          maxX = Math.max(maxX, relativeX + tableRect.width);
          maxY = Math.max(maxY, relativeY + tableRect.height);
        });

        // 캡처 영역 계산
        const captureX = Math.max(0, Math.floor(minX - marginX));
        const captureY = Math.max(0, Math.floor(minY - marginTop));
        const captureWidth = Math.ceil(maxX - minX + marginX * 2);
        const captureHeight = Math.ceil(maxY - minY + marginTop + marginBottom);
        const layoutRect = target.querySelector('.tables-container').getBoundingClientRect();
        const layoutLeft = layoutRect.left - containerRect.left + target.scrollLeft;
        const layoutTop = layoutRect.top - containerRect.top + target.scrollTop;

        // html2canvas 옵션 설정
        const html2canvasOptions = {
          foreignObjectRendering: true,
          allowTaint: false,
          useCORS: true,
          scale: scale,
          logging: false,
          onclone: (document, clone) => {
            // 화면의 스크롤 영역을 그대로 유지하고 캡처용 복제본에서만 잘림을 해제합니다.
            Object.assign(clone.style, {
              overflow: 'visible', position: 'relative', flex: 'none',
              boxSizing: 'border-box', width: `${containerRect.width}px`,
              height: `${Math.max(target.scrollHeight, maxY)}px`,
            });
            clone.scrollTop = 0;
            clone.scrollLeft = 0;
            const layout = clone.querySelector('.tables-container');
            Object.assign(layout.style, {
              position: 'absolute', left: `${layoutLeft}px`, top: `${layoutTop}px`,
              width: `${layoutRect.width}px`, height: `${layoutRect.height}px`,
            });
            clone.querySelectorAll('th').forEach(cell => { cell.style.position = 'static'; });
          },
        };

        // 전체 컨테이너 캡처
        const canvas = await html2canvas(captureRef.current, html2canvasOptions);

        // 스케일 적용된 좌표로 변환
        const scaledX = captureX * scale;
        const scaledY = captureY * scale;
        const scaledWidth = captureWidth * scale;
        const scaledHeight = captureHeight * scale;

        // 크롭된 캔버스 생성
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = scaledWidth;
        croppedCanvas.height = scaledHeight;
        const ctx = croppedCanvas.getContext('2d');

        ctx.drawImage(
          canvas,
          scaledX,
          scaledY,
          scaledWidth,
          scaledHeight,
          0,
          0,
          scaledWidth,
          scaledHeight,
        );

        // 캔버스를 blob으로 변환
        return new Promise((resolve, reject) =>
          croppedCanvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지 생성에 실패했습니다.')), 'image/png'),
        );
      };

      // 클릭 시점에 클립보드 작업을 시작하여 브라우저의 사용자 입력 권한을 유지합니다.
      const imagePromise = captureImage();
      imagePromise.catch(() => {});
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': imagePromise }),
      ]);

      if (alerts.showSuccess) {
        alerts.showSuccess(
          '클립보드에 이미지가 복사되었습니다.\n붙여넣기(Ctrl+V)로 사용하세요.',
        );
      }
    } catch (error) {
      console.error('이미지 복사 중 오류 발생:', error);
      if (alerts.showError) {
        alerts.showError('이미지 복사 중 오류가 발생했습니다.');
      }
    }
  };

  const copyTextToClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('텍스트 복사를 지원하지 않는 브라우저입니다.');
      const blueTeam = sortChampions(randomChampions.table1, sortOption, championRanking).map(champ => champ.name).join(', ');
      const redTeam = sortChampions(randomChampions.table2, sortOption, championRanking).map(champ => champ.name).join(', ');
      const text = `블루 팀(${randomChampions.table1.length}): ${blueTeam}\n레드 팀(${randomChampions.table2.length}): ${redTeam}`;
      await navigator.clipboard.writeText(text);
      alerts.showSuccess?.('클립보드에 텍스트가 복사되었습니다.\n붙여넣기(Ctrl+V)로 사용하세요.');
      ReactGA.event({ category: 'Button', action: 'Click', label: 'Copy Text' });
    } catch (error) {
      console.error('텍스트 복사 중 오류 발생:', error);
      alerts.showError?.('텍스트 복사 중 오류가 발생했습니다.');
    }
  }, [randomChampions, sortOption, championRanking, alerts]);

  return { copyImageToClipboard, copyTextToClipboard };
}

export default useClipboard;
