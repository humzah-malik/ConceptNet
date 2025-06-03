// src/pages/NewMap.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiHome, HiArrowLeft } from 'react-icons/hi'
import { BASE_URL } from '../api'
import TextInputCard from '../components/TextInputCard'
import FileInputCard from '../components/FileInputCard'
import LoadingModal from '../components/LoadingModal'
import Layout from '../components/Layout'

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}

export default function NewMap() {
  const [text, setText] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const navigate = useNavigate()

  const handleCreateMap = async () => {
    setError(null)
    setShowModal(true)

    // STEP 1: Upload/Input
    setCurrentStep(1)
    await sleep(800)

    let transcript = text.trim()
    if (!transcript && uploadedFile) {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      const endpoint = uploadedFile.name.endsWith('.pdf')
        ? 'upload-pdf'
        : uploadedFile.name.endsWith('.docx')
        ? 'upload-docx'
        : null

      if (endpoint) {
        const res = await fetch(`${BASE_URL}/${endpoint}`, {
          method: 'POST',
          body: formData
        })
        if (res.ok) {
          const data = await res.json()
          transcript = data.transcript
        }
      } else {
        transcript = await uploadedFile.text()
      }
    }
    if (!transcript) {
      setError('No transcript or file provided')
      setShowModal(false)
      return
    }

    // STEP 2: Checking Cache
    setCurrentStep(2)
    await sleep(800)

    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(transcript))
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    let graph = null
    const cached = localStorage.getItem(hash)
    if (cached) {
      graph = JSON.parse(cached)
    } else {
      try {
        const supaRes = await fetch(`${BASE_URL}/get-cached-graph/${hash}`)
        if (supaRes.ok) {
          graph = await supaRes.json()
        }
      } catch (e) {
        console.error(e)
      }
    }

    // STEP 3: Generating Map
    setCurrentStep(3)
    await sleep(800)

    if (!graph) {
      const genRes = await fetch(`${BASE_URL}/store-graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      })
      if (!genRes.ok) {
        setError('Failed to generate concept map')
        setShowModal(false)
        return
      }
      graph = await genRes.json()
      localStorage.setItem(hash, JSON.stringify(graph))
    }

    // STEP 4: Done!
    const mapId = hash
    const graphWithTranscript = { ...graph, transcript }
    localStorage.setItem('latestGraph', JSON.stringify(graphWithTranscript))

    // Save to gallery
    const allMaps = JSON.parse(localStorage.getItem('galleryMaps') || '[]')
    const mapCard = {
      id: mapId,
      title: `Map ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      graph: graphWithTranscript,
    }
    const updatedMaps = [mapCard, ...allMaps.filter(m => m.id !== mapId)]
    localStorage.setItem('galleryMaps', JSON.stringify(updatedMaps))

    setCurrentStep(4)
    await sleep(600)
    setShowModal(false)
    navigate(`/map/${mapId}`)
  }

  return (
    <Layout>
    <div className="relative min-h-screen">
      {/* Mini header with back button */}
      <div className="flex items-center px-4 py-4 bg-transparent shadow-none backdrop-blur-md">
      <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <HiArrowLeft className="w-6 h-6 text-gray-700 dark:text-white" />
        </button>
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <HiHome className="w-6 h-6 text-gray-700 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-gray-800 dark:text-gray-100">
          Create a New Mind Map
        </h1>
        <div className="w-8" /> {/* placeholder for right spacing */}
      </div>

      {/* Input Section: Centered Vertically */}
      <div className="flex flex-col items-center justify-center px-4 py-12 min-h-[calc(100vh-64px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
          <TextInputCard text={text} onChange={setText} />
          <FileInputCard
            file={uploadedFile}
            onFileChange={f => setUploadedFile(f)}
            onClear={() => setUploadedFile(null)}
          />
        </div>

        {/* Create Map Button Centered Underneath */}
        <button
          onClick={handleCreateMap}
          disabled={showModal}
          className="mt-8 btn btn-indigo shadow-lg flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white"
        >
          <span>Create Map</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-center mt-4 px-4">{error}</p>
      )}

      {/* In‑modal Stepper and spinner/check */}
      <LoadingModal show={showModal} currentStep={currentStep} />
    </div>
    </Layout>
  )
}