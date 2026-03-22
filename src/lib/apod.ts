export type NasaApodResponse = {
  date?: string;
  title?: string;
  explanation?: string;
  copyright?: string;
  media_type?: string;
  url?: string;
  hdurl?: string;
  thumbnail_url?: string;
};

export type ResolvedApodMedia = {
  mediaType: "image" | "video" | "other";
  imageUrl?: string;
  fallbackImageUrl?: string;
  pageUrl?: string;
};

const clean = (value?: string | null) => value?.trim() || undefined;

export const resolveApodMedia = (payload: NasaApodResponse): ResolvedApodMedia => {
  const mediaType = payload.media_type === "image" || payload.media_type === "video" ? payload.media_type : "other";
  const hdurl = clean(payload.hdurl);
  const url = clean(payload.url);
  const thumbnailUrl = clean(payload.thumbnail_url);

  if (mediaType === "video") {
    return {
      mediaType,
      imageUrl: thumbnailUrl,
      fallbackImageUrl: thumbnailUrl,
      pageUrl: url,
    };
  }

  return {
    mediaType,
    imageUrl: hdurl || url || thumbnailUrl,
    fallbackImageUrl: url || thumbnailUrl || hdurl,
    pageUrl: url || hdurl,
  };
};

export const cleanApodField = clean;
