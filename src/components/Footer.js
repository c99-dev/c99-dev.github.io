import React, { useCallback } from 'react';
import './../styles/Footer.css';

function Footer({ version }) {
  const handleEmailClick = useCallback(async e => {
    e.preventDefault();
    const email = 'c99@kakao.com';

    try {
      await navigator.clipboard.writeText(email);

      // 임시 툴팁 표시
      const target = e.target;
      const originalText = target.textContent;
      target.textContent = '복사됨!';
      target.style.color = '#4caf50';

      setTimeout(() => {
        target.textContent = originalText;
        target.style.color = '';
      }, 1500);
    } catch (error) {
      console.error('이메일 복사 실패:', error);
      // 폴백: 기본 메일 클라이언트 열기
      window.location.href = `mailto:${email}`;
    }
  }, []);
  return (
    <footer className="footer">
      롤 패치 버전:{' '}
      <a
        href="https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        {version.split('.').slice(0, 2).join('.')}
      </a>{' '}
      | 오류 및 문의사항:{' '}
      <a
        href="mailto:c99@kakao.com"
        className="footer-link email-link"
        onClick={handleEmailClick}
        title="클릭하면 이메일 주소가 복사됩니다"
      >
        c99@kakao.com
      </a>{' '}
      | 통계 및 아이콘 출처:{' '}
      <a
        href="https://lol.ps/aram-statistics/"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        lol.ps
      </a>
      ,{' '}
      <a
        href="https://developer.riotgames.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        riotgames apis
      </a>
      <a> | © c99</a>
      <div>
        Riot Games, and all associated properties are trademarks or registered
        trademarks of Riot Games, Inc.
      </div>
    </footer>
  );
}

export default React.memo(Footer);
