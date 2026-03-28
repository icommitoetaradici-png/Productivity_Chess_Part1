import { useState, useEffect } from 'react';
import { openingBook, findOpening, getFromTos } from "@chess-openings/eco.json";

export interface BookMove {
    name: string;
    from: string;
    to: string;
    san: string;
}

export function useBookMoves(fen: string) {
    const [openingName, setOpeningName] = useState<string | null>(null);
    const [bookMoves, setBookMoves] = useState<BookMove[]>([]);
    const [openingsDB, setOpeningsDB] = useState<any>(null);

    // Load opening database once
    useEffect(() => {
        openingBook().then(setOpeningsDB).catch(err => console.error("Failed to load opening book", err));
    }, []);

    useEffect(() => {
        if (!openingsDB || !fen) return;

        // 1. Check if current position is in the book
        const opening = findOpening(openingsDB, fen);
        setOpeningName(opening ? opening.name : null);

        // 2. Get available theoretical moves from this position
        getFromTos(fen).then(res => {
            if (res && res.next) {
                setBookMoves(res.next.map((m: any) => ({
                    name: m.name,
                    from: m.from,
                    to: m.to,
                    san: m.san || ""
                })));
            } else {
                setBookMoves([]);
            }
        }).catch(() => setBookMoves([]));

    }, [fen, openingsDB]);

    return { openingName, bookMoves };
}