import { Button, Dialog, Flex, Text, Badge } from '@radix-ui/themes';
import { GoLightBulb } from "react-icons/go";
import { type ChessApiResponse } from '../MainFunctions/MoveEngine';

const Hints = ({ game, hintData }: { game: any; hintData: ChessApiResponse | null }) => {
    const isPlayerTurn = game.chessGame.turn() === 'w';

    return (
        <>
            <Dialog.Root>
                <Dialog.Trigger>
                    <Button
                        className='px-1 flex text-xl!  gap-4 h-12! w-15! justify-center items-center py-3! bg-zinc-900! text-white rounded-full z-50 cursor-pointer'
                        disabled={!isPlayerTurn || !hintData}
                    >
                        <GoLightBulb />
                    </Button>
                </Dialog.Trigger>

                <Dialog.Content maxWidth="450px" className='bg-zinc-900! border border-zinc-800 rounded-xl shadow-2xl'>
                    <Dialog.Title className='text-white flex items-center gap-2'>
                        <GoLightBulb className="text-yellow-400" />
                        Hint
                    </Dialog.Title>

                    <Dialog.Description size="2" mb="4" className="text-zinc-400">
                        {!isPlayerTurn ? (
                            "Hints are only available during your turn (White)."
                        ) : !hintData ? (
                            "No hint available at the moment."
                        ) : (
                            <Flex direction="column" gap="3">
                                <Flex align="center" gap="2">
                                    <Text weight="bold" className="text-white">Best Move:</Text>
                                    <Badge size="3" color="green" variant="solid">{hintData.san}</Badge>
                                </Flex>
                                <Text className="italic text-zinc-300 leading-relaxed">
                                    "{hintData.text}"
                                </Text>
                                <Flex gap="2" wrap="wrap" mt="2">
                                    <Badge color="blue" variant="soft" size="1">
                                        Evaluation: {hintData.eval > 0 ? '+' : ''}{hintData.eval}
                                    </Badge>
                                    <Badge color="indigo" variant="soft" size="1">
                                        Win Chance: {hintData.winChance.toFixed(1)}%
                                    </Badge>
                                </Flex>
                            </Flex>
                        )}
                    </Dialog.Description>

                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray" className="cursor-pointer">
                                Close
                            </Button>
                        </Dialog.Close>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </>
    )
}

export default Hints