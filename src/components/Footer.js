import React from 'react';
import '../styles/Footer.css';

function Footer({
  version,
  rankingFetchedAt,
  openReleaseNotesModal,
  openAnnouncementModal,
}) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <span>
          © c99 <span className="footer-dot">·</span> 칼바람 랜덤 픽
        </span>
        <div className="footer-nav">
          <button onClick={openAnnouncementModal}>공지사항</button>
          <button onClick={openReleaseNotesModal}>업데이트 내역</button>
          <a href="mailto:c99@kakao.com">문의 ↗</a>
        </div>
      </div>
      <div className="footer-sources">
        <span>
          패치{' '}
          <a
            href="https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/"
            target="_blank"
            rel="noreferrer"
          >
            {version}
          </a>
        </span>
        <span>
          데이터{' '}
          <a
            href="https://developer.riotgames.com/"
            target="_blank"
            rel="noreferrer"
          >
            Riot Games
          </a>{' '}
          · 통계{' '}
          <a
            href="https://lol.ps/aram-statistics/"
            target="_blank"
            rel="noreferrer"
          >
            lol.ps
          </a>
          {rankingFetchedAt &&
            ` (조회 ${new Date(rankingFetchedAt).toLocaleDateString('ko-KR')})`}
        </span>
      </div>
      <p className="legal">
        Riot Games 및 관련 자산의 상표권은 Riot Games에 있습니다. 이 서비스는
        Riot Games의 공식 서비스가 아닙니다.
      </p>
    </footer>
  );
}
export default React.memo(Footer);
