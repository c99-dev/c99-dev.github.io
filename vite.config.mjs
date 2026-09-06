import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 기존 .env의 공개 GA 설정 이름을 유지하고 이 값만 클라이언트에 전달합니다.
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_GA_TRACKING_ID');
  return {
    plugins: [react()],
    define: {
      'import.meta.env.REACT_APP_GA_TRACKING_ID': JSON.stringify(env.REACT_APP_GA_TRACKING_ID || ''),
    },
    server: { host: '127.0.0.1', port: 3000, strictPort: true },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    build: {
      outDir: 'build',
      assetsDir: 'static',
      cssCodeSplit: false,
      target: ['chrome87', 'edge88', 'firefox78', 'safari14'],
    },
    test: {
      environment: 'jsdom',
      environmentOptions: { jsdom: { url: 'http://localhost/' } },
      include: ['src/**/*.test.{js,jsx}'],
    },
  };
});
