import React from 'react'
import { Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-6">
      <h1 className="text-4xl font-bold">🧠 MindMapper</h1>
      <p className="text-gray-600 text-lg">Turn any transcript or PDF into a smart concept map with summaries and quizzes.</p>
      <Link to="/upload" className="button">
        Upload File
      </Link>
    </div>
  )
}