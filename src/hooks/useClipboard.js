import { useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import ReactGA from 'react-ga4';

function useClipboard(
  captureRef,
  displayCount,
  randomChampions,
  alerts = {},
  championImages = {},
  tierImages = {},
) {
  // championImages 실시간 모니터링
  useEffect(() => {
    const championKeys = Object.keys(championImages);
    const base64ChampionCount = championKeys.filter(key =>
      championImages[key]?.url?.startsWith('data:'),
    ).length;
    console.log(
      `🧩 [CLIPBOARD] championImages 변경됨 - 총 ${championKeys.length}개, base64 ${base64ChampionCount}개`,
    );

    // 🔍 실제 객체 구조 확인
    const sampleKeys = championKeys.slice(0, 3);
    console.log(
      `🔍 [CLIPBOARD] championImages 구조 샘플:`,
      sampleKeys.map(key => ({
        id: key,
        hasUrl: !!championImages[key]?.url,
        hasDataUrl: !!championImages[key]?.dataUrl,
        urlType: championImages[key]?.url?.startsWith('data:')
          ? 'base64'
          : championImages[key]?.url?.startsWith('/')
          ? 'path'
          : 'unknown',
        urlStart: championImages[key]?.url?.substring(0, 30) + '...',
      })),
    );

    // base64 데이터 샘플 확인
    const base64Samples = championKeys
      .filter(key => championImages[key]?.url?.startsWith('data:'))
      .slice(0, 3)
      .map(key => `${key}: ${championImages[key].url?.substring(0, 30)}...`);

    if (base64Samples.length > 0) {
      console.log(`🔍 [CLIPBOARD] base64 샘플:`, base64Samples);
    }
  }, [championImages]);

  const copyImageToClipboard = async () => {
    console.log('🚀 [CAPTURE] 이미지 캡처 시작');

    // ⭐ 핵심 디버깅: useClipboard가 받는 championImages 상태 확인
    const championKeys = Object.keys(championImages);
    const base64ChampionCount = championKeys.filter(key =>
      championImages[key]?.url?.startsWith('data:'),
    ).length;
    console.log(
      `🔍 [CAPTURE] useClipboard이 받은 championImages: 총 ${championKeys.length}개, base64 ${base64ChampionCount}개`,
    );

    try {
      // 이미지 캡처는 15명까지만 지원
      if (displayCount > 15) {
        console.log('❌ [CAPTURE] displayCount > 15:', displayCount);
        if (alerts.showError) {
          alerts.showError(
            '이미지 캡처는 최대 15명까지만 지원됩니다.\n옵션에서 챔피언 수를 15 이하로 설정해주세요.',
          );
        }
        return;
      }

      console.log('✅ [CAPTURE] displayCount 체크 통과:', displayCount);

      const marginX = 32;
      const marginTop = 16;
      const marginBottom = 0;
      const scale = 1;

      // 실제 테이블들 찾기
      const tables = captureRef.current.querySelectorAll('table');
      console.log('🔍 [CAPTURE] 찾은 테이블 수:', tables.length);

      if (tables.length === 0) {
        console.log('❌ [CAPTURE] 테이블을 찾을 수 없음');
        if (alerts.showError) {
          alerts.showError('캡처할 챔피언 테이블을 찾을 수 없습니다.');
        }
        return;
      }

      // DOM 내 이미지 상태 점검
      const allImages = captureRef.current.querySelectorAll('img');
      console.log('🖼️ [CAPTURE] 총 이미지 수:', allImages.length);

      let dataUrlCount = 0;
      let urlCount = 0;
      let errorCount = 0;

      allImages.forEach(img => {
        if (img.src.startsWith('data:')) {
          dataUrlCount++;
        } else if (
          img.src.startsWith('/image/') ||
          img.src.includes('/image/')
        ) {
          urlCount++;
        } else {
          errorCount++;
        }
      });

      console.log('📊 [CAPTURE] 이미지 상태:', {
        base64: dataUrlCount,
        url: urlCount,
        error: errorCount,
      });

      if (dataUrlCount === 0 && urlCount > 0) {
        console.warn(
          '⚠️ [CAPTURE] 모든 이미지가 URL 상태 - DOM 강제 교체 필요',
        );
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

      // 캡처 영역 계산
      const captureX = Math.max(0, Math.floor(minX - marginX));
      const captureY = Math.max(0, Math.floor(minY - marginTop));
      const captureWidth = Math.ceil(maxX - minX + marginX * 2);
      const captureHeight = Math.ceil(maxY - minY + marginTop + marginBottom);

      console.log('📐 [CAPTURE] 캡처 영역:', {
        x: captureX,
        y: captureY,
        width: captureWidth,
        height: captureHeight,
        scale: scale,
      });

      // html2canvas 옵션 설정
      const html2canvasOptions = {
        foreignObjectRendering: true,
        allowTaint: true,
        useCORS: true,
        scale: scale,
        logging: true,
      };

      console.log('⚙️ [CAPTURE] html2canvas 옵션:', html2canvasOptions);

      // DOM 강제 업데이트 대기
      console.log('⏳ [CAPTURE] DOM 업데이트 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // DOM 업데이트 후 이미지 상태 재확인
      const updatedImages = captureRef.current.querySelectorAll('img');
      let updatedDataUrlCount = 0;
      let updatedUrlCount = 0;

      updatedImages.forEach(img => {
        if (img.src.startsWith('data:')) {
          updatedDataUrlCount++;
        } else if (
          img.src.startsWith('/image/') ||
          img.src.includes('/image/')
        ) {
          updatedUrlCount++;
        }
      });

      console.log('🔄 [CAPTURE] DOM 업데이트 후 이미지 상태:', {
        dataUrl: updatedDataUrlCount,
        url: updatedUrlCount,
      });

      // DOM 이미지 강제 교체
      console.log('🔧 [CAPTURE] DOM 이미지 강제 교체 시작...');

      const imgElements = captureRef.current.querySelectorAll('img');
      const displayedChampionIds = [];

      // DOM에서 표시된 챔피언들 추출
      imgElements.forEach(img => {
        const championMatch = img.src.match(/\/image\/champion\/(.+)\.png/);
        if (championMatch) {
          displayedChampionIds.push(championMatch[1]);
        }
      });

      console.log(
        `🎯 [CAPTURE] DOM에서 발견된 챔피언: ${displayedChampionIds.length}개`,
      );

      // 첫 번째 챔피언의 실제 데이터 확인 (디버깅용)
      if (displayedChampionIds.length > 0) {
        const firstChampionId = displayedChampionIds[0];
        const firstChampionData = championImages[firstChampionId];
        console.log(`🔍 [CAPTURE] 첫 번째 챔피언 ${firstChampionId} 데이터:`, {
          exists: !!firstChampionData,
          url: firstChampionData?.url?.substring(0, 50) + '...',
          isBase64: firstChampionData?.url?.startsWith('data:'),
          hasDataUrl: !!firstChampionData?.dataUrl,
        });
      }

      // 표시된 챔피언들의 base64 상태 확인
      let base64ReadyCount = 0;
      const missingBase64Champions = [];

      displayedChampionIds.forEach(championId => {
        const championData = championImages[championId];
        if (championData?.url?.startsWith('data:') || championData?.dataUrl) {
          base64ReadyCount++;
        } else {
          missingBase64Champions.push(championId);
        }
      });

      console.log(
        `📊 [CAPTURE] 표시된 챔피언 상태: ${base64ReadyCount}/${displayedChampionIds.length} base64 준비됨`,
      );
      if (
        missingBase64Champions.length > 0 &&
        missingBase64Champions.length <= 5
      ) {
        console.log(
          `❌ [CAPTURE] Base64 없는 챔피언들:`,
          missingBase64Champions.join(', '),
        );
      } else if (missingBase64Champions.length > 5) {
        console.log(
          `❌ [CAPTURE] ${missingBase64Champions.length}개 챔피언 모두 base64 없음`,
        );
      }

      let championImgCount = 0;
      let tierImgCount = 0;
      let championReplacedCount = 0;
      let tierReplacedCount = 0;

      imgElements.forEach(img => {
        const originalSrc = img.src;

        // 챔피언 이미지 교체
        const championMatch = originalSrc.match(/\/image\/champion\/(.+)\.png/);
        if (championMatch) {
          championImgCount++;
          const championId = championMatch[1];

          const championData = championImages[championId];
          if (championData) {
            let targetSrc = null;
            if (championData.url && championData.url.startsWith('data:')) {
              targetSrc = championData.url;
            } else if (championData.dataUrl) {
              targetSrc = championData.dataUrl;
            }

            if (targetSrc) {
              img.src = targetSrc;
              championReplacedCount++;
            }
          }
        }

        // 티어 이미지 교체
        const tierMatch = originalSrc.match(
          /\/image\/asset\/(tier_\d+|bee_honey|is_op)\.(svg|png)/,
        );
        if (tierMatch) {
          tierImgCount++;
          const tierKey =
            tierMatch[1] === 'bee_honey'
              ? 'honey'
              : tierMatch[1] === 'is_op'
              ? 'op'
              : tierMatch[1].replace('tier_', '');

          const tierData = tierImages[tierKey];
          console.log(`🔍 [CAPTURE] 티어 ${tierKey} 데이터:`, {
            exists: !!tierData,
            isBase64: tierData?.startsWith('data:'),
            dataStart: tierData?.substring(0, 30) + '...',
          });

          if (tierData && tierData.startsWith('data:')) {
            img.src = tierData;
            tierReplacedCount++;
            console.log(`✅ [CAPTURE] 티어 ${tierKey} 교체 완료`);
          } else {
            console.log(`❌ [CAPTURE] 티어 ${tierKey} 교체 실패 - base64 없음`);
          }
        }
      });

      console.log(
        `📊 [CAPTURE] 교체 결과: 챔피언 ${championReplacedCount}/${championImgCount}, 티어 ${tierReplacedCount}/${tierImgCount}`,
      );

      // 교체 후 대기
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ [CAPTURE] DOM 이미지 강제 교체 완료');

      console.log('🎯 [CAPTURE] html2canvas 실행 시작...');

      // 전체 컨테이너 캡처
      const canvas = await html2canvas(captureRef.current, html2canvasOptions);

      console.log('✅ [CAPTURE] html2canvas 완료:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
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

      console.log('✂️ [CAPTURE] 크롭 영역:', {
        sourceX: scaledX,
        sourceY: scaledY,
        sourceWidth: scaledWidth,
        sourceHeight: scaledHeight,
        targetWidth: scaledWidth,
        targetHeight: scaledHeight,
      });

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

      console.log('🎨 [CAPTURE] 크롭된 캔버스 생성 완료');

      // 캔버스를 blob으로 변환
      console.log('💾 [CAPTURE] blob 변환 시작...');
      const blob = await new Promise(resolve =>
        croppedCanvas.toBlob(resolve, 'image/png'),
      );

      console.log('✅ [CAPTURE] blob 생성 완료:', {
        size: blob.size,
        type: blob.type,
      });

      // 클립보드에 복사
      console.log('📋 [CAPTURE] 클립보드 복사 시작...');
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      console.log('🎉 [CAPTURE] 클립보드 복사 성공!');

      if (alerts.showSuccess) {
        alerts.showSuccess(
          '클립보드에 이미지가 복사되었습니다.\n붙여넣기(Ctrl+V)로 사용하세요.',
        );
      }
    } catch (error) {
      console.error('💥 [CAPTURE] 이미지 복사 중 오류 발생:', error);
      console.error('💥 [CAPTURE] 오류 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      if (alerts.showError) {
        alerts.showError('이미지 복사 중 오류가 발생했습니다.');
      }
    }
  };

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
  }, [randomChampions, alerts]);

  return { copyImageToClipboard, copyTextToClipboard };
}

export default useClipboard;
