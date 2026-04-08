# 웹서비스 — 기술 설계

> 최종 업데이트: 2026-04-09  
> 리뷰 반영: `review/review.md` (2026-04-09)

---

## 기술 스택

| 구분 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | SSG 지원, 파일 기반 라우팅, Vercel 최적화 |
| 인증 | Auth.js v5 (NextAuth) | Google OAuth 간편 통합, Next.js 15 호환 |
| 마크다운 렌더링 | react-markdown + remark-gfm | 테이블, 체크박스 등 GFM 문법 지원 |
| 스타일링 | Tailwind CSS v4 | create-next-app@latest 기본값, CSS 파일 기반 설정 |
| 배포 | Vercel | git push 자동 배포, Next.js 공식 호스팅 |
| 언어 | TypeScript | 타입 안정성 |

---

## 프로젝트 구조

```
family-relocation/
├── web/                          ← Next.js 프로젝트 루트
│   ├── app/
│   │   ├── layout.tsx            ← 루트 레이아웃 (인증 Provider 포함)
│   │   ├── page.tsx              ← 홈 대시보드
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      ← Auth.js 라우트 핸들러
│   │   ├── [category]/
│   │   │   └── page.tsx          ← 카테고리별 뷰 (영문 slug)
│   │   └── todo/
│   │       └── page.tsx          ← 전체 투두리스트
│   ├── components/
│   │   ├── MarkdownRenderer.tsx  ← react-markdown 래퍼
│   │   ├── CategoryCard.tsx      ← 홈 카테고리 카드
│   │   └── NavBar.tsx            ← 상단 네비게이션
│   ├── content/                  ← 빌드 전 복사된 마크다운 파일 (gitignore)
│   ├── lib/
│   │   ├── auth.ts               ← Auth.js 설정 (이메일 허용 목록 검증)
│   │   ├── markdown.ts           ← content/ 폴더에서 마크다운 파일 읽기
│   │   └── categories.ts         ← 영문 slug ↔ 한국어 폴더명 매핑
│   ├── middleware.ts              ← Edge Middleware (JWT 검증 및 리다이렉트)
│   ├── scripts/
│   │   └── copy-content.js       ← prebuild 시 마크다운 파일 복사 스크립트
│   ├── public/
│   ├── next.config.ts
│   └── package.json
├── vercel.json                   ← rootDirectory: web
└── docs/
```

---

## 데이터 흐름

### 빌드 타임

```
git push
  └→ Vercel 빌드 트리거
       └→ prebuild: copy-content.js 실행
            └→ 마크다운 파일 → web/content/ 복사
                 └→ Next.js SSG (fs로 content/ 읽기)
                      └→ 정적 HTML 생성 → Vercel CDN 배포
```

### 런타임 (사용자 요청)

```
사용자 요청
  └→ Edge Middleware (middleware.ts) — JWT 토큰 검증
       ├→ [미인증] /api/auth/signin 으로 리다이렉트 → Google OAuth
       └→ [인증됨] 정적 HTML 서빙 (Vercel CDN)
```

- 마크다운 파일은 빌드 시 `content/`로 복사 후 `fs.readFileSync`로 읽는다
- 런타임 파일 접근 없음 (정적 HTML 서빙)
- 콘텐츠 업데이트 = git push → 자동 재빌드

---

## 라우팅 구조 (영문 slug)

한국어 URL 인코딩 문제를 방지하기 위해 영문 slug를 사용하고, 내부에서 한국어 폴더명으로 매핑한다.

| URL | 파일 | 내용 |
|-----|------|------|
| `/` | `app/page.tsx` | 홈 대시보드 — 4개 카테고리 요약 카드 |
| `/todo` | `app/todo/page.tsx` | `전체-투두리스트.md` 전체 렌더링 |
| `/house` | `app/[category]/page.tsx` | 01-집-정하기: 현재상황, 투두리스트, 진행사항 |
| `/contract` | `app/[category]/page.tsx` | 02-계약하기: 현재상황, 투두리스트, 진행사항 |
| `/loan` | `app/[category]/page.tsx` | 03-대출받기: 현재상황, 투두리스트, 진행사항 |
| `/moving` | `app/[category]/page.tsx` | 04-이사하기: 현재상황, 투두리스트, 진행사항 |

