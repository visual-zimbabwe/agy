export type UnsplashPhoto = {
  id: string;
  alt: string;
  description?: string;
  width: number;
  height: number;
  color?: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
  };
  user: {
    name: string;
    username: string;
    profileUrl: string;
  };
  links: {
    html: string;
    downloadLocation: string;
  };
};

export type UnsplashSearchResponse = {
  total: number;
  totalPages: number;
  results: UnsplashPhoto[];
};

export const UNSPLASH_REFERRAL_SOURCE = "idea-wall";

export const withUnsplashAttributionParams = (url: string) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", UNSPLASH_REFERRAL_SOURCE);
    parsed.searchParams.set("utm_medium", "referral");
    return parsed.toString();
  } catch {
    return url;
  }
};
