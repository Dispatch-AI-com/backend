export function getYouTubeEmbedUrl(videoUrl?: string): string | null {
    if (videoUrl === undefined || videoUrl.trim() === '') {
        return null;
    }

    const youtubeRegex =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;

    const match = videoUrl.match(youtubeRegex);
    if (match === null) {
        return null;
    }

    const videoId = match[1];
    if (videoId.length !== 11) {
        return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
}
