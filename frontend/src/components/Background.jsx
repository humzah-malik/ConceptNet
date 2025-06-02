export default function Background() {
    return (
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(-45deg, #c7d2fe, #e0e7ff, #f3e8ff, #fef3c7)',
          backgroundSize: '300% 300%',
          animation: 'gradient-x 25s ease infinite',
          opacity: 0.9
        }}
      />
    );
  }