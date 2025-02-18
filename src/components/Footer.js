import React from 'react';
import './../styles/Footer.css';

function Footer({ version }) {
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
      <a href="mailto:c99@kakao.com" className="footer-link">
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

export default Footer;
