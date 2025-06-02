import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import ParticlesBackground from '../components/ParticlesBackground'

export default function Landing() {
  return (
    <Layout>
      <ParticlesBackground />
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-gray-800 dark:text-black">MindMapper</h1>
        <p className="text-gray-600 dark:text-black text-lg max-w-xl">
          Turn any transcript or PDF into a smart concept map with summaries and quizzes.
        </p>
        <div className="space-x-4">
        <Link to="/newmap" className="btn btn-indigo">Create Map</Link>
        <Link to="/maps" className="btn btn-amber">Gallery</Link>
        </div>
      </div>
    </Layout>
  )
}