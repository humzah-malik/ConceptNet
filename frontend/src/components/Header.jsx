// src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiHome } from 'react-icons/hi';

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center px-4 py-3 bg-transparent shadow-none backdrop-blur-md">
      <div className="flex space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/20 transition"
        >
          <HiArrowLeft className="w-5 h-5 text-gray-800 dark:text-gray-100" />
        </button>
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-white/20 transition"
        >
          <HiHome className="w-5 h-5 text-gray-800 dark:text-gray-100" />
        </button>
      </div>
      {/* Center: Title */}
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        MindMapper
      </h1>
      {/* Right: Spacer (or future icons) */}
      <div className="w-10" />
    </div>
  );
}