"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          input: ({ checked, ...props }) => (
            <input
              {...props}
              checked={checked}
              readOnly
              className={checked ? "line-through opacity-50" : ""}
            />
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="marker:text-zinc-400">
              {children}
            </li>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-zinc-100 px-3 py-2 text-left font-semibold text-zinc-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t border-zinc-200 px-3 py-2 text-zinc-600">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
