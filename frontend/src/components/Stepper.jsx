import React from 'react'

export default function Stepper({ step }) {
  const steps = [
    { label: 'Input' },
    { label: 'Cache' },
    { label: 'Generate' },
    { label: 'Done' }
  ]

  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const idx = i + 1
        const status =
          step > idx ? 'completed' : step === idx ? 'active' : 'upcoming'
        const bg =
          status === 'completed'
            ? 'bg-indigo-600 text-white'
            : status === 'active'
            ? 'bg-indigo-200 text-indigo-800'
            : 'bg-gray-200 text-gray-600'

        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}
              >
                {idx}
              </div>
              <span
                className={`mt-1 text-xs ${
                  status === 'active' ? 'font-medium text-indigo-800' : ''
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > idx ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}