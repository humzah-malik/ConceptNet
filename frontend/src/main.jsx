import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import NewMap from './pages/NewMap.jsx'
import Gallery from './pages/Gallery.jsx'
import MapView from './pages/MapView.jsx'
import ShareView from './pages/ShareView.jsx'
import './index.css'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

const fontLink = document.createElement('link')
fontLink.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap'
fontLink.rel = 'stylesheet'
document.head.appendChild(fontLink)

const storedTheme = localStorage.getItem('theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Analytics />
    <SpeedInsights />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/newmap" element={<NewMap />} />
        <Route path="/maps" element={<Gallery />} />
        <Route path="/map/:id" element={<MapView />} />
        <Route path="/share/:id" element={<ShareView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)