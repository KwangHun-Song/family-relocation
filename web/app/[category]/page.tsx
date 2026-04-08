import { notFound } from "next/navigation"
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories"
import { readMarkdown } from "@/lib/markdown"
import MarkdownRenderer from "@/components/MarkdownRenderer"

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ category: cat.slug }))
}

export const dynamicParams = false

const TABS = [
  { key: "현재상황.md", label: "현재 상황" },
  { key: "투두리스트.md", label: "투두리스트" },
  { key: "진행사항.md", label: "진행사항" },
]

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { category: slug } = await params
  const { tab = "현재상황.md" } = await searchParams

  const cat = getCategoryBySlug(slug)
  if (!cat) notFound()

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]
  const content = readMarkdown(`${cat.folder}/${activeTab.key}`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">{cat.label}</h1>
        <p className="mt-1 text-sm text-zinc-500">{cat.folder}</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-zinc-200">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/${slug}?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab.key === t.key
                ? "border-b-2 border-zinc-800 text-zinc-800"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
