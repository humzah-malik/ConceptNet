import React, { useEffect, useState } from 'react'
import { HiMoon, HiSun } from 'react-icons/hi'

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return stored ? stored === 'dark' : systemPrefersDark
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(prev => !prev)}
          className="sr-only peer"
        />
        {/* Slider track */}
        <div className="w-14 h-8 bg-gray-300 dark:bg-slate-700 rounded-full peer-checked:bg-amber-500 transition-all duration-300"></div>

        {/* Thumb knob */}
        <div className="absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 peer-checked:translate-x-6 flex items-center justify-center">
          {darkMode ? (
            <HiMoon className="text-slate-800 w-4 h-4" />
          ) : (
            <HiSun className="text-yellow-500 w-4 h-4" />
          )}
        </div>
      </label>
    </div>
  )
}
