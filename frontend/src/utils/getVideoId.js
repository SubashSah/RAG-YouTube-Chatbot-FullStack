export function getVideoId(url) {
    const match = url.match(/v=([^&]+)/);
    return match ? match[1] : null;
}