# 웹서비스 — 기술 설계

> 최종 업데이트: 2026-04-09

---

## 기술 스택

| 구분 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | SSG 지원, 파일 기반 라우팅, Vercel 최적화 |
| 인증 | Auth.js v5 (NextAuth) | Google OAuth 간편 통합, Next.js 15 호환 |
| 마크다운 렌더링 | react-markdown + remark-gfm | 테이블, 체크박스 등 GFM 문법 지원 |
| 스타일링 | Tailwind CSS | 빠른 반응형 UI 구성 |
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
│   │   │   └── page.tsx          ← 카테고리별 뷰 (01~04)
│   │   └── todo/
│   │       └── page.tsx          ← 전체 투두리스트
│   ├── components/
│   │   ├── MarkdownRenderer.tsx  ← react-markdown 래퍼
│   │   ├── CategoryCard.tsx      ← 홈 카테고리 카드
│   │   └── NavBar.tsx            ← 상단 네비게이션
│   ├── lib/
│   │   ├── auth.ts               ← Auth.js 설정 (이메일 허용 목록 검증)
│   │   └── markdown.ts           ← fs로 마크다운 파일 읽기
│   ├── public/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── vercel.json                   ← rootDirectory: web
└── docs/
```

---

## 데이터 흐름

```
git push
  └→ Vercel 빌드 트리거
       └→ Next.js SSG (빌드 시 fs로 마크다운 파일 읽기)
            └→ 정적 HTML 생성
                 └→ 사용자 요청 → Google OAuth 인증 → 페이지 렌더링
```

- 마크다운 파일은 빌드 시 `fs.readFileSync`로 읽는다
- 런타임 DB 조회 없음
- 콘텐츠 업데이트 = git push → 자동 재빌드

---

## 라우팅 구조

| URL | 파일 | 내용 |
|-----|------|------|
| `/` | `app/page.tsx` | 홈 대시보드 — 4개 카테고리 요약 카드 + 전체 투두 미리보기 |
| `/todo` | `app/todo/page.tsx` | `전체-투두리스트.md` 전체 렌더링 |
| `/01-집-정하기` | `app/[category]/page.tsx` | 현재상황, 투두리스트, 진행사항 탭 |
| `/02-계약하기` | `app/[category]/page.tsx` | 현재상황, 투두리스트, 진행사항 탭 |
| `/03-대출받기` | `app/[category]/page.tsx` | 현재상황, 투두리스트, 진행사항 탭 |
| `/04-이사하기` | `app/[category]/page.tsx` | 현재상황, 투두리스트, 진행사항 탭 |

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

### 접근 제어

- 모든 페이지: 로그인 필수
- 미로그인 시 Google OAuth 로그인 페이지로 리다이렉트
- `ALLOWED_EMAILS`에 없는 계정은 로그인 거부

---

## 마크다운 읽기 (`lib/markdown.ts`)

```typescript
import fs from "fs"
import path from "path"

const ROOT = path.join(process.cwd(), "..")  // web/ 기준 상위 = 프로젝트 루트

export function readMarkdown(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8")
}
```

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
