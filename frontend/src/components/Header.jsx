import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiHome, HiArrowLeft } from 'react-icons/hi';

export default function Header({ title }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center px-4 py-3 bg-white shadow">
      <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded">
        <HiArrowLeft className="w-6 h-6 text-gray-700" />
      </button>
      <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded">
        <HiHome className="w-6 h-6 text-gray-700" />
      </button>
      <h1 className="flex-1 text-center text-xl font-semibold">{title}</h1>
      <div className="w-8" /> {/* right spacer */}
    </div>
  );
}