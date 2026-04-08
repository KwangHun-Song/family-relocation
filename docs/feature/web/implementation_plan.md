# 웹서비스 — 구현 계획

> 최종 업데이트: 2026-04-09  
> 리뷰 반영: `review/review.md` (2026-04-09)

---

## 구현 전략

- 병렬 실행 가능한 태스크는 동시에 진행
- T1(초기화)만 수동 진행, 이후 에이전트 실행
- 각 단계 완료 후 빌드 오류 없음 확인

---

## 단계별 구현 계획

### T1 — 프로젝트 초기화 (순차, 수동)

**담당:** 직접 실행  
**완료 기준:** `web/` 폴더에서 `npm run dev` 실행 시 기본 페이지 뜸

```bash
cd C:/Users/overg/Projects/family-relocation
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

- [ ] `web/` 폴더 생성 및 Next.js 15 초기화 (Tailwind v4 기본 설치)
- [ ] 루트에 `vercel.json` 생성 (`rootDirectory: web`)
- [ ] `web/.gitignore`에 `content/` 추가
- [ ] 불필요한 기본 파일 제거 (`app/page.tsx` 초기화)

---

### T2-A — Auth 설정 (T1 완료 후)

**담당:** executor 에이전트  
**완료 기준:** `/api/auth/signin` 접근 시 Google 로그인 버튼 표시, 미인증 요청 시 자동 리다이렉트

- [ ] `next-auth@beta` 설치
- [ ] `lib/auth.ts` 작성 (Google Provider + ALLOWED_EMAILS 검증)
- [ ] `app/auth/[...nextauth]/route.ts` 작성
- [ ] `app/layout.tsx`에 SessionProvider 추가
- [ ] `middleware.ts` 작성 — Edge Middleware로 모든 요청에 JWT 검증, 미인증 시 `/api/auth/signin` 리다이렉트
- [ ] `.env.local.example` 작성 (실제 값 제외)

---

### T2-B — 마크다운 파싱 lib (T1 완료 후, T2-A와 병렬)

**담당:** executor 에이전트  
**완료 기준:** `readMarkdown()` 호출 시 파일 내용 반환, 빌드 오류 없음

- [ ] `react-markdown`, `remark-gfm` 설치
- [ ] `web/scripts/copy-content.js` 작성 — prebuild 시 루트의 마크다운 파일을 `web/content/`로 복사
- [ ] `package.json`에 `prebuild` 스크립트 추가 (`node scripts/copy-content.js`)
- [ ] `dev` 스크립트도 복사 선행 실행으로 수정
- [ ] `lib/categories.ts` 작성 — 영문 slug ↔ 한국어 폴더명 매핑 상수 정의
- [ ] `lib/markdown.ts` 작성 — `content/` 폴더 기준 `readMarkdown(relativePath)`
- [ ] `components/MarkdownRenderer.tsx` 작성
  - react-markdown + remark-gfm 사용
  - 체크박스 완료 항목 취소선 스타일
  - 테이블 스타일 (Tailwind v4 prose)

---

### T3 — 페이지 구현 (T2-A, T2-B 완료 후)

**담당:** executor 에이전트  
**완료 기준:** 각 URL 접근 시 마크다운 내용 렌더링 확인

- [ ] `app/page.tsx` — 홈 대시보드
  - 4개 카테고리 요약 카드 (현재상황.md 첫 몇 줄)
  - 전체 투두리스트 링크
- [ ] `app/todo/page.tsx` — 전체 투두리스트
  - `전체-투두리스트.md` 렌더링
- [ ] `app/[category]/page.tsx` — 카테고리별 뷰
  - `generateStaticParams()` 로 영문 slug 4개(`house`, `contract`, `loan`, `moving`) 정적 생성
  - `lib/categories.ts`의 매핑으로 slug → 한국어 폴더명 변환
  - 탭: 현재상황 / 투두리스트 / 진행사항
  - 각 탭 클릭 시 해당 마크다운 렌더링

---

### T4 — 레이아웃 & UI (T3와 병렬 가능)

**담당:** executor 에이전트  
**완료 기준:** 모바일/데스크탑 모두 레이아웃 정상

- [ ] `components/NavBar.tsx` — 상단 네비게이션
  - 홈 / 전체 투두리스트 / 카테고리 4개 링크
  - 로그인 사용자 이메일 표시 + 로그아웃 버튼
- [ ] `components/CategoryCard.tsx` — 홈 카드 컴포넌트
  - 카테고리명, 상태 뱃지 (완료/진행중/예정)
- [ ] `app/layout.tsx` 완성
  - Tailwind typography 플러그인 적용
  - 반응형 컨테이너

---

### T5 — Vercel 배포 (T3, T4 완료 후)

**담당:** 직접 실행  
**완료 기준:** 배포 URL 접근 시 Google 로그인 후 홈 페이지 표시

- [ ] Google Cloud Console — OAuth 2.0 클라이언트 ID 생성
- [ ] Vercel 프로젝트 연결 (`vercel link` 또는 대시보드)
- [ ] Vercel 환경 변수 설정
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - `AUTH_SECRET`
  - `ALLOWED_EMAILS`
- [ ] 첫 배포 실행 및 확인
- [ ] 배포 URL을 Google OAuth 리다이렉트 URI에 추가

---

## 의존성 다이어그램

```
T1 (초기화)
  ├→ T2-A (Auth)    ─┐
  └→ T2-B (lib/md)  ─┤→ T3 (페이지) ─┐
                      │                ├→ T5 (배포)
                      └→ T4 (레이아웃) ─┘
```

---

## 패키지 목록

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^5.0.0-beta",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/typography": "^0.5.0"
  }
}
```

> **참고:** Tailwind v4는 `tailwind.config.ts` 대신 CSS 파일 기반 설정 사용. `create-next-app@latest` 실행 시 자동 설치됨.

---

## Definition of Done

- [ ] `npm run build` 오류 없음
- [ ] Google 로그인 후 홈 페이지 접근 가능
- [ ] 허용되지 않은 이메일 로그인 차단 확인
- [ ] 4개 카테고리 페이지 마크다운 렌더링 정상
- [ ] 전체 투두리스트 페이지 정상
- [ ] 모바일 레이아웃 확인
- [ ] Vercel 배포 URL 정상 작동
