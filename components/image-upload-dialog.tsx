'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { compressImage, isImageFile } from '@/lib/image-compression';

interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
  uploadToServer: (file: File) => Promise<string>;
}

export function ImageUploadDialog({
  isOpen,
  onClose,
  onUploadComplete,
  uploadToServer,
}: ImageUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isImageFile(file)) {
      setError('Veuillez sélectionner une image (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      setError('L\'image est trop grande (max 4MB)');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      // Compress image
      setUploadProgress(30);
      const compressedFile = await compressImage(selectedFile);

      // Upload to server
      setUploadProgress(50);
      const url = await uploadToServer(compressedFile);

      setUploadProgress(100);
      onUploadComplete(url);

      // Reset and close
      setTimeout(() => {
        handleClose();
      }, 300);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur lors de l\'upload. Veuillez réessayer.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Envoyer une image
          </h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File input */}
          {!selectedFile && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Cliquez pour sélectionner une image
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                JPEG, PNG, GIF, WebP (max 4MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span className="truncate flex-1">{selectedFile.name}</span>
                  <span className="ml-2 text-xs">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              )}

              {!isUploading && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Choisir une autre image
                </button>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Upload en cours...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isUploading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload...
              </>
            ) : (
              'Envoyer'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

