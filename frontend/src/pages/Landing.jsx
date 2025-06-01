import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-6 bg-white">
      <h1 className="text-5xl font-extrabold">MindMapper</h1>
      <p className="text-gray-600 text-lg max-w-xl">
        Turn any transcript or PDF into a smart concept map with summaries and quizzes.
      </p>
      <div className="space-x-4">
        <Link to="/newmap" className="inline-block rounded-md px-6 py-3 bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
          Create Map
        </Link>
        <Link to="/maps" className="inline-block rounded-md px-6 py-3 bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition">
          My Maps
        </Link>
      </div>
    </div>
  )
}