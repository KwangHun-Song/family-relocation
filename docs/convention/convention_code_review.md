# 코드 리뷰 컨벤션

이 문서는 이 프로젝트에서 코드 리뷰를 진행하는 방법과 기준을 정의합니다.

---

## 1. 언제 리뷰하는가

| 상황 | 리뷰 필요 여부 |
|------|---------------|
| 새 기능 구현 완료 후 | ✅ 필수 |
| 버그 수정 후 | ✅ 필수 |
| 인증·보안 관련 코드 변경 | ✅ 필수 |
| 마크다운 문서만 변경 | 선택 |
| 설정 파일 소폭 변경 | 선택 |

---

## 2. 리뷰 전 체크리스트 (작성자)

코드 리뷰를 요청하기 전에 직접 확인합니다.

```
[ ] TypeScript 타입 검사 통과: npx tsc --noEmit
[ ] ESLint 오류 없음: npx eslint .
[ ] 빌드 성공: npm run build
[ ] 하드코딩된 비밀값(API 키, 비밀번호) 없음
[ ] console.log 제거됨
[ ] 새 기능에 대한 에러 처리 포함
```

---

## 3. 심각도 기준

| 등급 | 의미 | 조치 |
|------|------|------|
| **CRITICAL** | 보안 취약점, 데이터 손실 위험 | 즉시 수정 후 재리뷰 |
| **HIGH** | 기능 오동작, 빌드 실패, 인증 우회 가능성 | 머지 전 수정 필수 |
| **MEDIUM** | 유지보수성 저하, UX 문제, 보안 가드 미흡 | 수정 권장 |
| **LOW** | 스타일, 사소한 개선 제안 | 선택 |

> CRITICAL 또는 HIGH 항목이 있으면 머지하지 않습니다.

---

## 4. 리뷰 체크 항목

### 보안 (Security)

- [ ] 하드코딩된 시크릿 없음 (API 키, 토큰, 비밀번호)
- [ ] 사용자 입력이 검증됨 (서버 컴포넌트에서 `searchParams` 포함)
- [ ] 파일 경로 조작(Path Traversal) 방어 코드 있음
- [ ] 오류 메시지에 내부 경로·스택 트레이스 미노출
- [ ] 인증 미들웨어가 실제로 동작하는지 확인

### Next.js / React 특화 항목

- [ ] 미들웨어 파일명이 `middleware.ts`인지 확인
- [ ] Server Component / Client Component 경계가 올바른지 확인
- [ ] `searchParams`, `params`의 Promise await 처리 (Next.js 15+)
- [ ] `generateStaticParams`와 `dynamicParams` 설정 일관성
- [ ] 환경변수 접근 시 `NEXT_PUBLIC_` 접두사 규칙 준수

### 코드 품질

- [ ] 함수 크기 50줄 이하
- [ ] 파일 크기 800줄 이하
- [ ] 중첩 깊이 4단계 이하
- [ ] 에러 처리가 모든 레이어에 존재
- [ ] 타입 `any` 사용 없음

### 마크다운 / 콘텐츠

- [ ] `readMarkdown` 호출 시 try/catch 감싸기
- [ ] 파일 경로를 URL에 직접 노출하지 않음

---

## 5. 이 프로젝트의 주요 리뷰 포인트

### 인증 (Auth.js v5)

```ts
// lib/auth.ts
// ALLOWED_EMAILS 미설정 시 아무도 로그인 불가 → 배포 전 반드시 확인
const allowedEmails = process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim()) ?? []
```

- `ALLOWED_EMAILS` 환경변수가 Vercel에 설정되어 있는지 배포 전 확인
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` 설정 누락 확인

### 미들웨어

```ts
// middleware.ts (파일명 필수)
export { auth as default } from "@/lib/auth"
```

- 파일명이 반드시 `middleware.ts`여야 Next.js가 인식함
- matcher 패턴이 정적 파일을 제외하는지 확인

### 콘텐츠 복사 스크립트

```js
// scripts/copy-content.js
// prebuild 단계에서 실행됨
// CATEGORIES 배열이 lib/categories.ts와 동기화되어야 함
```

- `lib/categories.ts`의 `folder` 필드와 `scripts/copy-content.js`의 `CATEGORIES` 배열이 일치하는지 수동 확인 필요
- 새 카테고리 추가 시 두 파일 모두 업데이트

### 마크다운 경로 규칙

```
content/
  전체-투두리스트.md
  01-집-정하기/
    현재상황.md
    투두리스트.md
    진행사항.md
```

- 경로 구분자에 한글 폴더명 사용 (git, OS 인코딩 주의)
- Windows 환경에서 `path.sep`이 `\`임을 인지

---

## 6. 리뷰 방법 (Claude Code 사용)

### 로컬 리뷰 (커밋 전)

```
/code-review
```

Claude Code가 `git diff HEAD`를 기반으로 변경된 파일을 분석합니다.

### PR 리뷰

```
/code-review --pr <PR번호>
```

GitHub PR의 diff를 가져와 검토하고 인라인 코멘트를 작성합니다.

### 보안 집중 리뷰

```
/security-review
```

인증, 입력 검증, 경로 탐색, 환경변수 노출 등 보안 항목만 집중 검토합니다.

---

## 7. 리뷰 문서 저장

완료된 코드 리뷰는 아래 경로에 날짜 기준으로 저장합니다.

```
docs/feature/web/review/code-review-YYYY-MM-DD.md
```

문서 구조:
```markdown
# 코드 리뷰: <대상> (날짜)

**리뷰 대상**: 커밋 또는 PR
**결정**: APPROVE / REQUEST CHANGES / BLOCK

## 발견 사항
### HIGH
### MEDIUM
### LOW

## 검증 결과
## 다음 단계
```

---

## 8. 관련 컨벤션

- [convention_commit.md](convention_commit.md) — 커밋 메시지 규칙
- [convention_naming.md](convention_naming.md) — 파일·변수 네이밍
- [convention_feature_dev_workflow.md](convention_feature_dev_workflow.md) — 기능 개발 워크플로우
