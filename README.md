# 칼바람 랜덤 픽

[서비스 바로가기](https://칼바람랜덤픽.메인.한국/) · [프로젝트 리뷰](docs/REVIEW-2026-09-07.md)

친구들과 칼바람 내전을 할 때 두 팀의 챔피언 풀을 무작위로 구성하는 React 웹앱입니다.

## 기능

- 팀당 기본 15명, 두 팀 사이 중복 없는 추첨
- 개별 챔피언 리롤, 밴 검색·저장, 티어순·이름순·무작위 정렬
- 승률·전체 순위·티어 표시 옵션
- 화면에 표시한 순서대로 텍스트 복사
- 모바일에서도 두 팀을 나란히 담는 이미지 복사 (팀당 최대 15명)
- 데스크톱과 모바일에 맞춘 반응형 화면

밴으로 챔피언이 부족하면 같은 수의 인원으로 자동 조정합니다. 밴을 해제하면 설정한 인원이 복원됩니다. 티어순은 표시 순서만 바꾸며, 두 팀의 전력 균형을 보장하지 않습니다.

## 개발

Node.js 22에서 검증했습니다. 데이터 갱신에는 Python 3와 requests가 필요합니다.

```powershell
npm ci
python -m pip install -r scripts/requirements.txt
npm start
```

Google Analytics가 필요하면 .env.example을 참고해 .env에 REACT_APP_GA_TRACKING_ID를 설정합니다. 설정하지 않아도 추첨 기능은 동작합니다.

## 데이터 갱신

```powershell
npm run fetch-data
npm run validate-data
```

scripts/update_data.py가 기존 수집 스크립트를 순서대로 실행합니다.

1. fetch_champion_data.py: Riot 한국 서버 realm에서 현재 버전과 한국어 챔피언 정보 조회
2. fetch_ranking_data.py: lol.ps 공개 ARAM 통계 조회
3. fetch_champion_image.py: 해당 버전의 챔피언 이미지 다운로드
4. validate_data.py: JSON 버전·데이터 수·이미지 형식 확인

임시 디렉터리에서 수집과 검증을 마친 뒤 public에 반영하므로 네트워크 또는 원본 구조 오류가 발생하면 기존 데이터를 유지합니다. HTTP 요청에는 타임아웃과 제한된 재시도가 적용됩니다.

게임의 패치 표기와 Data Dragon 버전은 다릅니다. 이번 갱신은 게임 패치 **26.17**, Data Dragon **16.17.1**입니다. 통계는 lol.ps의 집계 기준을 따르며 version.json에 조회 시각을 기록합니다. 브라우저는 배포된 JSON을 읽으므로 데이터는 실시간으로 바뀌지 않습니다.

## 검증과 배포

```powershell
npm run lint
npm test -- --watchAll=false --runInBand
npm run test:scripts
npm run validate-data
npm run deploy
```

npm run deploy는 검증과 production 빌드 후 build를 기존 저장소의 gh-pages 브랜치로 게시합니다. public/CNAME의 사용자 도메인을 유지합니다. 배포 중 데이터를 다시 수집하지 않으므로 먼저 fetch-data를 실행해 검증한 데이터를 배포할 수 있습니다.

## 현재 개선 과제

CRA/react-scripts 5의 오래된 간접 의존성이 남아 있습니다. 호환 범위의 보안 업데이트를 적용했지만 npm audit가 아직 31개 항목을 보고합니다. 강제 업데이트 대신 빌드 도구 교체를 별도 작업으로 진행하는 것이 적절합니다. 상세 근거와 검증 범위는 [리뷰 문서](docs/REVIEW-2026-09-07.md)를 참고하세요.

데이터: [Riot Games](https://developer.riotgames.com/) · 통계: [lol.ps](https://lol.ps/aram-statistics/)
