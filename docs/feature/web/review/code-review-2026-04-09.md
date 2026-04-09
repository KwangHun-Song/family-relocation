# 코드 리뷰: 웹서비스 초기 구현 (2026-04-09)

**리뷰 대상**: 커밋 `57ee1d4` — `feat: 웹서비스 초기 구현 (Next.js 16 + Auth.js v5)`
**리뷰어**: Claude Sonnet 4.6 (자동 리뷰)
**리뷰 일시**: 2026-04-09
**결정**: ⚠️ REQUEST CHANGES

---

## 요약

전체적으로 구조는 간결하고 Next.js App Router 패턴을 잘 따르고 있습니다. 파일 크기와 함수 크기 모두 기준 이내이며, TypeScript 타입 검사는 통과했습니다. 다만 **미들웨어 파일명 문제(인증 우회 가능성)** 와 **ESLint 빌드 오류** 두 가지를 반드시 수정해야 합니다.

---

## 발견 사항

### HIGH

#### H1. `proxy.ts` — 미들웨어 파일명 오류 (인증 보호 미작동 가능)

| 항목 | 내용 |
|------|------|
| 파일 | `web/proxy.ts` |
| 심각도 | HIGH |

Next.js의 미들웨어는 프로젝트 루트에 **`middleware.ts`** 라는 이름으로 위치해야 자동으로 인식됩니다. 현재 파일명 `proxy.ts`는 Next.js가 미들웨어로 인식하지 않으므로, Google OAuth 인증 보호가 실제로 동작하지 않을 수 있습니다.

**수정 방법:**
```bash
# web/ 디렉토리에서
mv proxy.ts middleware.ts
```

