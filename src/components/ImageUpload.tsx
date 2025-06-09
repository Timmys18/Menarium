'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface ImageUploadProps {
  onChange: (files: File[]) => void;
}

export default function ImageUpload({ onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string[]>([]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
    },
    onDrop: (acceptedFiles) => {
      onChange(acceptedFiles);
      setPreview(
        acceptedFiles.map((file) => URL.createObjectURL(file))
      );
    },
  });

  return (
    <div
      {...getRootProps()}
      className="w-full h-48 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
    >
      <input {...getInputProps()} />
      {preview.length === 0 ? (
        <p className="text-muted-foreground text-sm">Перетащите изображения или кликните для загрузки</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto p-2">
          {preview.map((url, index) => (
            <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
