// src/components/ParticlesBackground.jsx

import React from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

export default function ParticlesBackground() {
  const particlesInit = async (engine) => {
    console.log('🔵 particlesInit called');
    await loadFull(engine);
    console.log('🔵 Particles engine loaded');
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        background: { color: 'transparent' },
        particles: {
          number: { value: 50 },
          size: { value: 4 },
          move: { enable: true, speed: 0.4, direction: 'none', outMode: 'bounce' },
          links: {
            enable: true,
            distance: 120,
            color: '#6366F1',
            opacity: 0.5,
            width: 1
          },
          color: { value: '#6366F1' },
          value: { min: 0.2, max: 0.5 },
          opacity: { value: 0.7, animation: {
            enable: true,
            speed: 0.4,
            minimumValue: 0.2,
            sync: false
          }},
        },
        detectRetina: true
      }}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}