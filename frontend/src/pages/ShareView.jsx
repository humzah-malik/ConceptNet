// src/pages/ShareView.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MindMap from '../components/MindMap'
import NodeModal from '../components/NodeModal'
import { HiArrowLeft, HiHome } from 'react-icons/hi'
import { BASE_URL } from '../api'

export default function ShareView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [graph, setGraph] = useState(null)
  const [activeNode, setActiveNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("galleryMaps") || "[]");
    const foundLocally = stored.find((m) => m.id === id);
    if (foundLocally) {
      setGraph(foundLocally.graph);
      return;
    }

    fetch(`${BASE_URL}/get-cached-graph/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Map not found on server");
        }
        return res.json();
      })
      .then((json) => {
        setGraph(json);
      })
      .catch((err) => {
        console.warn("Could not fetch shared graph:", err);
      });
  }, [id]);

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden">
      {/* Back + Home icons */}
      <div className="absolute top-4 left-4 flex space-x-2 z-50">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
          <HiArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
          <HiHome className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
        <h1 className="text-lg font-semibold text-gray-800">Shared Map</h1>
      </div>

      {/* Search Bar (read‐only filtering still allowed) */}
      <div className="absolute top-20 left-4 z-50 w-64">
        <input
          type="text"
          placeholder="Search node title..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-200"
        />
      </div>

      {/* Graph */}
      <div id="vis-graph" className="w-full h-full">
        {graph ? (
          <MindMap
            graph={graph}
            onNodeClick={setActiveNode}
            // We pass a no-op setter so MindMap compiles; but no editing UI will show
            setGraph={() => {}}
            searchTerm={searchTerm}
          />
        ) : (
          <p className="text-center pt-20 text-gray-500">Shared map not found</p>
        )}

        {/* NodeModal still works (read‐only quiz & summary) */}
        {activeNode && (
          <NodeModal
            key={activeNode.id}
            graphId={id}
            node={activeNode}
            onClose={() => setActiveNode(null)}
          />
        )}
      </div>
    </div>
  )
}