const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(YOUTUBE_RE);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}
