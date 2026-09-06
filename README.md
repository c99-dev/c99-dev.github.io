# 칼바람 랜덤 픽 - 롤 ARAM 챔피언 선택기

https://칼바람랜덤픽.메인.한국

![image](https://github.com/user-attachments/assets/b4cbbde8-f60d-44f7-a9eb-5a1d673632f7)

![image](https://github.com/user-attachments/assets/767b1c21-b110-4857-8b83-bb57d8a5916b)

![image](https://github.com/user-attachments/assets/a7d16d3d-57c3-4560-a6d2-cc5ccf86dbb9)

- React 18
- Vite / Vitest
- React Modal
- React GA4
- GitHub Pages

## 🎲 주요 기능

- 팀별 랜덤 챔피언 선택 (기본 15개)
- 챔피언 정렬 (티어순/이름순/무작위)
- 챔피언 개별 리롤 기능
- 챔피언 밴/언밴 시스템
- 이미지/텍스트 복사 기능

## 📊 데이터 제공

- 챔피언 티어 정보
- 챔피언 승률 통계
- 스크립트로 최신 패치 데이터 갱신
- Riot Games DDragon API 연동

## ⚙️ 커스텀 설정

- 팀별 표시 챔피언 수 조절
- 티어/승률/순위 표시 여부 설정
- 챔피언 정렬 방식 선택
- 밴 목록 저장 기능

## 🔄 데이터 업데이트

```powershell
npm ci
python -m pip install -r scripts/requirements.txt
npm run fetch-data
npm run validate-data
npm run test:data
npm test
npm run deploy
```

`fetch-data`는 한국 서버 Data Dragon 버전, 챔피언 JSON, 이미지와 lol.ps ARAM 통계를 임시 폴더에 수집합니다. 모든 다운로드와 검증이 성공해야 기존 데이터를 갱신합니다. 통계 집계 패치는 제공처 기준이며, 수집 시각과 출처는 `version.json`에 기록합니다.

`deploy`는 저장된 데이터를 검증하고 빌드한 결과를 GitHub Pages에 배포합니다. 외부 데이터 갱신은 자동 실행하지 않으므로, 디자인이나 기능만 수정했을 때도 같은 데이터로 재배포할 수 있습니다.

현재 앱은 배포된 로컬 JSON을 사용합니다. 랭킹 조회만 실패하면 티어 정보 없이 추첨을 사용할 수 있습니다. 밴 변경은 다음 추첨부터 적용되며, 후보가 부족하면 기존 결과를 유지하고 안내합니다.

## 개발 및 검증

Node.js 22.13 이상인 22 LTS 또는 24 LTS를 사용합니다. `npm ci`로 잠긴 의존성을 설치하고, `npm start`로 개발 서버를 실행합니다. `npm test`는 전체 회귀 테스트를 한 번 실행하며, 작업 중에는 `npm run test:watch`를 사용할 수 있습니다.

`npm run check`는 의존성 보안 검사, JavaScript/Python 테스트, 데이터 검증, 배포 빌드를 순서대로 실행합니다. `npm run preview`로 `build` 결과를 미리 확인할 수 있으며, 기존 `npm run deploy` 명령과 GitHub Pages 경로는 동일합니다.

기존 `.env`의 `REACT_APP_GA_TRACKING_ID`를 그대로 사용합니다. CSS와 데이터 파일은 빌드 도구 교체로 변경하지 않습니다.