```ts
// web/middleware.ts
export { auth as default } from "@/lib/auth"

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

> Next.js 16 AGENTS.md 가이드에 명시된 대로, 실제 동작을 반드시 로컬에서 검증할 것.

---

#### H2. `scripts/copy-content.js` — ESLint 오류 (빌드 CI 실패)

| 항목 | 내용 |
|------|------|
| 파일 | `web/scripts/copy-content.js:1-2` |
| 심각도 | HIGH |
| 오류 | `@typescript-eslint/no-require-imports` (2건) |

빌드 스크립트가 CommonJS `require()`를 사용하고 있어 TypeScript ESLint 규칙을 위반합니다. `eslint`를 CI에서 실행하면 빌드가 실패합니다.

**수정 방법 A — ESLint 예외 처리 (권장, 스크립트는 Node.js CJS가 자연스러움):**
```js
// web/scripts/copy-content.js 상단에 추가
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs")
const path = require("path")
```

**수정 방법 B — ESM으로 변환:**
```js
// copy-content.mjs 로 변환
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// ... 나머지 동일
```

---

### MEDIUM

#### M1. `lib/markdown.ts` — 경로 탐색(Path Traversal) 미검증

| 항목 | 내용 |
|------|------|
| 파일 | `web/lib/markdown.ts:6-12` |
| 심각도 | MEDIUM |

`readMarkdown(relativePath)`는 `relativePath`를 그대로 `path.join(CONTENT_DIR, relativePath)`에 사용합니다. 현재 호출자들은 모두 상수값으로 경로를 전달하고 있어 실제 위협은 낮지만, 함수 자체에 가드가 없어 향후 확장 시 경로 탈출(예: `../../etc/passwd`) 위험이 생깁니다.

**수정 방법:**
```ts
export function readMarkdown(relativePath: string): string {
  const filePath = path.join(CONTENT_DIR, relativePath)
  // CONTENT_DIR 밖으로 탈출하는 경로 차단
  if (!filePath.startsWith(CONTENT_DIR + path.sep) && filePath !== CONTENT_DIR) {
    return `> 허용되지 않은 경로입니다.`
  }
  if (!fs.existsSync(filePath)) {
    return `> 파일을 찾을 수 없습니다.`
  }
  return fs.readFileSync(filePath, "utf-8")
}
```

---

#### M2. `lib/markdown.ts` — 오류 메시지에 파일 경로 노출

| 항목 | 내용 |
|------|------|
| 파일 | `web/lib/markdown.ts:9` |
| 심각도 | MEDIUM |

```ts
return `> 파일을 찾을 수 없습니다: ${relativePath}`
```

`relativePath`가 렌더링된 UI에 그대로 표시됩니다. 서버 내부 파일 경로 구조가 사용자에게 노출됩니다.

**수정 방법:**
```ts
return `> 콘텐츠를 불러올 수 없습니다.`
```

---

#### M3. `components/MarkdownRenderer.tsx` — 체크박스 `className` 적용 오류

| 항목 | 내용 |
|------|------|
| 파일 | `web/components/MarkdownRenderer.tsx:17` |
| 심각도 | MEDIUM |

```tsx
className={checked ? "line-through opacity-50" : ""}
```

`line-through`는 텍스트에 적용되는 CSS 속성입니다. `<input type="checkbox">` 요소 자체에는 효과가 없습니다. 완료된 항목의 텍스트에 취소선을 표시하려면 부모 `<li>`에 적용해야 합니다.

**수정 방법:**
```tsx
// li 컴포넌트에서 checked 상태를 감지하는 방식으로 변경 필요
// 또는 input 대신 label을 wrapping하는 구조로 변경
li: ({ children, ...props }) => {
  // checked 여부는 children에서 input을 찾아야 함 (react-markdown 구조상 복잡)
  return <li {...props} className="marker:text-zinc-400">{children}</li>
},
```

현실적인 수정은 CSS로 처리하는 것이 더 간단합니다:
```css
/* prose 내 체크된 li 항목 취소선 처리 */
.prose li:has(input[type="checkbox"]:checked) {
  text-decoration: line-through;
  opacity: 0.5;
}
```

---

#### M4. `app/page.tsx` — 개인 정보(주소) 하드코딩

| 항목 | 내용 |
|------|------|
| 파일 | `web/app/page.tsx:23` |
| 심각도 | MEDIUM |

```tsx
<p className="mt-1 text-sm text-zinc-500">잔금일 2026-05-22 · 관악현대 115동 601호</p>
```

구체적인 주소와 날짜가 UI에 하드코딩되어 있습니다. 이 정보는 마크다운 콘텐츠에서 읽어오거나 환경 변수로 분리하는 것이 좋습니다.

**수정 방법:**
```ts
// lib/categories.ts 또는 별도 lib/config.ts
export const PROJECT_INFO = {
  settleDate: process.env.NEXT_PUBLIC_SETTLE_DATE ?? "2026-05-22",
  address: process.env.NEXT_PUBLIC_ADDRESS ?? "",
} as const
```

---

#### M5. `app/todo/page.tsx` — `readMarkdown` 오류 미처리

| 항목 | 내용 |
|------|------|
| 파일 | `web/app/todo/page.tsx:9` |
| 심각도 | MEDIUM |

`home/page.tsx`는 `try/catch`로 감싸고 있지만, `todo/page.tsx`는 예외 처리 없이 `readMarkdown`을 직접 호출합니다. 파일이 없을 때 오류 문자열이 마크다운으로 렌더링됩니다.

**수정 방법:**
```tsx
export default function TodoPage() {
  let content: string
  try {
    content = readMarkdown("전체-투두리스트.md")
  } catch {
    content = "> 투두리스트를 불러올 수 없습니다."
  }
  // ...
}
```

---

#### M6. `app/[category]/page.tsx` — 탭 URL에 `.md` 확장자 노출

| 항목 | 내용 |
|------|------|
| 파일 | `web/app/[category]/page.tsx:26` |
| 심각도 | MEDIUM |

현재 URL: `?tab=현재상황.md`  
파일 확장자가 URL 파라미터에 그대로 노출됩니다.

**수정 방법:**
```ts
const TABS = [
  { key: "현재상황", file: "현재상황.md", label: "현재 상황" },
  { key: "투두리스트", file: "투두리스트.md", label: "투두리스트" },
  { key: "진행사항", file: "진행사항.md", label: "진행사항" },
]
// URL: ?tab=현재상황 (깔끔)
// 내부: activeTab.file 로 파일 접근
```

---

### LOW

#### L1. 인증 미설정 시 조용한 실패

| 항목 | 내용 |
|------|------|
| 파일 | `web/lib/auth.ts:8` |
| 심각도 | LOW |

`ALLOWED_EMAILS` 미설정 시 `?? []` 폴백으로 빈 배열이 되어 아무도 로그인 불가. 명시적 경고 로그가 없어 디버깅이 어렵습니다.

---

#### L2. `loading.tsx` / `error.tsx` 부재

App Router에서 로딩 상태와 에러 경계가 없습니다. 파일이 없을 때 또는 렌더링 오류 시 사용자 피드백이 없습니다.

---

#### L3. `next.config.ts` 빈 설정

이미지 최적화, 번들 분석 등 필요한 설정을 고려해보세요. 현재는 사용하지 않는 빈 config입니다.

---

## 검증 결과

| 검사 항목 | 결과 |
|-----------|------|
| TypeScript (`tsc --noEmit`) | ✅ Pass |
| ESLint | ❌ Fail — `copy-content.js` 에러 2건 |
| 빌드 (`next build`) | 미실행 (ESLint 오류로 선행 조건 미충족) |
| 테스트 | 없음 (초기 구현 단계) |

---

## 리뷰된 파일 목록

| 파일 | 유형 |
|------|------|
| `web/proxy.ts` | 미들웨어 |
| `web/lib/auth.ts` | 인증 라이브러리 |
| `web/lib/categories.ts` | 카테고리 상수 |
| `web/lib/markdown.ts` | 파일 읽기 유틸 |
| `web/components/NavBar.tsx` | 컴포넌트 |
| `web/components/CategoryCard.tsx` | 컴포넌트 |
| `web/components/MarkdownRenderer.tsx` | 컴포넌트 |
| `web/app/layout.tsx` | 레이아웃 |
| `web/app/page.tsx` | 홈 페이지 |
| `web/app/todo/page.tsx` | 투두 페이지 |
| `web/app/[category]/page.tsx` | 카테고리 페이지 |
| `web/app/auth/[...nextauth]/route.ts` | Auth 라우트 |
| `web/scripts/copy-content.js` | 빌드 스크립트 |
| `web/package.json` | 의존성 |
| `web/next.config.ts` | Next.js 설정 |
| `web/.env.local.example` | 환경변수 예시 |

---

## 다음 단계

1. **즉시 수정** (HIGH): `proxy.ts` → `middleware.ts` 파일명 변경, `copy-content.js` ESLint 예외 처리
2. **권장 수정** (MEDIUM): 경로 탐색 가드, 오류 메시지 정리, 체크박스 스타일, 탭 URL 개선
3. **선택 수정** (LOW): `loading.tsx`, `error.tsx` 추가, 환경변수 유효성 검사 로그
