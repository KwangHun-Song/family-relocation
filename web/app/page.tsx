import Link from "next/link"
import { CATEGORIES } from "@/lib/categories"
import CategoryCard from "@/components/CategoryCard"
import { readMarkdown } from "@/lib/markdown"

export default function Home() {
  let todoPreview = ""
  try {
    const raw = readMarkdown("전체-투두리스트.md")
    const lines = raw.split("\n")
    const urgentStart = lines.findIndex((l) => l.includes("🔴"))
    if (urgentStart !== -1) {
      todoPreview = lines.slice(urgentStart, urgentStart + 12).join("\n")
    }
  } catch {
    // content/ 없을 경우 무시
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">가족 이사 프로젝트</h1>
        <p className="mt-1 text-sm text-zinc-500">잔금일 2026-05-22 · 관악현대 115동 601호</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          카테고리
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            🔴 긴급 할 일
          </h2>
          <Link href="/todo" className="text-xs text-zinc-400 underline hover:text-zinc-600">
            전체 보기 →
          </Link>
        </div>
        {todoPreview ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 whitespace-pre-wrap">
            {todoPreview}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-400">
            투두리스트를 불러올 수 없습니다. 빌드 후 확인해주세요.
          </div>
        )}
      </section>
    </div>
  )
}
