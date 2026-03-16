export const IMAGE_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

const supportedImageExtensions = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const supportedImageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const getExtension = (filename: string) => {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
};

export const isSupportedImageFile = (file: File) => {
  if (supportedImageMimeTypes.has(file.type)) {
    return true;
  }
  return supportedImageExtensions.has(getExtension(file.name));
};

export const readImageFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read selected image."));
    reader.readAsDataURL(file);
  });

export const getImageFilesFromDataTransfer = (dataTransfer: DataTransfer | null) => {
  if (!dataTransfer?.files?.length) {
    return [] as File[];
  }
  return Array.from(dataTransfer.files).filter(isSupportedImageFile);
};

export const getImageFileFromClipboard = (clipboardData: DataTransfer | null) => {
  if (!clipboardData?.items?.length) {
    return undefined;
  }

  for (const item of Array.from(clipboardData.items)) {
    if (!item.type.startsWith("image/")) {
      continue;
    }
    const file = item.getAsFile();
    if (file && isSupportedImageFile(file)) {
      return file;
    }
  }

  return undefined;
};
