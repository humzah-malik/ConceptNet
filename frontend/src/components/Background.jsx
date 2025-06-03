export default function Background() {
    return (
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Light mode gradient */}
        <div className="block dark:hidden w-full h-full"
          style={{
            background: 'linear-gradient(-45deg, #c7d2fe, #e0e7ff, #f3e8ff, #fef3c7)',
            backgroundSize: '300% 300%',
            animation: 'gradient-x 25s ease infinite',
            opacity: 0.9
          }}
        />
        
        {/* Dark mode gradient (darker version) */}
        <div className="hidden dark:block w-full h-full"
          style={{
            background: 'linear-gradient(-45deg, #0b1120, #1e293b, #1e1b4b, #0c4a6e)',
            backgroundSize: '300% 300%',
            animation: 'gradient-x 25s ease infinite',
            opacity: 0.88
          }}
        />
      </div>
    )
  }  