import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MindMap from '../MindMap';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

export default function MapView() {
  const { mapId } = useParams(); // Grab map ID from route
  const navigate = useNavigate();
  const [graph, setGraph] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (mapId) {
      const allMaps = JSON.parse(localStorage.getItem('galleryMaps') || '[]');
      const match = allMaps.find(m => m.id === mapId);
      if (match) setGraph(match.graph);
    } else {
      const cached = localStorage.getItem('latestGraph');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.nodes && parsed?.links) {
          setGraph(parsed);
        }
      }
    }
  }, [mapId]);

  const handleSave = () => {
    alert("Coming soon: Export as PDF/PNG/JPG");
  };

  const handleDelete = () => {
    if (mapId) {
      // Delete from gallery
      const allMaps = JSON.parse(localStorage.getItem('galleryMaps') || '[]');
      const updated = allMaps.filter(m => m.id !== mapId);
      localStorage.setItem('galleryMaps', JSON.stringify(updated));
      alert('Map deleted from gallery');
      navigate('/gallery');
    } else {
      // Delete from latestGraph
      localStorage.removeItem('latestGraph');
      alert('Latest map deleted');
      setGraph(null);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <TopBar shift={sidebarOpen} onMenuClick={() => setSidebarOpen(o => !o)} />

      <div className="flex h-full pt-14">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />

        <div
          className={`
            flex-1 
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-64' : 'translate-x-0'}
          `}
        >
          <div className="w-full h-full">
            {graph ? (
              <MindMap graph={graph} />
            ) : (
              <p className="text-center text-gray-600 pt-10">
                No graph found. Please create one first.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}