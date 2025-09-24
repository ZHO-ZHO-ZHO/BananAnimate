import React, { useState, useCallback } from 'react';

const FileUpload = ({ onFileSelect, disabled, accept, icon, title, description }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback(
    (files) => {
      if (files && files[0]) {
        const file = files[0];
        const [expectedType] = accept.split('/');
        if (!file.type || file.type.startsWith(expectedType)) {
          onFileSelect(file);
        } else {
          alert(`Please select a valid file type (${accept}).`);
        }
      }
    },
    [accept, onFileSelect]
  );

  const handleDragEnter = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (!disabled) {
        handleFileChange(event.dataTransfer.files);
      }
    },
    [disabled, handleFileChange]
  );

  const className = [
    'flex justify-center items-center w-full h-36 px-4 transition bg-gray-700/50 border-2 border-dashed rounded-md cursor-pointer',
    isDragging ? 'border-indigo-500' : 'border-gray-600',
    disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-500',
  ].join(' ');

  return React.createElement(
    'label',
    {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      className,
    },
    React.createElement(
      'div',
      { className: 'space-y-1 text-center' },
      React.createElement(
        'div',
        { className: 'mx-auto h-10 w-10 text-gray-400' },
        icon
      ),
      React.createElement(
        'div',
        { className: 'flex text-sm text-gray-400 justify-center gap-1' },
        React.createElement(
          'span',
          { className: 'relative font-medium text-indigo-400' },
          React.createElement('span', null, title),
          React.createElement('input', {
            id: 'file-upload',
            name: 'file-upload',
            type: 'file',
            className: 'sr-only',
            accept,
            onChange: (event) => handleFileChange(event.target.files),
            disabled,
          })
        ),
        React.createElement('p', { className: 'text-sm text-gray-400' }, 'or drag and drop')
      ),
      React.createElement('p', { className: 'text-xs text-gray-500' }, description)
    )
  );
};

export default FileUpload;
