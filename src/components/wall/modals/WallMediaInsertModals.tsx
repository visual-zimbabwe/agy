"use client";

import { ImageInsertModal } from "@/components/wall/ImageInsertModal";
import { useWallModals } from "@/components/wall/session/wall-modal-context";

export const WallMediaInsertModals = () => {
  const {
    imageInsertOpen,
    imageInsertTargetLabel,
    onCloseImageInsert,
    onSelectImageFile,
    onSubmitImageUrl,
    onSelectUnsplashPhoto,
    onInsertUnsplashMoodboard,
  } = useWallModals();

  return (
    <ImageInsertModal
      open={imageInsertOpen}
      onClose={onCloseImageInsert}
      onSelectFile={onSelectImageFile}
      onSubmitUrl={onSubmitImageUrl}
      onSelectUnsplashPhoto={onSelectUnsplashPhoto}
      onInsertUnsplashMoodboard={onInsertUnsplashMoodboard}
      targetLabel={imageInsertTargetLabel}
      allowMoodboard
    />
  );
};
