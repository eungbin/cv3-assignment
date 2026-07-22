# CV3 라방바 데이터랩 기술 과제

라방바 데이터랩의 라이브 방송과 홈쇼핑 방송 목록을 최대 10개씩 보여주는
웹 애플리케이션입니다.

현재는 React + Express 프로젝트 기반 설정까지 완료된 상태입니다. 전체 요구사항과
구현 설계, 다음 작업 순서는 [`PROJECT_PLAN.md`](./PROJECT_PLAN.md)를 참고하세요.

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

```bash
npm ci
npm run dev
```

- 웹: http://localhost:5173
- API 상태 확인: http://localhost:3001/api/health

`npm run dev`는 Vite 개발 서버와 Express API 서버를 함께 실행합니다.

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
