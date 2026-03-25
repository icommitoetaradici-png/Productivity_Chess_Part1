import { openingBook, findOpening, getFromTos } from "@chess-openings/eco.json";

// Load all openings
const openings = await openingBook();

// Look up an opening by FEN
const opening = findOpening(
    openings,
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
);

console.log(opening?.name); // "King's Pawn Opening"
console.log(opening?.eco); // "B00"
console.log(opening?.moves); // "1. e4"

// Get next and previous positions
const { next, from } = await getFromTos(
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
);

console.log(next[0]?.name);
console.log(from[0]?.name);
const bookmove = () => {
    return (
        <div>bookmove</div>
    )
}

export default bookmove