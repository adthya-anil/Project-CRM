import React, { useState, useEffect } from 'react';

const LoadingComponent = ({ 
  size = 120, 
  backgroundColor = 'rgba(15, 23, 42, 0.95)',
}) => {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backgroundColor: backgroundColor
    },
    particlesContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    },
    particle: (i) => ({
      position: 'absolute',
      borderRadius: '50%',
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      background: i % 3 === 0 ? '#30A4DC' : i % 3 === 1 ? '#0A3456' : '#42B6F0',
      opacity: Math.random() * 0.3 + 0.1,
      animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 4}s`
    }),
    rippleContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    },
    ripple: (i) => ({
      position: 'absolute',
      borderRadius: '50%',
      border: '2px solid #60A5FA',
      width: size * (1.5 + i * 0.8),
      height: size * (1.5 + i * 0.8),
      opacity: 0.08,
      animation: `ripple ${3 + i}s ease-out infinite`,
      animationDelay: `${i * 0.8}s`
    }),
    mainContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '32px',
      position: 'relative',
      zIndex: 10
    },
    logoContainer: {
      position: 'relative',
      width: size * 1.2,
      height: size * 1.2,
      perspective: '1200px'
    },
    outerRing: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '50%',
      opacity: 0.25,
      background: 'conic-gradient(from 0deg, #30A4DC, #0A3456, #42B6F0, #30A4DC)',
      mask: 'radial-gradient(circle, transparent 85%, black 90%)',
      WebkitMask: 'radial-gradient(circle, transparent 85%, black 90%)',
      animation: 'rotateRing 6s linear infinite'
    },
    innerGlow: {
      position: 'absolute',
      top: '24px',
      left: '24px',
      right: '24px',
      bottom: '24px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(48, 164, 220, 0.2) 0%, rgba(10, 52, 86, 0.1) 50%, transparent 80%)',
      animation: 'glowPulse 2.5s ease-in-out infinite'
    },
    logoWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transformStyle: 'preserve-3d',
      animation: 'rotate3dComplex 8s ease-in-out infinite'
    },
    logo: {
      position: 'relative',
      animation: 'logoFloat 3s ease-in-out infinite',
      filter: 'drop-shadow(0 0 8px rgba(48, 164, 220, 0.4)) drop-shadow(0 0 15px rgba(10, 52, 86, 0.2))'
    },
    dotsContainer: {
      display: 'flex',
      gap: '8px'
    },
    dot: (i) => ({
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: `linear-gradient(45deg, ${i % 2 === 0 ? '#30A4DC' : '#0A3456'}, ${i % 2 === 0 ? '#42B6F0' : '#1B4A6B'})`,
      animation: `bounce ${1.2 + i * 0.2}s ease-in-out infinite`,
      animationDelay: `${i * 0.3}s`
    })
  };

  const keyframes = `
    @keyframes rotate3dComplex {
      0%, 100% { 
        transform: rotateY(0deg) rotateX(0deg) rotateZ(0deg);
      }
      25% { 
        transform: rotateY(90deg) rotateX(15deg) rotateZ(5deg);
      }
      50% { 
        transform: rotateY(180deg) rotateX(0deg) rotateZ(0deg);
      }
      75% { 
        transform: rotateY(270deg) rotateX(-15deg) rotateZ(-5deg);
      }
    }
    
    @keyframes logoFloat {
      0%, 100% { 
        transform: translateY(0px) scale(1);
      }
      50% { 
        transform: translateY(-8px) scale(1.05);
      }
    }
    
    @keyframes rotateRing {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes glowPulse {
      0%, 100% { 
        opacity: 0.2;
        transform: scale(1);
      }
      50% { 
        opacity: 0.4;
        transform: scale(1.1);
      }
    }
    
    @keyframes float {
      0%, 100% { 
        transform: translateY(0px) translateX(0px) rotate(0deg);
        opacity: 0.1;
      }
      25% {
        transform: translateY(-20px) translateX(10px) rotate(90deg);
        opacity: 0.3;
      }
      50% { 
        transform: translateY(-10px) translateX(-5px) rotate(180deg);
        opacity: 0.2;
      }
      75% {
        transform: translateY(-30px) translateX(-10px) rotate(270deg);
        opacity: 0.4;
      }
    }
    
    @keyframes ripple {
      0% {
        transform: scale(0.5);
        opacity: 0.2;
      }
      50% {
        opacity: 0.08;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    @keyframes bounce {
      0%, 100% { 
        transform: translateY(0px) scale(1);
        opacity: 0.7;
      }
      50% { 
        transform: translateY(-12px) scale(1.2);
        opacity: 1;
      }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.overlay}>
        {/* Animated background particles */}
        <div style={styles.particlesContainer}>
          {[...Array(25)].map((_, i) => (
            <div key={i} style={styles.particle(i)} />
          ))}
        </div>

        {/* Ripple effects */}
        <div style={styles.rippleContainer}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={styles.ripple(i)} />
          ))}
        </div>

        <div style={styles.mainContainer}>
          {/* Main logo container */}
          <div style={styles.logoContainer}>
            {/* Outer rotating ring */}
            <div style={styles.outerRing} />
            
            {/* Inner pulsing glow */}
            <div style={styles.innerGlow} />

            {/* 3D S Logo */}
            <div style={styles.logoWrapper}>
              <div style={styles.logo}>
                <svg
                  width={size * 0.8}
                  height={size * 0.8}
                  viewBox="0 0 130 110"
                >
                  <defs>
                    {/* Dynamic color-shifting gradients */}
                    <linearGradient id="animatedGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%">
                        <animate attributeName="stop-color" 
                          values="#0A3456;#1B4A6B;#2D5F7F;#0A3456" 
                          dur="4s" 
                          repeatCount="indefinite" />
                      </stop>
                      <stop offset="50%">
                        <animate attributeName="stop-color" 
                          values="#1B4A6B;#0A3456;#2D5F7F;#1B4A6B" 
                          dur="4s" 
                          repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%">
                        <animate attributeName="stop-color" 
                          values="#2D5F7F;#0A3456;#1B4A6B;#2D5F7F" 
                          dur="4s" 
                          repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                    
                    <linearGradient id="animatedGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%">
                        <animate attributeName="stop-color" 
                          values="#30A4DC;#42B6F0;#1E88E5;#30A4DC" 
                          dur="3.5s" 
                          repeatCount="indefinite" />
                      </stop>
                      <stop offset="50%">
                        <animate attributeName="stop-color" 
                          values="#42B6F0;#1E88E5;#30A4DC;#42B6F0" 
                          dur="3.5s" 
                          repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%">
                        <animate attributeName="stop-color" 
                          values="#1E88E5;#30A4DC;#42B6F0;#1E88E5" 
                          dur="3.5s" 
                          repeatCount="indefinite" />
                      </stop>
                    </linearGradient>

                    {/* Wave-like fill masks */}
                    <mask id="waveMask1">
                      <rect x="0" y="0" width="130" height="74" fill="white">
                        <animate attributeName="y" 
                          values="74;74;74;0;0;0;0;74" 
                          dur="6s" 
                          repeatCount="indefinite" />
                        <animate attributeName="height" 
                          values="0;0;0;74;74;74;74;0" 
                          dur="6s" 
                          repeatCount="indefinite" />
                      </rect>
                    </mask>
                    
                    <mask id="waveMask2">
                      <rect x="0" y="29" width="130" height="81" fill="white">
                        <animate attributeName="y" 
                          values="110;29;29;29;29;29;29;110" 
                          dur="6s" 
                          repeatCount="indefinite" />
                        <animate attributeName="height" 
                          values="0;81;81;81;81;81;81;0" 
                          dur="6s" 
                          repeatCount="indefinite" />
                      </rect>
                    </mask>

                    {/* Reduced glow filter */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Base paths with subtle glow */}
                  <path 
                    d="M33.1448 14.4032H63.6449L56.6449 0.00500569C56.6449 0.00500569 36.4832 -0.111883 27.4296 0.784027C18.376 1.67994 12.4517 7.09262 6.92961 17.784C3.40669 24.6048 4.14484 34.9032 4.14484 34.9032C4.14484 34.9032 2.45144 55.912 10.6449 63.4032C16.6631 68.9055 23.1448 73.4032 32.1449 73.4032H94.1448V58.505C75.3115 59.005 35.9397 58.505 32.1449 58.505C23.645 58.505 18.1449 52.9032 18.1449 34.9032C18.1449 20.5032 25.6448 14.4032 33.1448 14.4032Z" 
                    fill="#0A3456"
                    opacity="0.1"
                  />
                  
                  <path 
                    d="M34.1449 29.505V45.505L93.6449 45.505C98.9782 46.005 109.645 50.805 109.645 66.005C109.645 85.605 97.9782 89.8383 92.1449 89.505H66.6449L74.1449 104.005H95.6449C99.8116 103.672 109.545 101.605 115.145 96.005C122.145 89.005 123.932 79.4999 124.145 75.005C124.186 74.1352 124.257 73.143 124.336 72.0508C125.289 61.2874 122.939 50.5356 121.645 46.505C116.445 33.705 103.478 29.8383 97.6449 29.505H59.1449H34.1449Z" 
                    fill="#30A4DC"
                    opacity="0.1"
                  />
                  
                  {/* Animated fill paths with reduced glowing effect */}
                  <path 
                    d="M33.1448 14.4032H63.6449L56.6449 0.00500569C56.6449 0.00500569 36.4832 -0.111883 27.4296 0.784027C18.376 1.67994 12.4517 7.09262 6.92961 17.784C3.40669 24.6048 4.14484 34.9032 4.14484 34.9032C4.14484 34.9032 2.45144 55.912 10.6449 63.4032C16.6631 68.9055 23.1448 73.4032 32.1449 73.4032H94.1448V58.505C75.3115 59.005 35.9397 58.505 32.1449 58.505C23.645 58.505 18.1449 52.9032 18.1449 34.9032C18.1449 20.5032 25.6448 14.4032 33.1448 14.4032Z" 
                    fill="url(#animatedGradient1)"
                    mask="url(#waveMask1)"
                    filter="url(#glow)"
                  />
                  
                  <path 
                    d="M34.1449 29.505V45.505L93.6449 45.505C98.9782 46.005 109.645 50.805 109.645 66.005C109.645 85.605 97.9782 89.8383 92.1449 89.505H66.6449L74.1449 104.005H95.6449C99.8116 103.672 109.545 101.605 115.145 96.005C122.145 89.005 123.932 79.4999 124.145 75.005C124.186 74.1352 124.257 73.143 124.336 72.0508C125.289 61.2874 122.939 50.5356 121.645 46.505C116.445 33.705 103.478 29.8383 97.6449 29.505H59.1449H34.1449Z" 
                    fill="url(#animatedGradient2)"
                    mask="url(#waveMask2)"
                    filter="url(#glow)"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Animated loading dots */}
          <div style={styles.dotsContainer}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={styles.dot(i)} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoadingComponent;