/**
 * YOUTUBE PLAYLIST CONFIGURATION FILE
 * * This file maps a single YouTube Playlist ID to the starting index
 * of each season within that playlist for a specific TV show (TMDB ID 17572).
 * * NOTE: The index is 0-based. The first video in the playlist is index 0.
 */

export const YOUTUBE_PLAYLIST_CONFIG = {
    // 1. REQUIRED: Insert the ID of your main YouTube playlist here.
    // This ID is the sequence of characters found after 'list=' in the playlist URL.
    PLAYLIST_ID: 'https://youtube.com/playlist?list=PLXY-PyUP_184LS4Gn5gm71-bHR_g_OK82', // <-- **MUST UPDATE THIS**
    
    // 2. Map the TMDB ID of the TV Show (17572 in your case) to its season starting points.
    TMDB_ID_17572: {
        1: "https://youtu.be/jaICQoCJvE8",
           "https://youtu.be/Vp5j9R0Vi5s", 
    }
};
