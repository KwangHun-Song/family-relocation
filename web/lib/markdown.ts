import fs from "fs"
import path from "path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export function readMarkdown(relativePath: string): string {
  const filePath = path.join(CONTENT_DIR, relativePath)
  if (!filePath.startsWith(CONTENT_DIR + path.sep) && filePath !== CONTENT_DIR) {
    return `> 콘텐츠를 불러올 수 없습니다.`
  }
  if (!fs.existsSync(filePath)) {
    return `> 콘텐츠를 불러올 수 없습니다.`
  }
  return fs.readFileSync(filePath, "utf-8")
}
