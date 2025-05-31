import React, { useEffect, useState, useRef } from 'react';
import OffscreenRenderer from '../components/OffscreenRenderer';
import { useNavigate } from 'react-router-dom';
import {
  HiHome, HiArrowLeft, HiTrash, HiEye, HiPencil, HiDotsVertical,
  HiDownload
} from 'react-icons/hi';
// import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Gallery() {
  const [maps, setMaps] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [exportHoveredId, setExportHoveredId] = useState(null);
  const navigate = useNavigate();
  const menuRefs = useRef({});
  const [renderingExport, setRenderingExport] = useState(null);
  const [renderFormat, setRenderFormat] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('galleryMaps') || '[]');
    const withTitles = stored.map(m => ({
      ...m,
      title: m.graph?.nodes?.[0]?.label || m.title || 'Untitled Map',
    }));
    setMaps(withTitles);
    setFiltered(withTitles);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openMenuId &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId].contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);
  

  const updateGallery = (updatedMaps) => {
    setMaps(updatedMaps);
    localStorage.setItem('galleryMaps', JSON.stringify(updatedMaps));
    setFiltered(updatedMaps.filter(m => m.title.toLowerCase().includes(search.toLowerCase())));
  };

  const handleDelete = (id) => {
    const updated = maps.filter(m => m.id !== id);
    updateGallery(updated);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    setFiltered(maps.filter(m => m.title.toLowerCase().includes(val.toLowerCase())));
  };

  const handleRename = (id) => {
    const updated = maps.map(m => m.id === id ? { ...m, title: newTitle } : m);
    updateGallery(updated);
    setEditingId(null);
  };

  const handleExport = async (graph, format = 'png') => {
    setRenderingExport(graph);
    setRenderFormat(format);

    return;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TopBar */}
      <div className="flex items-center px-4 py-3 bg-white shadow">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded">
          <HiArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded">
          <HiHome className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold">My Maps</h1>
        <div className="w-8" />
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by map title..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-gray-600 mb-6">
              {search ? 'No maps found for this title.' : 'You haven’t created any maps yet.'}
            </p>
            <button
              onClick={() => navigate('/newmap')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              + Create Your First Map
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map(map => (
              <div
                key={map.id}
                className="bg-white p-4 rounded shadow relative group flex flex-col justify-between"
              >
                <div className="flex justify-between items-center mb-1">
                  {editingId === map.id ? (
                    <input
                      className="border px-2 py-1 rounded w-full text-sm"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => handleRename(map.id)}
                    />
                  ) : (
                    <h3
                      className="text-md font-semibold truncate"
                      title={map.title}
                    >
                      {map.title}
                    </h3>
                  )}
                  <button
                    onClick={() => setOpenMenuId(openMenuId === map.id ? null : map.id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <HiDotsVertical />
                  </button>
                </div>

                <p className="text-xs text-gray-500">{new Date(map.createdAt).toLocaleString()}</p>

                {openMenuId === map.id && (
                  <div ref={el => (menuRefs.current[map.id] = el)} className="absolute top-0 left-full ml-2 bg-white border shadow-md rounded-md z-10 w-40 text-sm">
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => navigate(`/map/${map.id}`)}
                    >
                      <HiEye className="inline mr-2" /> View
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setEditingId(map.id);
                        setNewTitle(map.title);
                        setOpenMenuId(null);
                      }}
                    >
                      <HiPencil className="inline mr-2" /> Rename
                    </button>
                    <div
                      className="relative"
                      onMouseEnter={() => setExportHoveredId(map.id)}
                      onMouseLeave={() => setExportHoveredId(null)}
                    >
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                        <HiDownload className="inline mr-2" /> Export
                      </button>
                      {exportHoveredId === map.id && (
                        <div className="absolute top-0 left-full ml-1 bg-white border rounded shadow text-sm">
                          <button
                            onClick={() => handleExport(map.graph, 'png')}
                            className="block px-3 py-1 hover:bg-gray-100"
                          >
                            PNG
                          </button>
                          <button
                            onClick={() => handleExport(map.graph, 'pdf')}
                            className="block px-3 py-1 hover:bg-gray-100"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleExport(map.graph, 'jpg')}
                            className="block px-3 py-1 hover:bg-gray-100"
                          >
                            JPG
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                      onClick={() => handleDelete(map.id)}
                    >
                      <HiTrash className="inline mr-2" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {renderingExport && (
  <OffscreenRenderer
    graph={renderingExport}
    onReady={(canvas) => {
      const mime = renderFormat === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataURL = canvas.toDataURL(mime);

      if (renderFormat === 'pdf') {
        const pdf = new jsPDF();
        pdf.addImage(dataURL, 'PNG', 10, 10, 180, 135);
        pdf.save('graph.pdf');
      } else {
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `graph.${renderFormat}`;
        link.click();
      }

      setRenderingExport(null);
      setRenderFormat(null);
    }}
  />
)}
    </div>
  );
}