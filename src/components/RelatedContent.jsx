"use client";

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from "lucide-react";

const createSlug = (title) => {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const RelatedContent = ({ recommendations }) => {
    const router = useRouter();

    const handleItemClick = useCallback((item) => {
        const itemType = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie';
        const itemTitle = item.title || item.name;
        const slug = createSlug(itemTitle);

        router.push(`/movie/${item.id}/${slug}?type=${itemType}`); 
        window.scrollTo(0, 0);
    }, [router]);

    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="p-4 sm:p-6 text-gray-500 text-sm">
                No similar content found.
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-row overflow-x-auto gap-4 pb-4 snap-x">
                {recommendations.map(item => {
                    const posterUrl = item.poster_path ? 
                        `https://image.tmdb.org/t/p/w300${item.poster_path}` : 
                        '/No-Poster.png';

                    return (
                        <div 
                            key={item.id} 
                            onClick={() => handleItemClick(item)}
                            className="flex-none w-[140px] sm:w-[160px] md:w-[180px] group cursor-pointer transition transform duration-300 hover:scale-[1.05] rounded-lg overflow-hidden relative bg-white/5 border border-white/5 snap-start"
                        >
                            <div className="aspect-[2/3] overflow-hidden">
                                <img 
                                    src={posterUrl} 
                                    alt={item.title || item.name} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>

                            <div className="p-3">
                                <p className="text-xs font-bold line-clamp-1 text-gray-200 group-hover:text-white transition-colors">
                                    {item.title || item.name}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-[10px] text-gray-500">
                                        {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                                    </p>
                                    <p className="text-[10px] text-gray-400 flex items-center">
                                        <Star size={10} className="text-yellow-500 fill-yellow-500 mr-1" />
                                        {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RelatedContent;


