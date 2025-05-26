export function getYouTubeEmbedUrl(videoUrl?: string): string | null {
    if (!videoUrl) return null;

    // Handle both youtube.com and youtu.be formats
    const youtubeRegex =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;

    const match = videoUrl.match(youtubeRegex);
    if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }

    return null;
}
