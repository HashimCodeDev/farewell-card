"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { useEffect, useMemo, useState } from "react";

const InvitationScene = dynamic(
    () => import("@/components/invitation-scene").then((mod) => mod.InvitationScene),
    {
        ssr: false,
        loading: () => (
            <div className="scene-loader">
                <span>Preparing the invitation</span>
            </div>
        ),
    },
);

type DustParticle = {
    id: number;
    size: number;
    top: number;
    left: number;
    delay: number;
    duration: number;
};

function deterministicNoise(index: number, offset: number) {
    const value = Math.sin(index * 91.731 + offset * 19.173) * 43758.5453;
    return value - Math.floor(value);
}

function FloatingDust({ count }: { count: number }) {
    const particles = useMemo<DustParticle[]>(() => {
        return Array.from({ length: count }, (_, index) => ({
            id: index,
            size: 1 + deterministicNoise(index, 1) * 2.8,
            top: deterministicNoise(index, 2) * 100,
            left: deterministicNoise(index, 3) * 100,
            delay: deterministicNoise(index, 4) * 0.58,
            duration: 0.46 + deterministicNoise(index, 5) * 0.12,
        }));
    }, [count]);

    return (
        <div className="dust-layer" aria-hidden>
            {particles.map((particle) => (
                <span
                    key={particle.id}
                    className="dust-particle"
                    style={{
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        top: `${particle.top}%`,
                        left: `${particle.left}%`,
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                    }}
                />
            ))}
        </div>
    );
}

export function FarewellExperience() {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);
    const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
    const [isCardVisible, setIsCardVisible] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(media.matches);

        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (!isEnvelopeOpen) {
            return;
        }

        const timer = window.setTimeout(() => {
            setIsCardVisible(true);
        }, 620);

        return () => window.clearTimeout(timer);
    }, [isEnvelopeOpen]);

    const bindSwipe = useGesture(
        {
            onDrag: ({ swipe: [swipeX], movement: [moveX], last }) => {
                if (!isCardVisible) {
                    return;
                }

                if (swipeX === -1 || (last && moveX < -40)) {
                    setIsFlipped(true);
                }

                if (swipeX === 1 || (last && moveX > 40)) {
                    setIsFlipped(false);
                }
            },
        },
        {
            drag: {
                axis: "x",
                filterTaps: true,
                threshold: 6,
                swipe: {
                    distance: 36,
                    velocity: 0.14,
                },
                pointer: {
                    touch: true,
                },
            },
        },
    );

    return (
        <main className="farewell-root">
            {isMobile !== null && <FloatingDust count={isMobile ? 12 : 28} />}
            <div className="vignette" aria-hidden />
            <section className="content-shell">
                <motion.p
                    className="kicker"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.2, 0.72, 0.2, 1] }}
                >
                    National Service Scheme - Government Model Engineering College
                </motion.p>

                <motion.h1
                    className="hero-title"
                    initial={{ opacity: 0, y: 18, letterSpacing: "0.14em" }}
                    animate={{ opacity: 1, y: 0, letterSpacing: "0.08em" }}
                    transition={{ duration: 0.58, delay: 0.08, ease: [0.16, 0.78, 0.2, 1] }}
                >
                    NSS MEC - Farewell 2026
                </motion.h1>

                <motion.p
                    className="hero-note"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.18 }}
                >
                    Tap the envelope to open your invitation. Click or swipe on the card to
                    turn it over.
                </motion.p>

                <motion.div
                    className="envelope-stage"
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.12 }}
                >
                    <button
                        type="button"
                        className={`envelope ${isEnvelopeOpen ? "is-open" : ""}`}
                        onClick={() => setIsEnvelopeOpen(true)}
                        aria-label="Open invitation envelope"
                    >
                        <span className="envelope-shadow" />
                        <span className="envelope-flap" />
                        <span className="envelope-front" />
                        <span className="seal">NSS</span>
                    </button>

                    <motion.div
                        className="card-stage"
                        initial={{ opacity: 0, y: 36, scale: 0.95 }}
                        animate={
                            isCardVisible
                                ? { opacity: 1, y: 0, scale: 1 }
                                : { opacity: 0, y: 36, scale: 0.95 }
                        }
                        transition={{ duration: 0.56, ease: [0.2, 0.76, 0.2, 1] }}
                    >
                        <div className="card-gesture-layer" {...bindSwipe()}>
                            {isCardVisible && (
                                <InvitationScene
                                    isFlipped={isFlipped}
                                    onToggleFlip={() => setIsFlipped((current) => !current)}
                                    isMobile={Boolean(isMobile)}
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </section>
        </main>
    );
}
