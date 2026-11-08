import React from 'react';

interface NewsprintTextureOverlayProps {
  enabled: boolean;
}

export const NewsprintTextureOverlay: React.FC<NewsprintTextureOverlayProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300 opacity-25"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(251, 243, 222, 0.15), rgba(20, 18, 15, 0.25)),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.35'/%3E%3C/svg%3E")
        `,
        mixBlendMode: 'overlay',
      }}
      aria-hidden="true"
    />
  );
};
