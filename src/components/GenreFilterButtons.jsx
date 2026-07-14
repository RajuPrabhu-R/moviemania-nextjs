// src/components/GenreFilterButtons.jsx

import React from 'react';
// Assume the genres utility is correctly path-mapped
import { TMDB_GENRES } from '../config/genres';

/**
 * Renders a row of filter buttons for searching by genre.
 * @param {object} props
 * @param {string|number|null} props.currentGenreId - The ID of the currently selected genre (read from URL).
 * @param {function} props.onGenreSelect - Callback function (genreId, genreType) => void to update the URL.
 */
const GenreFilterButtons = ({ onGenreSelect, currentGenreId }) => {
    
    // Ensure currentGenreId is treated as a string for comparison
    const activeId = String(currentGenreId);

    // Limit to 10 for a cleaner look in the search filter bar
    const displayedGenres = TMDB_GENRES.slice(0, 10);

    return (
        <div className="flex flex-wrap gap-2 mb-4 pt-2">
            <button
                // When selecting 'All', pass null for both ID and type
                onClick={() => onGenreSelect(null, null)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    activeId === 'null' || activeId === '' 
                        ? 'bg-pink-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
                All Content
            </button>
            {displayedGenres.map((genre) => (
                <button
                    key={genre.id}
                    // 💡 FIX: This onClick is the critical part that updates the URL
                    onClick={() => onGenreSelect(String(genre.id), genre.type)} 
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                        activeId === String(genre.id)
                            ? 'bg-pink-600 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    {genre.name}
                </button>
            ))}
        </div>
    );
};

export default GenreFilterButtons;
