import * as React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback }) => (
  <div className="relative h-8 w-8 rounded-full bg-gray-200">
    {src ? (
      <img src={src} alt={alt} className="h-full w-full rounded-full" />
    ) : (
      <span className="flex items-center justify-center h-full w-full text-sm">
        {fallback}
      </span>
    )}
  </div>
);

export const AvatarImage = Avatar;
export const AvatarFallback = Avatar; 