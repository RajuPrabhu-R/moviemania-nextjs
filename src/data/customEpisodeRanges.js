// The key for this object is the TMDB TV ID.
export const CUSTOM_EPISODE_RANGES = {
    // TMDB ID: 31910 (Naruto Shippuden)
    "31910": {
        start: {
            1: 1, 2: 33, 3: 54, 4: 72, 5: 89, 6: 113,
            7: 144, 8: 152, 10: 197, 12: 243, 13: 276,
            14: 296, 15: 321, 16: 349, 17: 362, 18: 373,
            19: 394, 20: 414,
        },
        end: {
            1: 32, 2: 53, 3: 71, 4: 88, 5: 112, 6: 143,
            7: 151, 8: 175, 10: 221, 12: 275, 13: 295,
            14: 320, 15: 348, 16: 361, 17: 372, 18:393, 
            19:413, 20: 500
        }
    },
    // TMDB ID: 46260
    "46260": {
        start: {
            1: 1, 2: 53, 3: 105, 4: 159,
        },
        end: {
            1: 52, 2: 104, 3: 158, 4: 220
        }
    }
    // Add any future shows (like Dragon Ball Z, One Piece, etc.) here
};
