import React from 'react';
import { Link } from 'react-router-dom';

export default function TopBar({ shift, onMenuClick }) {
  return (
    <div
      className={`
        w-full
        bg-gray-900
        text-white
        fixed top-0 left-0
        z-20
        shadow
        transform transition-transform duration-300 ease-in-out
        ${shift ? 'translate-x-64' : 'translate-x-0'}
      `}
    >
      <div className="grid grid-cols-3 items-center px-4 py-3">
        {/* Hamburger */}
        <button
          onClick={onMenuClick}
          className="justify-self-start p-2 hover:bg-gray-800 rounded"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center title */}
        <div className="justify-self-center text-xl font-bold">
          MindMapper
        </div>

        {/* Nav links */}
        <div className="justify-self-end space-x-4">
          <Link to="/newmap" className="hover:underline text-sm">New Map</Link>
          <Link to="/mymaps" className="hover:underline text-sm">My Maps</Link>
        </div>
      </div>
    </div>
  );
}