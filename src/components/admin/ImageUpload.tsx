'use client';

import { useState, useRef, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { X, Image as ImageIcon } from 'phosphor-react';
import { ipfsUrl } from '@/lib/ipfs';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

export function ImageUpload({ images, onChange, maxImages = 5, label = 'Product Images' }: ImageUploadProps) {
  const { getAccessToken } = usePrivy();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.cid;
  }, [getAccessToken]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;
    const remaining = maxImages - images.length;
    const toUpload = fileArray.slice(0, remaining);
    if (toUpload.length === 0) return;
    setUploading(true);
    try {
      const newCids = await Promise.all(toUpload.map(f => uploadFile(f)));
      onChange([...images, ...newCids]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onChange, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = useCallback((index: number) => {
    onChange(images.filter((_, i) => i !== index));
  }, [images, onChange]);

  return (
    <div>
      <label className="block text-sm mb-2 text-white/70">{label}</label>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((cid, index) => (
            <div key={cid} className="relative w-24 h-24 bg-[#1b1b1b] overflow-hidden group">
              <img src={ipfsUrl(cid)} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              {index === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center bg-black/60 text-white py-0.5">Main</span>
              )}
            </div>
          ))}
        </div>
      )}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-white bg-white/5' : 'border-white/20 hover:border-white/40'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-xs text-white/50">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon size={24} className="text-white/30" />
              <p className="text-xs text-white/50">Drag & drop images here, or click to browse</p>
              <p className="text-[10px] text-white/30">{images.length}/{maxImages} images</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" />
        </div>
      )}
    </div>
  );
}
