// src/pages/Gallery.jsx

import React, { useEffect, useState, useRef } from 'react';
import OffscreenRenderer from '../components/OffscreenRenderer';
import { useNavigate } from 'react-router-dom';
import {
  HiHome, HiArrowLeft, HiTrash, HiPencil, HiDotsVertical,
  HiDownload
} from 'react-icons/hi';
import jsPDF from 'jspdf';
import { BASE_URL } from '../api';
import Layout from '../components/Layout';
import useIsDarkMode from '../hooks/useIsDarkMode';

export default function Gallery() {
  const [maps, setMaps] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [exportHoveredId, setExportHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTag, setSelectedTag] = useState('');
  const navigate = useNavigate();
  const menuRefs = useRef({});
  const cardRefs = useRef({});
  const [renderingExport, setRenderingExport] = useState(null);
  const [renderFormat, setRenderFormat] = useState(null);
  const isDark = useIsDarkMode();
  // 1️⃣ Load maps (and migrate if needed)
  useEffect(() => {
    (async () => {
      const stored = JSON.parse(localStorage.getItem('galleryMaps') || '[]');

      // ---- MIGRATION --------------------------------------------------------
      const migrated = stored.map(m => {
        if (m.graph && !m.graph.transcript) {
          return { ...m, graph: { ...m.graph, transcript: ' ' } };
        }
        return m;
      });
      // -----------------------------------------------------------------------

      const withTitles = migrated.map(m => ({
        ...m,
        title: m.graph?.nodes?.[0]?.label || m.title || 'Untitled Map',
      }));

      // (Optional) Build a list of all tags present:
      const allTags = Array.from(
        new Set(withTitles.flatMap(m => m.tags || []))
      );
      //— we don’t explicitly use `allTags` here, but it’s available if needed —

      setMaps(withTitles);
      setFiltered(withTitles);
      localStorage.setItem('galleryMaps', JSON.stringify(withTitles));
    })();
  }, []);

  // 2️⃣ Close “⋮” menu if click happens outside
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

  // 3️⃣ Deselect highlighted card if click happens outside that card
  useEffect(() => {
    const handleCardDeselect = (event) => {
      if (selectedId !== null) {
        const cardEl = cardRefs.current[selectedId];
        if (cardEl && !cardEl.contains(event.target)) {
          setSelectedId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleCardDeselect);
    return () => {
      document.removeEventListener('mousedown', handleCardDeselect);
    };
  }, [selectedId]);

  // 4️Update maps + re-filter when gallery changes
  const updateGallery = (updatedMaps) => {
    setMaps(updatedMaps);
    localStorage.setItem('galleryMaps', JSON.stringify(updatedMaps));
    // always apply current search + tag filters
    const base = updatedMaps.filter(m =>
      m.title.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedTag === '') {
      setFiltered(base);
    } else {
      setFiltered(base.filter(m => (m.tags || []).includes(selectedTag)));
    }
  };

  // 5️⃣ Delete a map
  const handleDelete = (id) => {
    const updated = maps.filter(m => m.id !== id);
    updateGallery(updated);
  };

  // 6️⃣ Search by title (and re‐apply tag filter)
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    const base = maps.filter(m => m.title.toLowerCase().includes(val.toLowerCase()));
    if (selectedTag === '') {
      setFiltered(base);
    } else {
      setFiltered(base.filter(m => (m.tags || []).includes(selectedTag)));
    }
  };


  // 8️⃣ Export to PNG/JPG/PDF
  const handleExport = async (graph, format = 'png') => {
    setRenderingExport(graph);
    setRenderFormat(format);
    return;
  };

  return (
    <Layout>
    <div className="min-h-screen">
      {/* ─── TopBar ───────────────────────────────────────────────────────── */}
      <div className="relative flex items-center px-4 py-3 bg-transparent shadow-none backdrop-blur-md">
        {/* LEFT BUTTONS:*/}
        <div className="absolute left-4 flex space-x-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <HiArrowLeft className="w-6 h-6 text-gray-700 dark:text-white" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <HiHome className="w-6 h-6 text-gray-700 dark:text-white" />
          </button>
        </div>

        {/* CENTERED TITLE:*/}
        <h1 className="mx-auto text-xl font-semibold text-black dark:text-white">
          My Maps
        </h1>
      </div>

      {/* ─── Search + Tag Filter ──────────────────────────────────────────── */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by map title..."
            className="w-full max-w-md px-4 py-2 rounded-md shadow-sm
  border border-gray-300 dark:border-gray-600
  bg-white dark:bg-[#1a1f23]
  text-gray-800 dark:text-gray-100
  placeholder:text-gray-400 dark:placeholder:text-gray-500
  focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="mb-6 flex justify-center">
          <select
            value={selectedTag}
            onChange={e => {
              const tag = e.target.value;
              setSelectedTag(tag);
              const base = maps.filter(m =>
                m.title.toLowerCase().includes(search.toLowerCase())
              );
              if (tag === '') {
                setFiltered(base);
              } else {
                setFiltered(base.filter(m => (m.tags || []).includes(tag)));
              }
            }}
            className="w-full max-w-xs px-3 py-2 rounded-md shadow-sm
  border border-gray-300 dark:border-gray-600
  bg-white dark:bg-[#1a1f23]
  text-gray-800 dark:text-gray-100
  focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <option value="">All Tags</option>
            {Array.from(new Set(maps.flatMap(m => (m.tags || [])))).map(tag => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* ─── “No maps” or Grid of Cards ──────────────────────────────────── */}
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
                ref={el => (cardRefs.current[map.id] = el)}
                onClick={() => setSelectedId(map.id)}
                onDoubleClick={() => navigate(`/map/${map.id}`)}
                className={`
                rounded-xl border shadow-md p-5 flex flex-col justify-between relative
                ${openMenuId === map.id ? 'z-50' : 'z-0'}    /* ⏫ bump z when menu is open */
                overflow-visible
                bg-white dark:bg-[#0f1a1e]
                border-gray-200 dark:border-gray-600
                text-gray-800 dark:text-gray-100
                transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg
                ${selectedId === map.id ? 'ring-2 ring-indigo-400/70' : ''}
              `}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3
                    className="text-md font-semibold truncate"
                    title={map.title}
                  >
                    {map.title}
                  </h3>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === map.id ? null : map.id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <HiDotsVertical />
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  {new Date(map.createdAt).toLocaleString()}
                </p>

                {/* Tags */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {(map.tags || []).slice(0, 3).map(tag => {
                    const key = tag
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]/g, '');
                    let codeSum = 0;
                    for (let c of key) { codeSum += c.charCodeAt(0); }
                    const hue = codeSum % 360;
                    const background = `hsl(${hue}, 70%, ${isDark ? '25%' : '90%'}  )`;
                    const border = `hsl(${hue}, 60%, ${isDark ? '45%' : '70%'})`;
                    return (
                      <span
                        key={tag}
                        style={{ backgroundColor: background, borderColor: border }}
                        className="px-2 py-0.5 text-xs rounded-full border text-gray-900 dark:text-gray-100"
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>

                {openMenuId === map.id && (
                  <div
                    ref={el => (menuRefs.current[map.id] = el)}
                    className="absolute top-10 right-5 
    bg-white dark:bg-gray-800
    border border-gray-200 dark:border-gray-600
    shadow-lg rounded-md z-[9999] w-40 text-sm
    text-gray-900 dark:text-gray-100"
                  >

                    {/* Edit Tags (new) */}
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setOpenMenuId(null);
                        const answer = window.prompt(
                          'Enter tags for this map (comma‑separated):',
                          (map.tags || []).join(',')
                        );
                        if (answer !== null) {
                          const newTags = answer
                            .split(',')
                            .map(s => s.trim())
                            .filter(s => s.length > 0);
                          const updatedMaps = maps.map(m =>
                            m.id === map.id ? { ...m, tags: newTags } : m
                          );
                          setMaps(updatedMaps);
                          localStorage.setItem('galleryMaps', JSON.stringify(updatedMaps));
                          // reapply filters
                          const base = updatedMaps.filter(mm =>
                            mm.title.toLowerCase().includes(search.toLowerCase())
                          );
                          if (selectedTag === '') {
                            setFiltered(base);
                          } else {
                            setFiltered(base.filter(mm =>
                              (mm.tags || []).includes(selectedTag)
                            ));
                          }
                        }
                      }}
                    >
                      <HiPencil className="inline mr-2" /> Edit Tags
                    </button>

                    {/* Export submenu */}
                    <div
                      className="relative"
                      onMouseEnter={() => setExportHoveredId(map.id)}
                      onMouseLeave={() => setExportHoveredId(null)}
                    >
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <HiDownload className="inline mr-2" /> Export
                      </button>
                      {exportHoveredId === map.id && (
                        <div className="absolute top-0 left-full ml-1 
                        bg-white dark:bg-gray-800
                        border border-gray-200 dark:border-gray-600
                        shadow-lg rounded-md text-sm
                        w-20    /* narrower than w-28 */
                        z-50   /* safe above siblings, since parent card is z-50 */
                        overflow-hidden">                 
                          <button
                            onClick={() => handleExport(map.graph, 'png')}
                            className="w-full px-2 py-1 
                            hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            PNG
                          </button>
                          <button
                            onClick={() => handleExport(map.graph, 'pdf')}
                            className="w-full px-2 py-1 
                            hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleExport(map.graph, 'jpg')}
                            className="w-full px-2 py-1 
                            hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            JPG
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
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

      {/* Offscreen export */}
      {renderingExport && (
        <OffscreenRenderer
          graph={renderingExport}
          onReady={canvas => {
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
    </Layout>
  );
}