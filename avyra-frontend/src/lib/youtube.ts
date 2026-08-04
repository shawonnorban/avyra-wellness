/**
 * Converts any YouTube URL shape into a privacy-preserving embed URL.
 * Shared by the landing-page video block and the standalone campaign page.
 */
export function youtubeEmbed(url: string): string {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&\n?#]+)/,
  );

  if (!match) return url;

  return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=0&controls=1&modestbranding=1&rel=0&playsinline=1`;
}
