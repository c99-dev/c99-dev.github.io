/**
 * 성능 측정 및 최적화 유틸리티
 */
import React from 'react';

// 성능 측정 시작
export const startPerformanceMeasure = name => {
  if (performance && performance.mark) {
    performance.mark(`${name}-start`);
  }
};

// 성능 측정 종료 및 결과 반환
export const endPerformanceMeasure = name => {
  if (performance && performance.mark && performance.measure) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name)[0];
    const duration = Math.round(measure.duration * 100) / 100; // 소수점 2자리

    console.log(`⚡ ${name}: ${duration}ms`);
    return duration;
  }
  return 0;
};

// 이미지 로딩 성능 측정
export const measureImageLoadTime = async (url, name = 'image-load') => {
  startPerformanceMeasure(name);

  try {
    const startTime = performance.now();
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const loadTime = performance.now() - startTime;
    console.log(`🖼️ ${name} (${url}): ${Math.round(loadTime * 100) / 100}ms`);
    return loadTime;
  } catch (error) {
    console.error(`❌ Failed to load ${name}:`, error);
    return -1;
  } finally {
    endPerformanceMeasure(name);
  }
};

// 컴포넌트 렌더링 성능 측정 HOC
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return React.memo(props => {
    const renderCount = React.useRef(0);
    const lastRenderTime = React.useRef(performance.now());

    React.useEffect(() => {
      renderCount.current += 1;
      const currentTime = performance.now();
      const timeSinceLastRender = currentTime - lastRenderTime.current;

      console.log(
        `📊 ${componentName} render #${renderCount.current} (+${Math.round(
          timeSinceLastRender,
        )}ms)`,
      );
      lastRenderTime.current = currentTime;
    });

    return React.createElement(WrappedComponent, props);
  });
};

// 메모리 사용량 모니터링
export const logMemoryUsage = (context = '') => {
  if (performance && performance.memory) {
    const memory = performance.memory;
    const used = Math.round((memory.usedJSHeapSize / 1024 / 1024) * 100) / 100;
    const total =
      Math.round((memory.totalJSHeapSize / 1024 / 1024) * 100) / 100;
    const limit =
      Math.round((memory.jsHeapSizeLimit / 1024 / 1024) * 100) / 100;

    console.log(
      `🧠 Memory ${context}: ${used}MB / ${total}MB (limit: ${limit}MB)`,
    );
    return { used, total, limit };
  }
  return null;
};

// Lazy loading 상태 추적
export const trackLazyLoadingProgress = (
  loadedCount,
  totalCount,
  context = '',
) => {
  const percentage = Math.round((loadedCount / totalCount) * 100);
  console.log(
    `⭐ ${context} Loading Progress: ${loadedCount}/${totalCount} (${percentage}%)`,
  );
  return percentage;
};
