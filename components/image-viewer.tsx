'use client';

import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface ImageViewerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageViewer({ imageUrl, isOpen, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageUrl.split('/').pop() || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setScale(1);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-10">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          size="icon"
          variant="outline"
          className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
          disabled={scale <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          size="sm"
          variant="outline"
          className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
        >
          {Math.round(scale * 100)}%
        </Button>
        
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          size="icon"
          variant="outline"
          className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
          disabled={scale >= 3}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          size="icon"
          variant="outline"
          className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          size="icon"
          variant="outline"
          className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Image */}
      <div 
        className="overflow-auto max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full size"
          className="transition-transform duration-200 cursor-zoom-in"
          style={{ transform: `scale(${scale})` }}
          onClick={handleZoomIn}
        />
      </div>

      {/* Instructions */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm">
        Cliquez sur l'image pour zoomer • Échap ou cliquez en dehors pour fermer
      </div>
    </div>
  );
}

