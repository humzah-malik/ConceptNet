import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Landing from './pages/Landing.jsx';
import NewMap from './pages/NewMap.jsx';
import Gallery from './pages/Gallery.jsx';
import MapView from './pages/MapView.jsx';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/newmap" element={<NewMap />} />
        <Route path="/maps" element={<Gallery />} />
        <Route path="/map/:id" element={<MapView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);