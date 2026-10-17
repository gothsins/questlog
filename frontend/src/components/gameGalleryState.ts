export function galleryIndex(
    current: number,
    movement: number,
    length: number,
): number {
    if (length <= 0) return 0
    return (((current + movement) % length) + length) % length
}

export function swipeMovement(startX: number, endX: number): number {
    const distance = endX - startX
    if (Math.abs(distance) < 50) return 0
    return distance < 0 ? 1 : -1
}
