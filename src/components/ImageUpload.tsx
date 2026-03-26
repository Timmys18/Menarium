'use client';

import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  setLoading?: (loading: boolean) => void;
}

export default function ImageUpload({ value, onChange, setLoading }: ImageUploadProps) {
  const [localLoading, setLocalLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadFiles = async (files: File[]) => {
    setLocalLoading(true);
    setLoading?.(true);

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'menarium_unsigned');

      const res = await fetch('https://api.cloudinary.com/v1_1/da2bydfle/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      uploadedUrls.push(data.secure_url);
    }

    onChange([...value, ...uploadedUrls]);

    setLocalLoading(false);
    setLoading?.(false);
  };

  const onDrop = (acceptedFiles: File[]) => {
    setUploadError(null);
    handleUploadFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    onDropRejected: () =>
      setUploadError('\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f \u0434\u043e 5MB.'),
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = value.findIndex((url) => url === active.id);
    const newIndex = value.findIndex((url) => url === over.id);

    const newOrder = arrayMove(value, oldIndex, newIndex);
    onChange(newOrder);
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium text-sm text-gray-700">{"\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f"}</label>

      <div
        {...getRootProps()}
        className={`flex items-center justify-center border border-dashed w-full h-32 rounded-xl bg-gray-50 hover:border-blue-500 transition text-muted-foreground ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Plus className="w-5 h-5 mr-2" />
        {isDragActive
          ? "\u041e\u0442\u043f\u0443\u0441\u0442\u0438\u0442\u0435 \u0434\u043b\u044f \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438"
          : "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0444\u043e\u0442\u043e (\u043f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0438\u043b\u0438 \u043a\u043b\u0438\u043a\u043d\u0438\u0442\u0435)"}
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={value} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {value.map((url, idx) => (
              <SortableImage key={url} id={url} url={url} isMain={idx === 0} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}
      {(localLoading || value.length === 0) && (
        <p className="text-sm text-muted-foreground mt-1">
          {localLoading ? "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430..." : "\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f \u043f\u043e\u043a\u0430 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b"}
        </p>
      )}
    </div>
  );
}

function SortableImage({
  id,
  url,
  isMain,
}: {
  id: string;
  url: string;
  isMain: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative cursor-grab">
      <img
        src={url}
        alt="uploaded"
        className="aspect-square object-cover rounded-lg border"
      />
      {isMain && (
        <span className="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-2 py-1 rounded">
          {"\u0413\u043b\u0430\u0432\u043d\u043e\u0435"}
        </span>
      )}
    </div>
  );
}