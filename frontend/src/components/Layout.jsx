import React from 'react'
import ThemeToggle from './ThemeToggle'
import Background from './Background'

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />
      <main className="relative z-10">{children}</main>
      <ThemeToggle />
    </div>
  )
}