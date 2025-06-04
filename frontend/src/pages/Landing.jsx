import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import ParticlesBackground from '../components/ParticlesBackground'

export default function Landing() {
  return (
    <Layout>
      <ParticlesBackground />
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">ConceptNet</h1>
        <p className="text-black dark:text-white text-lg max-w-xl">
        Transform transcripts into interactive learning maps
        </p>
        <div className="space-x-4">
        <Link to="/newmap" className="btn btn-indigo">Create Map</Link>
        <Link to="/maps" className="btn btn-amber">Gallery</Link>
        </div>
      </div>
    </Layout>
  )
}