
import React from 'react';

interface CardProps {
  title: string;
  step: number;
  children: React.ReactNode;
  isDimmed?: boolean;
}

const Card: React.FC<CardProps> = ({ title, step, children, isDimmed = false }) => {
  const cardClasses = `bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 flex flex-col transition-opacity duration-500 ${isDimmed ? 'opacity-40' : 'opacity-100'}`;
  
  return (
    <div className={cardClasses}>
      <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold mr-3">{step}</span>
        {title}
      </h2>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export default Card;
