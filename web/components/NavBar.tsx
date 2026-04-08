import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { CATEGORIES } from "@/lib/categories"

export default async function NavBar() {
  const session = await auth()

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-bold text-zinc-800 hover:text-zinc-600">
            🏠 이사 프로젝트
          </Link>
          <div className="hidden gap-4 sm:flex">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="text-sm text-zinc-500 hover:text-zinc-800"
              >
                {cat.label}
              </Link>
            ))}
            <Link href="/todo" className="text-sm text-zinc-500 hover:text-zinc-800">
              전체 투두
            </Link>
          </div>
        </div>
        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">{session.user.email}</span>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200"
              >
                로그아웃
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  )
}
