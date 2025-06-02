import React from 'react'
import Stepper from './Stepper'
import { HiCheckCircle } from 'react-icons/hi'

export default function LoadingModal({ show, currentStep }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-80 p-6 transition-all">
      <Stepper step={currentStep} />

        {currentStep < 4 && (
        <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 border-solid"></div>
        </div>
        )}

        {currentStep < 4 ? (
        <p className="text-center text-gray-600 mt-4">
            {currentStep === 1 && 'Uploading and reading transcript...'}
            {currentStep === 2 && 'Checking cache and preparing map...'}
            {currentStep === 3 && 'Generating graph, summaries, and quizzes...'}
        </p>
        ) : (
        <div className="flex flex-col items-center mt-4">
            <HiCheckCircle className="w-12 h-12 text-green-500" />
            <p className="mt-2 font-medium text-gray-700">All done!</p>
        </div>
        )}

      </div>
    </div>
  )
}