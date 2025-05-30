// src/pages/NewMap.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiHome, HiArrowLeft } from 'react-icons/hi'

import TextInputCard from '../components/TextInputCard'
import FileInputCard from '../components/FileInputCard'
import LoadingModal from '../components/LoadingModal'

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
        const res = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
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
        const supaRes = await fetch(`http://127.0.0.1:8000/get-cached-graph/${hash}`)
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
      const genRes = await fetch('http://127.0.0.1:8000/store-graph', {
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
    localStorage.setItem('latestGraph', JSON.stringify(graph))

    // Save to gallery
    const allMaps = JSON.parse(localStorage.getItem('galleryMaps') || '[]')
    const mapCard = {
      id: mapId,
      title: `Map ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      graph,
    }
    const updatedMaps = [mapCard, ...allMaps.filter(m => m.id !== mapId)]
    localStorage.setItem('galleryMaps', JSON.stringify(updatedMaps))

    setCurrentStep(4)
    await sleep(600)
    setShowModal(false)
    navigate(`/map/${mapId}`)  // 👈 change route to load specific map
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Mini header with back button */}
      <div className="flex items-center px-4 py-3 bg-white shadow">
      <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <HiArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <HiHome className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold">
          Create a New Mind Map
        </h1>
        <div className="w-8" /> {/* placeholder for right spacing */}
      </div>

      {/* Input Section: Centered Vertically */}
      <div className="flex flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-64px)]">
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
          className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
        >
          <span className="font-medium">Create Map</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-center mt-4 px-4">{error}</p>
      )}

      {/* In‑modal Stepper and spinner/check */}
      <LoadingModal show={showModal} currentStep={currentStep} />
    </div>
  )
}