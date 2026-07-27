export const MAX_SYNCED_IMAGE_BYTES = 5_000_000;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function validateImageFile(file: File, enforceSize = true): Error | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return new Error("Choose a JPEG, PNG, WebP, GIF, or AVIF image");
  }
  if (enforceSize && file.size > MAX_SYNCED_IMAGE_BYTES) {
    return new Error("Image must be 5 MB or smaller");
  }
  return null;
}

export function imageExtensionFor(file: File): string {
  return IMAGE_EXTENSIONS[file.type] ?? "jpg";
}
