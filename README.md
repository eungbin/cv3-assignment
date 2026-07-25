# CV3 라방바 데이터랩 기술 과제

라방바 데이터랩의 라이브 방송과 홈쇼핑 방송 목록을 최대 10개씩 보여주는
웹 애플리케이션입니다.

라이브 방송과 홈쇼핑 탭을 전환하면 라방바 데이터랩 과제 페이지에서 수집한 방송
정보를 테이블로 확인할 수 있습니다.

## 기술 스택

- React + TypeScript
- Vite
- Express
- Cheerio
- Tailwind CSS
- Vitest + Testing Library

## 요구 환경

- Node.js 22.12 이상
- npm 11 이상 권장

개발에 사용한 Node.js 버전은 `.nvmrc`에 기록되어 있습니다.

## 실행 방법

저장소를 복제한 뒤 프로젝트 디렉터리에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
git clone https://github.com/eungbin/cv3-assignment.git
cd cv3-assignment
npm ci
npm run dev
```

- 웹: http://localhost:5173
- API 상태 확인: http://localhost:3001/api/health

`npm run dev`는 Vite 개발 서버와 Express API 서버를 함께 실행합니다.

## 데이터 수집 방식

브라우저에서 원본 사이트를 직접 요청하지 않고 Express 서버가 라방바 데이터랩 과제
페이지를 가져옵니다. 서버는 Cheerio로 방송 테이블을 파싱한 뒤 화면에 필요한
텍스트만 JSON으로 반환합니다.

- 라이브 방송: `https://live.ecomm-data.com/assignment?type=lb`
- 홈쇼핑: `https://live.ecomm-data.com/assignment?type=hs`
- API: `GET /api/broadcasts?type=lb|hs`

라이브 방송 분류는 초기 HTML에 이름이 포함되지 않아 원본 사이트가 사용하는 공개
카테고리 메타데이터를 함께 조회해 표시합니다. 홈쇼핑 분류는 HTML에 표시된 값을
그대로 사용합니다.

각 유형은 원본 순서대로 최대 10개만 반환합니다. 과제 요구사항에 따라 페이지네이션은
구현하지 않았으며, 로그인해야 확인할 수 있는 값은 원본 화면과 동일하게 잠금
표시를 유지합니다.

원본 페이지 또는 카테고리 메타데이터를 가져오지 못하거나 예상한 테이블 구조와
다르면 임의의 대체 데이터를 표시하지 않고 오류를 반환합니다. 화면에서는 오류
메시지와 다시 시도 버튼을 제공합니다.

## 검증 명령

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

프로덕션 빌드를 로컬에서 실행하려면 다음 명령을 사용합니다.

```bash
npm run build
npm start
```

접속 주소는 http://localhost:3001 입니다.

## 구현 범위

과제에서 요구한 방송 목록에 집중하기 위해 다음 기능은 구현하지 않았습니다.

- 페이지네이션
- 로그인 및 잠금 해제
- 검색, 정렬, 필터
- 헤더, 푸터, 사이드바
- 데이터베이스와 영구 캐시

구현 배경과 세부 설계 결정은 [`PROJECT_PLAN.md`](./PROJECT_PLAN.md)를 참고하세요.
