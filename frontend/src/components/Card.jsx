import React from 'react'

export default function Card({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-lg shadow p-6 flex flex-col">
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      <div className="flex-1">{children}</div>
    </div>
  )
}