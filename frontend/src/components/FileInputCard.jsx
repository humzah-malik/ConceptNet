import React from 'react'
import Card from './Card'

export default function FileInputCard({ file, onFileChange, onClear }) {
  return (
    <Card title="Upload File">
      {file ? (
        <div className="flex flex-col items-center justify-center h-64
        bg-white border border-gray-200 rounded-xl shadow-md">
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500 mt-1">Uploaded</p>
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
          className="flex flex-col items-center justify-center h-64
    bg-white border border-gray-200 rounded-xl shadow-md
    hover:shadow-lg transition cursor-pointer"
        >
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-gray-600">Click or drag to upload (PDF, TXT, DOCX)</span>
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