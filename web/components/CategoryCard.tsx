import Link from "next/link"
import { CATEGORIES } from "@/lib/categories"

const statusConfig: Record<string, { label: string; className: string }> = {
  완료: { label: "완료", className: "bg-green-100 text-green-700" },
  진행중: { label: "진행 중", className: "bg-yellow-100 text-yellow-700" },
  예정: { label: "예정", className: "bg-blue-100 text-blue-700" },
}

export default function CategoryCard({
  category,
}: {
  category: (typeof CATEGORIES)[number]
}) {
  const status = statusConfig[category.status] ?? statusConfig["예정"]
  return (
    <Link
      href={`/${category.slug}`}
      className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">{category.label}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">{category.folder}</p>
    </Link>
  )
}
