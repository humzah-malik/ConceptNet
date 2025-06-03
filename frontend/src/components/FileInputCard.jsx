import React, { useState } from 'react'
import Card from './Card'

export default function FileInputCard({ file, onFileChange, onClear }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      onFileChange(droppedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <Card title="Upload File">
      {file ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl shadow-md
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-600
        text-gray-800 dark:text-gray-100">      
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Uploaded</p>
          <button
            onClick={onClear}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
  htmlFor="file-input"
  className={`flex flex-col items-center justify-center h-64 rounded-xl shadow-md transition cursor-pointer
    border-2
    ${isDragging
      ? 'border-teal-400 bg-teal-50 dark:bg-[#103843] dark:border-teal-500'
      : 'bg-white dark:bg-[#0f1a1e] border-gray-200 dark:border-gray-600 hover:shadow-lg'}
  `}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  <span className="text-gray-600 dark:text-gray-300 text-center px-2">
    Click or drag to upload (PDF, TXT, DOCX)
  </span>
  <input
    id="file-input"
    type="file"
    accept=".pdf,.txt,.docx"
    className="hidden"
    onChange={e => onFileChange(e.target.files[0])}
  />
</label>
      )}
    </Card>
  )
}