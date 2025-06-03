import React from 'react'

export default function Card({ title, children }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col
  bg-white/60 dark:bg-[#0f1a1e]/60
  border border-teal-400/30
  backdrop-blur-sm shadow-md transition-colors duration-300">
    {title && <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 transition-colors">{title}</h2>}
      <div className="flex-1">{children}</div>
    </div>
  )
}