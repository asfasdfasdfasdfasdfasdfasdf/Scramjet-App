importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = \$scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Extract YouTube Video ID after Scramjet decodes the URL layout
function getYoutubeVideoId(decodedUrlStr) {
    try {
        const url = new URL(decodedUrlStr);
        
        // Match standard watch URLs (://youtube.com)
        if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
            return url.searchParams.get('v');
        }
        
        // Match mobile shorts URLs (://youtube.com)
        if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/shorts/')) {
            const parts = url.pathname.split('/');
            return parts[2] || null;
        }
        
        // Match short links (youtu.be/ID)
        if (url.hostname === 'youtu.be') {
            return url.pathname.substring(1);
        }
    } catch (e) {
        return null;
    }
    return null;
}

async function handleRequest(event) {
    await scramjet.loadConfig();

    const requestUrl = event.request.url;
    
    // Check if the current incoming route belongs to the Scramjet proxy pipeline
    if (scramjet.route(event)) {
        try {
            // Use Scramjet's built-in codec to extract the literal destination URL string
            const decodedUrlStr = scramjet.codec.decode(scramjet.stripPrefix(requestUrl));
            const videoId = getYoutubeVideoId(decodedUrlStr);

            // If a YouTube video watch path is caught, break the iframe container 
            // and pass the clean video ID to your native client player page
            if (videoId) {
                return new Response(
                    `<html><script>window.parent.location.href = "/embed.html?v=${videoId}";</script></html>`,
                    { headers: { "Content-Type": "text/html" } }
                );
            }
        } catch (err) {
            console.error("Failed to decode proxy path:", err);
        }

        return scramjet.fetch(event);
    }
    
    return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});
