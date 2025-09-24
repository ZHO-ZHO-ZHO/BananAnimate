
import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  accept: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled, accept, icon, title, description }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith(accept.split('/')[0])) {
        onFileSelect(file);
      } else {
        alert(`Please select a valid file type (${accept}).`);
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [disabled, handleFileChange]);

  return (
    <label
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex justify-center items-center w-full h-36 px-4 transition bg-gray-700/50 border-2 ${isDragging ? 'border-indigo-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-500'}`}
    >
      <div className="space-y-1 text-center">
        <div className="mx-auto h-10 w-10 text-gray-400">{icon}</div>
        <div className="flex text-sm text-gray-400">
          <span className="relative font-medium text-indigo-400">
            <span>{title}</span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept={accept}
              onChange={(e) => handleFileChange(e.target.files)}
              disabled={disabled}
            />
          </span>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  );
};

export default FileUpload;
