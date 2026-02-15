import {
  FileText,
  FileCode,
  FileImage,
  Type,
  FileJson,
  FileVideo2,
  FileAudio2,
  FileArchive,
  FileType,
  FileQuestion,
} from "lucide-react";
import React from "react";

export function getTypeFromMime(mimeType: string): string {
  mimeType = (mimeType || "").toLowerCase();
  if (mimeType.startsWith("text/html") || mimeType === "application/xhtml+xml")
    return "HTML";
  if (mimeType === "text/css") return "CSS";
  if (
    mimeType === "text/javascript" ||
    mimeType === "application/javascript" ||
    mimeType === "application/x-javascript" ||
    mimeType === "application/ecmascript" ||
    mimeType === "text/ecmascript"
  )
    return "JavaScript";
  if (
    mimeType.startsWith("image/") ||
    mimeType === "image/apng" ||
    mimeType === "image/avif" ||
    mimeType === "image/bmp" ||
    mimeType === "image/gif" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/svg+xml" ||
    mimeType === "image/tiff" ||
    mimeType === "image/webp" ||
    mimeType === "image/vnd.microsoft.icon"
  )
    return "Images";
  if (
    mimeType === "font/otf" ||
    mimeType === "font/ttf" ||
    mimeType === "font/woff" ||
    mimeType === "font/woff2" ||
    mimeType === "application/vnd.ms-fontobject"
  )
    return "Fonts";
  if (
    mimeType === "application/json" ||
    mimeType === "application/manifest+json" ||
    mimeType === "application/ld+json"
  )
    return "JSON";
  if (
    mimeType === "application/xml" ||
    mimeType === "text/xml" ||
    mimeType.endsWith("+xml")
  )
    return "XML";
  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    mimeType === "text/csv" ||
    mimeType === "text/calendar"
  )
    return "Text";
  if (
    mimeType.startsWith("video/") ||
    mimeType === "video/mp4" ||
    mimeType === "video/mpeg" ||
    mimeType === "video/x-msvideo" ||
    mimeType === "video/webm" ||
    mimeType === "video/ogg" ||
    mimeType === "video/3gpp" ||
    mimeType === "video/3gpp2" ||
    mimeType === "video/mp2t"
  )
    return "Video";
  if (
    mimeType.startsWith("audio/") ||
    mimeType === "audio/aac" ||
    mimeType === "audio/midi" ||
    mimeType === "audio/x-midi" ||
    mimeType === "audio/mpeg" ||
    mimeType === "audio/ogg" ||
    mimeType === "audio/wav" ||
    mimeType === "audio/webm" ||
    mimeType === "audio/3gpp" ||
    mimeType === "audio/3gpp2"
  )
    return "Audio";
  if (mimeType === "application/pdf") return "PDF";
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    mimeType === "application/x-7z-compressed" ||
    mimeType === "application/x-bzip" ||
    mimeType === "application/x-bzip2" ||
    mimeType === "application/gzip" ||
    mimeType === "application/x-gzip" ||
    mimeType === "application/x-tar" ||
    mimeType === "application/x-freearc" ||
    mimeType === "application/vnd.rar"
  )
    return "Archive";
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/rtf"
  )
    return "Document";
  return "Other";
}

export function getBarColorFromType(type: string): string {
  switch (type) {
    case "HTML":
      return "#ec4899"; // pink-500
    case "CSS":
      return "#3b82f6"; // blue-500
    case "JavaScript":
      return "#facc15"; // yellow-500
    case "Images":
      return "#10b981"; // green-500
    case "Fonts":
      return "#8b5cf6"; // purple-500
    case "JSON":
      return "#f97316"; // orange-500
    case "XML":
      return "#f97316"; // orange-400
    case "Text":
      return "#6b7280"; // gray-500
    case "Video":
      return "#dc2626"; // red-600
    case "Audio":
      return "#4f46e5"; // indigo-600
    case "PDF":
      return "#b91c1c"; // red-800
    case "Archive":
      return "#ca8a04"; // yellow-800
    case "Document":
      return "#1e40af"; // blue-800
    default:
      return "#6b7280"; // gray-400
  }
}

// Utility to get a color class for a given type
export function getTypeColor(type: string): string {
  switch (type) {
    case "HTML":
      return "bg-pink-500";
    case "CSS":
      return "bg-blue-500";
    case "JavaScript":
      return "bg-yellow-500";
    case "Images":
      return "bg-green-500";
    case "Fonts":
      return "bg-purple-500";
    case "JSON":
      return "bg-orange-500";
    case "XML":
      return "bg-orange-400";
    case "Text":
      return "bg-gray-500";
    case "Video":
      return "bg-red-600";
    case "Audio":
      return "bg-indigo-600";
    case "PDF":
      return "bg-red-800";
    case "Archive":
      return "bg-yellow-800";
    case "Document":
      return "bg-blue-800";
    default:
      return "bg-gray-400";
  }
}

// all types of mime types
export const MIME_TYPES = [
  "HTML",
  "CSS",
  "JavaScript",
  "Images",
  "Fonts",
  "JSON",
  "XML",
  "Text",
  "Video",
  "Audio",
  "PDF",
  "Archive",
  "Document",
  "Other",
];

export function MimeTypeIcon({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) {
  // Map type to color class (matching getTypeColor)
  const colorClass = (() => {
    switch (type) {
      case "HTML":
        return "text-pink-500";
      case "CSS":
        return "text-blue-500";
      case "JavaScript":
        return "text-yellow-500";
      case "Images":
        return "text-green-500";
      case "Fonts":
        return "text-purple-500";
      case "JSON":
        return "text-orange-500";
      case "XML":
        return "text-orange-400";
      case "Text":
        return "text-gray-500";
      case "Video":
        return "text-red-600";
      case "Audio":
        return "text-indigo-600";
      case "PDF":
        return "text-red-800";
      case "Archive":
        return "text-yellow-800";
      case "Document":
        return "text-blue-800";
      default:
        return "text-gray-400";
    }
  })();

  // Show icon with title tooltip
  return (
    <span
      title={type}
      aria-label={`${type} file type`}
      role="img"
      className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
    >
      {(() => {
        switch (type) {
          case "HTML":
            return (
              <FileText
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "CSS":
            return (
              <FileText
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "JavaScript":
            return (
              <FileCode
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "Images":
            return (
              <FileImage
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "Fonts":
            return (
              <Type
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "JSON":
            return (
              <FileJson
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "XML":
            return (
              <FileCode
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "Text":
            return (
              <FileType
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "Video":
            return (
              <FileVideo2
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "Audio":
            return (
              <FileAudio2
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "PDF":
            return (
              <FileText
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "Archive":
            return (
              <FileArchive
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          case "Document":
            return (
              <FileType
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
          default:
            return (
              <FileQuestion
                className={`h-4 w-4 mr-2 ${colorClass} ${className}`}
                aria-hidden="true"
              />
            );
        }
      })()}
    </span>
  );
}
