import React, { useState } from 'react';

////////////////////////////////////////////////////////////////////////////////

interface HintTooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

const HintTooltip: React.FC<HintTooltipProps> = ({ 
  content, 
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        ?
      </div>
      
      {isVisible && (
        <div 
          className={`absolute z-10 ${positionClasses[position]} bg-gray-800 text-white text-sm rounded py-2 px-3 shadow-lg w-64 text-justify`}
        >
          {content}
          <div 
            className={`absolute ${
              position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent' : 
              position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent' :
              position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent' :
              'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent'
            } border-4 h-0 w-0`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default HintTooltip;
