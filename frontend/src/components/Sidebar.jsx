import React from 'react';

export default function Sidebar({ isOpen, onClose, onSave, onDelete }) {
  return (
    <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Options</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black">&times;</button>
      </div>
      <div className="p-4 space-y-4">
        <button
          onClick={onSave}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Export Map
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete Map
        </button>
      </div>
    </div>
  );
}