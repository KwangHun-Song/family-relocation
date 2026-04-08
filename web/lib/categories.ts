export const CATEGORIES = [
  { slug: "house",    folder: "01-집-정하기",  label: "집 정하기",  status: "완료" },
  { slug: "contract", folder: "02-계약하기",   label: "계약하기",   status: "진행중" },
  { slug: "loan",     folder: "03-대출받기",   label: "대출 받기",  status: "완료" },
  { slug: "moving",   folder: "04-이사하기",   label: "이사하기",   status: "예정" },
] as const

export type CategorySlug = typeof CATEGORIES[number]["slug"]

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)
}
