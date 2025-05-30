import React from 'react'
import Card from './Card'

export default function TextInputCard({ text, onChange }) {
  return (
    <Card title="Paste Transcript">
      <textarea
        value={text}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste your transcript text here..."
        className="w-full h-64 p-4 border bg-white rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
    </Card>
  )
}