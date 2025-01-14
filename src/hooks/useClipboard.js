import { useCallback } from "react";
import html2canvas from "html2canvas";
import ReactGA from "react-ga4";

function useClipboard(captureRef, displayCount, randomChampions) {
  const copyImageToClipboard = useCallback(async () => {
    if (displayCount !== 15) {
      alert(
        "이미지 복사는 챔피언 수가 15일 때만 가능합니다.\n옵션에서 챔피언 수를 15로 설정해주세요."
      );
      return;
    }

    try {
      const canvas = await html2canvas(captureRef.current, {
        foreignObjectRendering: true,
        allowTaint: true,
        useCORS: true,
        scale: 1.1,
      });

      const captureWidth = 680;
      const captureHeight = 860;
      const startX = (canvas.width - captureWidth) / 2;
      const startY = (canvas.height - captureHeight) / 2 - 10;

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = captureWidth;
      croppedCanvas.height = captureHeight;
      const ctx = croppedCanvas.getContext("2d");

      ctx.drawImage(
        canvas,
        startX,
        startY,
        captureWidth,
        captureHeight,
        0,
        0,
        captureWidth,
        captureHeight
      );

      const blob = await new Promise((resolve) =>
        croppedCanvas.toBlob(resolve, "image/png")
      );
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      alert(
        "클립보드에 이미지가 복사되었습니다.\n붙여넣기(ctrl + v)로 사용하세요."
      );
    } catch (error) {
      console.error("이미지 복사 중 오류 발생:", error);
      alert("이미지 복사 중 오류가 발생했습니다.");
    }
  }, [displayCount, captureRef]);

  const copyTextToClipboard = useCallback(() => {
    const blueTeam = randomChampions.table1
      .map((champ) => champ.name)
      .join(", ");
    const redTeam = randomChampions.table2
      .map((champ) => champ.name)
      .join(", ");

    const text = `블루 팀(${randomChampions.table1.length}): ${blueTeam}\n레드 팀(${randomChampions.table2.length}): ${redTeam}`;

    navigator.clipboard.writeText(text).then(
      () => {
        alert(
          "클립보드에 텍스트가 복사되었습니다.\n붙여넣기(ctrl + v)로 사용하세요."
        );
      },
      (err) => {
        console.error("텍스트 복사 중 오류 발생:", err);
        alert("텍스트 복사 중 오류가 발생했습니다.");
      }
    );

    ReactGA.event({
      category: "Button",
      action: "Click",
      label: "Copy Text",
    });
  }, [randomChampions]);

  return { copyImageToClipboard, copyTextToClipboard };
}

export default useClipboard;
