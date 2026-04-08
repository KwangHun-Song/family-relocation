import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import NavBar from "@/components/NavBar"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "가족 이사 프로젝트",
  description: "이사 진행 상황 대시보드",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans antialiased">
        <NavBar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
