import React from 'react';

const Card = ({ title, step, children, isDimmed = false }) => {
  const cardClasses = `bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 flex flex-col transition-opacity duration-500 ${isDimmed ? 'opacity-40' : 'opacity-100'}`;

  return React.createElement(
    'div',
    { className: cardClasses },
    React.createElement(
      'h2',
      { className: 'text-xl font-bold text-gray-200 mb-4 flex items-center' },
      React.createElement(
        'span',
        {
          className:
            'flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold mr-3',
        },
        step
      ),
      title
    ),
    React.createElement('div', { className: 'flex-grow' }, children)
  );
};

export default Card;
