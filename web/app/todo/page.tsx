import { readMarkdown } from "@/lib/markdown"
import MarkdownRenderer from "@/components/MarkdownRenderer"

export const metadata = {
  title: "전체 투두리스트 | 이사 프로젝트",
}

export default function TodoPage() {
  const content = readMarkdown("전체-투두리스트.md")
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800">전체 투두리스트</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
