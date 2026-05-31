import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const avatarCache = new Map<string, string>();

export function getAvatarUrl(path: string | null | undefined): string {
  // Priority 1: Check for the authoritative binary blob cache first
  const binaryBlob = (window as any)._avatarBlobCache;
  if (binaryBlob) return binaryBlob;

  if (!path) return "";
  
  if (avatarCache.has(path)) {
    return avatarCache.get(path)!;
  }

  let fullUrl = "";
  if (path.startsWith("https") || path.startsWith("blob:") || path.startsWith("data:")) {
    fullUrl = path;
  } else {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    const cleanBase = baseUrl.replace(/\/$/, "");
    const cleanPath = path.replace(/^\//, "");
    fullUrl = `${cleanBase}/${cleanPath}`;
  }

  avatarCache.set(path, fullUrl);
  return fullUrl;
}
