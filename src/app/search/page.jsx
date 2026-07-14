"use client";


import React, { useState } from "react";
import SearchWrapper from "@/components/SearchWrapper";

export default function SearchPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [liveSearhResults, setLiveSearchResults] = useState([]);

    const handleLiveSearch = async (term) => {
        console.log("Live searhing for:", term);    
    };

    const closeLiveSearch = () => {
        setLiveSearchResults([]);
    };

    return(
        <main className="min-h-screen bg-black w-full">
            <SearchWrapper
                isMenuOpen={isMenuOpen}
                liveSearchResults={liveSearhResults}
                onLiveSearch={handleLiveSearch}
                onCloseLiveSearch={closeLiveSearch}
            />
        </main>
    )
}