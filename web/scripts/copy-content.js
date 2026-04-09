/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "../..")
const DEST = path.join(__dirname, "../content")
const CATEGORIES = ["01-집-정하기", "02-계약하기", "03-대출받기", "04-이사하기"]

fs.mkdirSync(DEST, { recursive: true })

fs.copyFileSync(
  path.join(ROOT, "전체-투두리스트.md"),
  path.join(DEST, "전체-투두리스트.md")
)

CATEGORIES.forEach((cat) => {
  fs.mkdirSync(path.join(DEST, cat), { recursive: true })
  ;["현재상황.md", "투두리스트.md", "진행사항.md"].forEach((file) => {
    const src = path.join(ROOT, cat, file)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DEST, cat, file))
    }
  })
})

console.log("✅ content/ 복사 완료")
