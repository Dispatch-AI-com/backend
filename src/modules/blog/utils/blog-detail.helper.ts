export function getYouTubeEmbedUrl(videoUrl?: string): string | null {
    if (videoUrl === null || videoUrl === undefined || videoUrl.trim() === '') return null;

    const youtubeRegex =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;

    const match = videoUrl.match(youtubeRegex);
    return match?.[1]
        ? `https://www.youtube.com/embed/${match[1]}`
        : null;
}
