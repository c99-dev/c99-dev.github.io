import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import ReactGA from 'react-ga4';

function useClipboard(captureRef, displayCount, randomChampions, alerts = {}) {
  const copyImageToClipboard = useCallback(async () => {
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

      const marginX = 32;
      const marginTop = 16;
      const marginBottom = 0;

      // 캡처 배율 설정
      const scale = 1;

      // 실제 테이블들 찾기 (더 정확한 경계를 위해)
      const tables = captureRef.current.querySelectorAll('table');
      if (tables.length === 0) {
        if (alerts.showError) {
          alerts.showError('캡처할 챔피언 테이블을 찾을 수 없습니다.');
        }
        return;
      }

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

      // 캡처 영역 계산 (실제 테이블 경계에 여백 추가, 픽셀 정렬)
      const captureX = Math.max(0, Math.floor(minX - marginX));
      const captureY = Math.max(0, Math.floor(minY - marginTop));
      const captureWidth = Math.ceil(maxX - minX + marginX * 2);
      const captureHeight = Math.ceil(maxY - minY + marginTop + marginBottom);

      // 전체 컨테이너 캡처
      const canvas = await html2canvas(captureRef.current, {
        foreignObjectRendering: true,
        allowTaint: true,
        useCORS: true,
        scale: scale,
      });

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

      const blob = await new Promise(resolve =>
        croppedCanvas.toBlob(resolve, 'image/png'),
      );
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
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
  }, [captureRef]);

  const copyTextToClipboard = useCallback(() => {
    const blueTeam = randomChampions.table1.map(champ => champ.name).join(', ');
    const redTeam = randomChampions.table2.map(champ => champ.name).join(', ');

    const text = `블루 팀(${randomChampions.table1.length}): ${blueTeam}\n레드 팀(${randomChampions.table2.length}): ${redTeam}`;

    navigator.clipboard.writeText(text).then(
      () => {
        if (alerts.showSuccess) {
          alerts.showSuccess(
            '클립보드에 텍스트가 복사되었습니다.\n붙여넣기(Ctrl+V)로 사용하세요.',
          );
        }
      },
      err => {
        console.error('텍스트 복사 중 오류 발생:', err);
        if (alerts.showError) {
          alerts.showError('텍스트 복사 중 오류가 발생했습니다.');
        }
      },
    );

    ReactGA.event({
      category: 'Button',
      action: 'Click',
      label: 'Copy Text',
    });
  }, [randomChampions]);

  return { copyImageToClipboard, copyTextToClipboard };
}

export default useClipboard;
