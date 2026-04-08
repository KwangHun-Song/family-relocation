import fs from "fs"
import path from "path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export function readMarkdown(relativePath: string): string {
  const filePath = path.join(CONTENT_DIR, relativePath)
  if (!fs.existsSync(filePath)) {
    return `> 파일을 찾을 수 없습니다: ${relativePath}`
  }
  return fs.readFileSync(filePath, "utf-8")
}
