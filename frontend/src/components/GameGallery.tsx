
import { useEffect, useRef, useState } from 'react'

import '../styles/game-gallery.css'

interface GameGalleryProps {
    title: string
    screenshots: string[]
}

function GameGallery({
                         title,
                         screenshots,
                     }: GameGalleryProps) {
    const [activeIndex, setActiveIndex] =
        useState<number | null>(null)

    const dialogRef = useRef<HTMLDialogElement>(null)
    const touchStartX = useRef<number | null>(null)

    const isOpen = activeIndex !== null
    const hasMultipleImages = screenshots.length > 1

    const activeImage =
        activeIndex !== null
            ? screenshots[activeIndex]
            : null

    function nextImage() {
        setActiveIndex((current) =>
            current === null
                ? null
                : (current + 1) % screenshots.length
        )
    }

    function previousImage() {
        setActiveIndex((current) =>
            current === null
                ? null
                : (current - 1 + screenshots.length)
                % screenshots.length
        )
    }

    function closeGallery() {
        setActiveIndex(null)
    }

    // Abre um modal nativo sem sair da página.
    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) return

        if (isOpen && !dialog.open) {
            dialog.showModal()
        }

        if (!isOpen && dialog.open) {
            dialog.close()
        }
    }, [isOpen])

    // Teclado e bloqueio da rolagem ao fundo.
    useEffect(() => {
        if (!isOpen) return

        const previousOverflow =
            document.body.style.overflow

        document.body.style.overflow = 'hidden'

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'ArrowRight') {
                event.preventDefault()
                nextImage()
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault()
                previousImage()
            }
        }

        document.addEventListener(
            'keydown',
            handleKeyDown
        )

        return () => {
            document.body.style.overflow =
                previousOverflow

            document.removeEventListener(
                'keydown',
                handleKeyDown
            )
        }
    }, [isOpen, screenshots.length])

    function handleTouchStart(
        event: React.TouchEvent<HTMLDivElement>
    ) {
        touchStartX.current =
            event.changedTouches[0]?.clientX ?? null
    }

    function handleTouchEnd(
        event: React.TouchEvent<HTMLDivElement>
    ) {
        const startX = touchStartX.current
        const endX =
            event.changedTouches[0]?.clientX

        touchStartX.current = null

        if (
            startX === null ||
            endX === undefined ||
            !hasMultipleImages
        ) {
            return
        }

        const distance = endX - startX

        if (distance < -50) {
            nextImage()
        }

        if (distance > 50) {
            previousImage()
        }
    }

    return (
        <>
            <section className="game-details__gallery">
                <h2>Galeria</h2>

                <div className="game-details__screenshots">
                    {screenshots.map((screenshot, index) => (
                        <button
                            key={screenshot}
                            type="button"
                            className="game-gallery__thumbnail"
                            onClick={() => setActiveIndex(index)}
                            aria-label={
                                `Ampliar imagem ${index + 1} de ${title}`
                            }
                        >
                            <img
                                src={screenshot}
                                alt={`Captura de tela ${index + 1} de ${title}`}
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            </section>

            <dialog
                ref={dialogRef}
                className="game-gallery__dialog"
                aria-label={`Galeria de imagens de ${title}`}
                onClose={closeGallery}
                onClick={(event) => {
                    const dialog = event.currentTarget

                    if (event.target !== dialog) return

                    const bounds =
                        dialog.getBoundingClientRect()

                    const outside =
                        event.clientX < bounds.left ||
                        event.clientX > bounds.right ||
                        event.clientY < bounds.top ||
                        event.clientY > bounds.bottom

                    if (outside) closeGallery()
                }}
            >
                <div className="game-gallery__modal">
                    <div className="game-gallery__toolbar">
                        <span aria-live="polite">
                            {activeIndex === null
                                ? 0
                                : activeIndex + 1}
                            {' / '}
                            {screenshots.length}
                        </span>

                        <div className="game-gallery__actions">
                            {activeImage && (
                                <a
                                    href={activeImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Abrir original ↗
                                </a>
                            )}

                            <button
                                type="button"
                                onClick={closeGallery}
                                aria-label="Fechar galeria"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div
                        className="game-gallery__stage"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {hasMultipleImages && (
                            <button
                                type="button"
                                className="game-gallery__nav game-gallery__nav--previous"
                                onClick={previousImage}
                                aria-label="Imagem anterior"
                            >
                                ‹
                            </button>
                        )}

                        {activeImage && (
                            <img
                                src={activeImage}
                                alt={
                                    `Imagem ampliada ${activeIndex! + 1} de ${title}`
                                }
                                draggable={false}
                            />
                        )}

                        {hasMultipleImages && (
                            <button
                                type="button"
                                className="game-gallery__nav game-gallery__nav--next"
                                onClick={nextImage}
                                aria-label="Próxima imagem"
                            >
                                ›
                            </button>
                        )}
                    </div>
                </div>
            </dialog>
        </>
    )
}

export default GameGallery
