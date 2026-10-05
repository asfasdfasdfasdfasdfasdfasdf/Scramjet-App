importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = \$scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Helper function to extract YouTube video ID from Scramjet proxy requests
function getYoutubeVideoId(urlString) {
    try {
        // Look for typical YouTube watch layouts anywhere in the intercepted string
        if (!urlString.includes('://youtube.com')) return null;
        
        // Parse out the 'v' parameter using regex to ensure compatibility 
        // with Scramjet's URL obfuscation or path prefixing styles
        const match = urlString.match(/[?&]v=([^&#\b]+)/);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
}

async function handleRequest(event) {
    await scramjet.loadConfig();

    const requestUrl = event.request.url;
    const videoId = getYoutubeVideoId(requestUrl);

    // If a proxied YouTube watch link is requested, escape the proxy shell 
    // and forcefully redirect the browser tab to your native local layout
    if (videoId) {
        return new Response(
            `<html><script>window.parent.location.href = "/embed.html?v=${videoId}";</script></html>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }

    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }
    return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});
