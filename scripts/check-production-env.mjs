import { loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), 'REACT_APP_GA_TRACKING_ID');
if (env.REACT_APP_GA_TRACKING_ID !== 'G-CRE7F98KB6') {
  console.error('운영 GA4 측정 ID가 없거나 기존 속성과 다릅니다. 배포를 중단합니다.');
  process.exit(1);
}
console.log('운영 GA4 설정 확인 완료');
