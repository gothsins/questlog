import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, TouchEvent } from 'react'

import { galleryIndex, swipeMovement } from './gameGalleryState'
import '../styles/game-gallery.css'

interface GameGalleryProps {
    title: string
    screenshots: string[]
}

function GameGallery({ title, screenshots }: GameGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const touchStartX = useRef<number | null>(null)
    const count = screenshots.length
    const currentIndex = Math.min(activeIndex, Math.max(0, count - 1))
    const activeImage = screenshots[currentIndex]

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (lightboxOpen && !dialog.open) dialog.showModal()
        if (!lightboxOpen && dialog.open) dialog.close()
    }, [lightboxOpen])

    function move(movement: number) {
        setActiveIndex((current) => galleryIndex(current, movement, count))
    }

    function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
        if (count < 2) return
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault()
            move(event.key === 'ArrowRight' ? 1 : -1)
        }
    }

    function handleTouchStart(event: TouchEvent<HTMLElement>) {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null
    }

    function handleTouchEnd(event: TouchEvent<HTMLElement>) {
        const start = touchStartX.current
        const end = event.changedTouches[0]?.clientX
        touchStartX.current = null
        if (start !== null && end !== undefined && count > 1) {
            const movement = swipeMovement(start, end)
            if (movement !== 0) {
                event.preventDefault()
                move(movement)
            }
        }
    }

    if (!count) return null

    return (
        <section
            className="game-gallery"
            aria-labelledby="game-gallery-heading"
            onKeyDown={handleKeyDown}
        >
            <div className="game-gallery__heading">
                <div>
                    <span className="game-details__eyebrow">MÍDIA DO JOGO</span>
                    <h2 id="game-gallery-heading">Explore cada detalhe</h2>
                </div>
                <span className="game-gallery__count" aria-live="polite">
                    {currentIndex + 1} / {count}
                </span>
            </div>

            <div className="game-gallery__frame">
                <button
                    type="button"
                    className="game-gallery__featured"
                    onClick={() => setLightboxOpen(true)}
                    aria-label={`Ampliar imagem ${currentIndex + 1} de ${title}`}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <img
                        src={activeImage}
                        alt={`Captura de tela ${currentIndex + 1} de ${title}`}
                    />
                    <span>Ampliar imagem ↗</span>
                </button>
                {count > 1 && (
                    <div className="game-gallery__navigation">
                        <button
                            type="button"
                            onClick={() => move(-1)}
                            aria-label="Imagem anterior"
                        >
                            ←
                        </button>
                        <button
                            type="button"
                            onClick={() => move(1)}
                            aria-label="Próxima imagem"
                        >
                            →
                        </button>
                    </div>
                )}
            </div>

            {count > 1 && (
                <div
                    className="game-gallery__rail"
                    aria-label="Selecionar imagem da galeria"
                >
                    {screenshots.map((screenshot, index) => (
                        <button
                            key={`${screenshot}-${index}`}
                            type="button"
                            className={
                                index === currentIndex
                                    ? 'game-gallery__thumb game-gallery__thumb--active'
                                    : 'game-gallery__thumb'
                            }
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Mostrar imagem ${index + 1} de ${title}`}
                            aria-current={
                                index === currentIndex ? 'true' : undefined
                            }
                        >
                            <img src={screenshot} alt="" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}

            <dialog
                ref={dialogRef}
                className="game-gallery__dialog"
                aria-label={`Galeria de imagens de ${title}`}
                onClose={() => setLightboxOpen(false)}
            >
                <div className="game-gallery__dialog-bar">
                    <span aria-live="polite">
                        {currentIndex + 1} / {count}
                    </span>
                    <div>
                        <a
                            href={activeImage}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Abrir original ↗
                        </a>
                        <button
                            type="button"
                            onClick={() => setLightboxOpen(false)}
                            aria-label="Fechar galeria"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                <div
                    className="game-gallery__dialog-stage"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {count > 1 && (
                        <button
                            type="button"
                            onClick={() => move(-1)}
                            aria-label="Imagem anterior"
                        >
                            ←
                        </button>
                    )}
                    <img
                        src={activeImage}
                        alt={`Imagem ampliada ${currentIndex + 1} de ${title}`}
                    />
                    {count > 1 && (
                        <button
                            type="button"
                            onClick={() => move(1)}
                            aria-label="Próxima imagem"
                        >
                            →
                        </button>
                    )}
                </div>
            </dialog>
        </section>
    )
}

export default GameGallery
