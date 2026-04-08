# 웹서비스 설계 검증 리뷰

> 작성일: 2026-04-09  
> 검토 대상: `docs/feature/web/concept.md`, `design.md`, `implementation_plan.md`

---

## 종합 평가

| 항목 | 평가 |
|------|------|
| 컨셉 | ✅ 명확하고 범위 적절 |
| 기술 스택 | ✅ 목적에 잘 맞음 |
| 설계 완성도 | ⚠️ 치명적 배포 이슈 1건 포함 |
| 구현 계획 | ✅ 단계 분리 및 병렬화 적절 |

---

## 🔴 치명적 이슈 (배포 불가)

### 1. Vercel 배포 시 마크다운 파일 미포함

**위치:** `design.md` — 마크다운 읽기 / Vercel 배포 설정

**문제:**
`vercel.json`에 `rootDirectory: "web"`을 설정하면 Vercel은 `web/` 폴더만 빌드 컨텍스트로 업로드한다.
따라서 `lib/markdown.ts`의 다음 코드는 로컬에서는 동작하지만 **Vercel 빌드 환경에서는 파일을 찾지 못한다.**

```typescript
const ROOT = path.join(process.cwd(), "..") // ← 상위 폴더 접근 불가
```

Vercel 빌드 컨테이너에는 `web/` 하위 파일만 존재하기 때문에, `../01-집-정하기/투두리스트.md` 경로가 존재하지 않아 빌드 시 에러가 발생하거나 빈 콘텐츠가 렌더링된다.

**해결 방안 (택 1):**

**A안 — 빌드 스크립트로 복사 (권장):**
```json
// web/package.json
{
  "scripts": {
    "prebuild": "node scripts/copy-content.js",
    "build": "next build"
  }
}
```
```javascript
// web/scripts/copy-content.js
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "../..")
const DEST = path.join(__dirname, "../content")
const CATEGORIES = ["01-집-정하기", "02-계약하기", "03-대출받기", "04-이사하기"]

fs.mkdirSync(DEST, { recursive: true })
fs.copyFileSync(path.join(ROOT, "전체-투두리스트.md"), path.join(DEST, "전체-투두리스트.md"))
CATEGORIES.forEach(cat => {
  fs.mkdirSync(path.join(DEST, cat), { recursive: true })
  ;["현재상황.md", "투두리스트.md", "진행사항.md"].forEach(file => {
    fs.copyFileSync(path.join(ROOT, cat, file), path.join(DEST, cat, file))
  })
})
```
이후 `lib/markdown.ts`의 `ROOT`를 `path.join(process.cwd(), "content")`로 변경.

**B안 — `vercel.json` 제거 + Vercel 대시보드에서 Root Directory 설정:**
프로젝트 루트 전체를 빌드 컨텍스트로 올리면 상위 파일 접근 가능.
단, 빌드 커맨드를 `cd web && npm run build`로 수동 지정 필요.

---

## 🟡 중간 이슈 (동작에 영향)

### 2. 한국어 URL 인코딩 미처리

**위치:** `design.md` — 라우팅 구조 / `implementation_plan.md` — T3

**문제:**
브라우저는 `/01-집-정하기`를 `/01-%EC%A7%91-%EC%A0%95%ED%95%98%EA%B8%B0`로 인코딩한다.
`generateStaticParams()`가 반환하는 값과 실제 URL이 불일치하면 404가 발생한다.

**해결:**
```typescript
// app/[category]/page.tsx
export function generateStaticParams() {
  return [
    { category: "01-%EC%A7%91-%EC%A0%95%ED%95%98%EA%B8%B0" },
    // ...
  ]
}
```
또는 영문 slug(`01-house`, `02-contract` 등)를 사용하고 내부에서 한국어 폴더명으로 매핑하는 방식이 더 안전하다.

---

### 3. Tailwind CSS 버전 불명확

**위치:** `implementation_plan.md` — 패키지 목록

**문제:**
`tailwindcss: "^3.0.0"`으로 명시되어 있으나, `create-next-app@latest`는 현재 Tailwind v4를 기본 설치한다.
Tailwind v4는 `tailwind.config.ts` 방식 대신 CSS 파일 기반 설정으로 완전히 변경되었으므로, 설계서의 `@tailwindcss/typography` 플러그인 적용 방법도 달라진다.

**해결:** 
- **v3 고수:** `create-next-app` 실행 후 `tailwindcss@3`으로 다운그레이드, `--no-tailwind` 후 수동 설치
- **v4 채택:** 설계서의 패키지 버전 수정, Typography 플러그인 설정 방식 업데이트 (`@tailwindcss/typography` → v4 방식)

---

### 4. 데이터 흐름 설명 불완전 — SSG + 인증 동작 미명시

**위치:** `design.md` — 데이터 흐름

**문제:**
현재 설계서의 흐름:
```
git push → Vercel 빌드 → SSG → 정적 HTML → 사용자 요청 → Google OAuth → 페이지 렌더링
```
이 흐름은 "정적 HTML을 먼저 생성한 뒤 인증을 한다"는 인상을 주나, 실제 동작은 다르다.

실제 동작:
1. Vercel 빌드 시 마크다운 → 정적 HTML 생성
2. 사용자 요청 시 **Edge Middleware**가 먼저 실행되어 JWT 토큰 확인
3. 미인증 → `/api/auth/signin`으로 리다이렉트
4. 인증 완료 → 정적 HTML 서빙

`middleware.ts`의 역할과 위치가 데이터 흐름에 빠져 있다.

**개선안:**
```
사용자 요청
  └→ Edge Middleware (JWT 검증)
       ├→ [미인증] Google OAuth 로그인 페이지로 리다이렉트
       └→ [인증됨] 정적 HTML 서빙 (Vercel CDN)
```

---

## 🟢 양호한 항목

### 컨셉 설계
- 범위 제외 항목이 명확히 정의됨 (편집 기능, DB, 관리자 페이지 없음)
- "마크다운이 단일 진실 소스" 원칙이 일관되게 유지됨

### 인증 설계
- `ALLOWED_EMAILS` 환경 변수 기반 화이트리스트 방식이 소규모 가족 서비스에 적합
- `user.email ?? ""` null 처리 포함

### 구현 순서
- T2-A(Auth)와 T2-B(마크다운 lib)의 병렬 실행 구조 적절
- Definition of Done 항목이 검증 가능한 수준으로 구체적

### 환경 변수 설계
- `AUTH_SECRET` 생성 명령어(`openssl rand -base64 32`)까지 명시 — 실수 방지

---

## 수정 우선순위 요약

| 우선순위 | 항목 | 작업 |
|----------|------|------|
| 🔴 P0 | 마크다운 파일 배포 미포함 | `prebuild` 복사 스크립트 추가 또는 Vercel 설정 변경 |
| 🟡 P1 | 한국어 URL 인코딩 | 영문 slug 매핑 또는 인코딩된 params 반환 |
| 🟡 P1 | Tailwind 버전 확정 | v3/v4 중 선택 후 설계서 반영 |
| 🟡 P2 | 데이터 흐름 보완 | Middleware 역할 명시 |
