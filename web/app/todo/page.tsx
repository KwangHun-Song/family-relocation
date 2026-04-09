import { readMarkdown } from "@/lib/markdown"
import MarkdownRenderer from "@/components/MarkdownRenderer"

export const metadata = {
  title: "전체 투두리스트 | 이사 프로젝트",
}

export default function TodoPage() {
  let content: string
  try {
    content = readMarkdown("전체-투두리스트.md")
  } catch {
    content = "> 투두리스트를 불러올 수 없습니다."
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">전체 투두리스트</h1>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
