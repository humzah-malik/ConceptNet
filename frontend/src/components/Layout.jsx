import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TopBar from './TopBar'
import Sidebar from './Sidebar'

export default function Layout({ sidebarOpen, toggleSidebar }) {
  const location = useLocation()

  // Hide TopBar for /newmap
  const hideTopBar = location.pathname === '/newmap' || location.pathname === '/' || location.pathname === '/maps'

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {!hideTopBar && <TopBar shift={sidebarOpen} onMenuClick={() => toggleSidebar(!sidebarOpen)} />}

      <div className="flex h-full pt-14">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => toggleSidebar(false)}
          onSave={() => alert('Coming soon')}
          onDelete={() => {
            localStorage.removeItem('latestGraph')
            alert('Map deleted')
          }}
        />

        <div
          className={`
            flex-1 
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-64' : 'translate-x-0'}
          `}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}