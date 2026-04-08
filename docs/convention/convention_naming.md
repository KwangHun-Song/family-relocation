# 네이밍 컨벤션

> 참고: 01-interview 프로젝트의 convention_naming.md를 이 프로젝트에 맞게 적용

---

## 문서 파일 (마크다운)

| 구분 | 규칙 | 예시 |
|------|------|------|
| 카테고리 폴더 | `숫자-한글명` | `01-집-정하기`, `04-이사하기` |
| 문서 파일 | 한글, 붙여쓰기 또는 `-` 구분 | `현재상황.md`, `투두리스트.md`, `작업계획.md` |
| 자료 파일 | 한글, `-` 구분 | `대출상품-비교표.md`, `후보-비교표.md` |
| 전체 문서 | 한글, `-` 구분 | `전체-투두리스트.md` |

## 웹 소스코드 파일

| 구분 | 규칙 | 예시 |
|------|------|------|
| 디렉토리 | `lowercase`, `kebab-case` | `app/`, `components/`, `app/todo-list/` |
| 컴포넌트 파일 | `PascalCase.tsx` | `TodoList.tsx`, `CategoryCard.tsx` |
| 유틸/lib 파일 | `camelCase.ts` | `markdownParser.ts`, `getFiles.ts` |
| 설정 파일 | `lowercase` | `tailwind.config.ts`, `next.config.ts` |
| 페이지 파일 | `page.tsx` (Next.js App Router 규칙) | `app/page.tsx`, `app/[category]/page.tsx` |

## 환경 변수

- 대문자 + `SCREAMING_SNAKE_CASE`
- 예: `AUTH_GOOGLE_ID`, `ALLOWED_EMAILS`

## docs/feature 폴더명

- `lowercase`, `kebab-case` (영어)
- 예: `docs/feature/web/`