### 카테고리 매핑 (`lib/categories.ts`)

```typescript
export const CATEGORIES = [
  { slug: "house",    folder: "01-집-정하기",  label: "집 정하기" },
  { slug: "contract", folder: "02-계약하기",   label: "계약하기" },
  { slug: "loan",     folder: "03-대출받기",   label: "대출 받기" },
  { slug: "moving",   folder: "04-이사하기",   label: "이사하기" },
] as const

export type CategorySlug = typeof CATEGORIES[number]["slug"]
```

---

## 마크다운 파일 배포 전략

### 문제

`vercel.json`의 `rootDirectory: "web"` 설정으로 인해 Vercel 빌드 컨테이너에는 `web/` 하위 파일만 존재한다. 빌드 시 상위 폴더(`../`)의 마크다운 파일에 접근할 수 없다.

### 해결: prebuild 복사 스크립트 (A안)

빌드 전 마크다운 파일을 `web/content/`로 복사한다.

#### `web/scripts/copy-content.js`

```javascript
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "../..")
const DEST = path.join(__dirname, "../content")
const CATEGORIES = ["01-집-정하기", "02-계약하기", "03-대출받기", "04-이사하기"]

fs.mkdirSync(DEST, { recursive: true })
fs.copyFileSync(
  path.join(ROOT, "전체-투두리스트.md"),
  path.join(DEST, "전체-투두리스트.md")
)
CATEGORIES.forEach(cat => {
  fs.mkdirSync(path.join(DEST, cat), { recursive: true })
  ;["현재상황.md", "투두리스트.md", "진행사항.md"].forEach(file => {
    const src = path.join(ROOT, cat, file)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DEST, cat, file))
    }
  })
})

console.log("✅ content/ 복사 완료")
```

#### `web/package.json` scripts

```json
{
  "scripts": {
    "prebuild": "node scripts/copy-content.js",
    "build": "next build",
    "dev": "node scripts/copy-content.js && next dev"
  }
}
```

#### `web/content/` gitignore 처리

```
# web/.gitignore
content/
```

### 마크다운 읽기 (`lib/markdown.ts`)

```typescript
import fs from "fs"
import path from "path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export function readMarkdown(relativePath: string): string {
  return fs.readFileSync(path.join(CONTENT_DIR, relativePath), "utf-8")
}
```

---

## 인증 설계

### Auth.js v5 설정 (`lib/auth.ts`)

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ user }) {
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") ?? []
      return allowedEmails.includes(user.email ?? "")
    },
  },
})
```

### Edge Middleware (`middleware.ts`)

```typescript
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

### 접근 제어

- 모든 페이지: 로그인 필수 (Middleware가 요청마다 JWT 검증)
- 미로그인 시 Google OAuth 로그인 페이지로 리다이렉트
- `ALLOWED_EMAILS`에 없는 계정은 로그인 거부

---

## 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | `xxxxx.apps.googleusercontent.com` |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxx` |
| `AUTH_SECRET` | Auth.js 세션 암호화 키 | `openssl rand -base64 32` 생성 |
| `ALLOWED_EMAILS` | 접근 허용 이메일 (쉼표 구분) | `user1@gmail.com,user2@gmail.com` |

---

## Vercel 배포 설정

### `vercel.json` (프로젝트 루트)

```json
{
  "rootDirectory": "web"
}
```

### Google Cloud Console 설정

- OAuth 2.0 클라이언트 ID 생성
- 승인된 리다이렉트 URI: `https://{vercel-domain}/api/auth/callback/google`
- 로컬 개발: `http://localhost:3000/api/auth/callback/google`

---

## UI 방향

- 모바일 우선 반응형 디자인
- 체크박스 항목: 완료 시 취소선 스타일 적용
- 카테고리 카드: 진행 상태 뱃지 표시 (완료/진행중/예정)
- 다크모드: 선택적 (초기 버전 미지원)
