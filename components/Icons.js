import React from 'react';

export const ImageIcon = () =>
  React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'h-full w-full',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: 1,
    },
    React.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    })
  );

export const VideoIcon = () =>
  React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'h-full w-full',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: 1,
    },
    React.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    })
  );
