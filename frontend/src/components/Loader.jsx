import React from 'react';

const Loader = ({ size = 36, color = "#ff7a00" }) => {
  return (
    <div className="flex items-center justify-center">
      <div 
        className="animate-spin rounded-full border-t-2 border-b-2 border-orange"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          borderColor: color 
        }}
      />
    </div>
  );
};

export default Loader; 