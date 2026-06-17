"use client";

import { useEffect, useState } from "react";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

export const useIsDesktopTimelineLayout = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isDesktop;
};
