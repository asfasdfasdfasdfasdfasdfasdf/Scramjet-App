importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = \$scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Extract YouTube Video ID ONLY if it is a Short
function getYoutubeShortsId(decodedUrlStr) {
    try {
        const url = new URL(decodedUrlStr);
        
        // Target only mobile/desktop shorts URLs (e.g., ://youtube.com)
        if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/shorts/')) {
            const parts = url.pathname.split('/');
            // parts[0] is "", parts[1] is "shorts", parts[2] is the video ID
            return parts[2] || null;
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
            const videoId = getYoutubeShortsId(decodedUrlStr);

            // If a YouTube Short path is caught, seamlessly convert it to a standard watch page
            if (videoId) {
                // FIXED: Converts Shorts to watch layout and appends the force autoplay instruction
                const proxiedWatchUrl = `https://youtube.com{videoId}&autoplay=1`;
                
                const newRequest = new Request(scramjet.prefix + scramjet.codec.encode(proxiedWatchUrl), {
                    method: event.request.method,
                    headers: event.request.headers,
                    credentials: event.request.credentials
                });
                return scramjet.fetch(newRequest);
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
