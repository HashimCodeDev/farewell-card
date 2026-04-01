"use client";

import { Suspense, useEffect, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

type InvitationSceneProps = {
    isFlipped: boolean;
    onToggleFlip: () => void;
    isMobile: boolean;
};

type CardMeshProps = {
    isFlipped: boolean;
    onToggleFlip: () => void;
    parallaxTilt: MutableRefObject<{ x: number; y: number }>;
    isMobile: boolean;
};

function InvitationCard({
    isFlipped,
    onToggleFlip,
    parallaxTilt,
    isMobile,
}: CardMeshProps) {
    const cardRef = useRef<THREE.Group>(null);
    const backLayerRef = useRef<THREE.Mesh>(null);
    const glowLayerRef = useRef<THREE.Mesh>(null);
    const backTexture = useTexture("/card-back.png");
    const frontTexture = useTexture("/card-front.png");

    useFrame((state, delta) => {
        if (!cardRef.current) {
            return;
        }

        const card = cardRef.current;
        const targetRotation = isFlipped ? Math.PI : 0;
        const targetY = 0;

        card.rotation.y = THREE.MathUtils.damp(card.rotation.y, targetRotation, 9.4, delta);
        card.position.y = THREE.MathUtils.damp(card.position.y, targetY, 9.4, delta);

        const xInput = isMobile ? parallaxTilt.current.x : state.pointer.x;
        const yInput = isMobile ? parallaxTilt.current.y : state.pointer.y;

        // Move layered meshes subtly to mimic collage depth without overdoing motion.
        if (backLayerRef.current) {
            const targetX = isFlipped ? xInput * 0.03 : 0;
            const targetY = isFlipped ? yInput * 0.03 : 0;
            backLayerRef.current.position.x = THREE.MathUtils.damp(
                backLayerRef.current.position.x,
                targetX,
                9.2,
                delta,
            );
            backLayerRef.current.position.y = THREE.MathUtils.damp(
                backLayerRef.current.position.y,
                targetY,
                9.2,
                delta,
            );
        }

        if (glowLayerRef.current) {
            const glowX = isFlipped ? xInput * 0.05 : 0;
            const glowY = isFlipped ? yInput * 0.05 : 0;
            glowLayerRef.current.position.x = THREE.MathUtils.damp(
                glowLayerRef.current.position.x,
                glowX,
                9,
                delta,
            );
            glowLayerRef.current.position.y = THREE.MathUtils.damp(
                glowLayerRef.current.position.y,
                glowY,
                9,
                delta,
            );
        }
    });

    return (
        <group ref={cardRef} onClick={onToggleFlip}>
            <RoundedBox
                args={[3.16, 2.04, 0.06]}
                radius={0.08}
                smoothness={8}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color="#c3ae90" roughness={0.9} metalness={0} />
                <meshStandardMaterial color="#c3ae90" roughness={0.9} metalness={0} />
                <meshStandardMaterial color="#c3ae90" roughness={0.9} metalness={0} />
                <meshStandardMaterial color="#c3ae90" roughness={0.9} metalness={0} />
                <meshStandardMaterial map={frontTexture} roughness={0.82} metalness={0} />
                <meshStandardMaterial color="#ead8bd" roughness={0.92} metalness={0} />
            </RoundedBox>

            <mesh ref={backLayerRef} position={[0, 0, -0.034]}>
                <planeGeometry args={[2.93, 1.82]} />
                <meshStandardMaterial map={backTexture} roughness={0.84} metalness={0} />
            </mesh>

            <mesh ref={glowLayerRef} position={[0, 0, -0.031]}>
                <planeGeometry args={[2.95, 1.84]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.08}
                    color="#fff4dc"
                    roughness={0.4}
                    metalness={0}
                />
            </mesh>
        </group>
    );
}

export function InvitationScene({
    isFlipped,
    onToggleFlip,
    isMobile,
}: InvitationSceneProps) {
    const parallaxTilt = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
            const gamma = event.gamma ?? 0;
            const beta = event.beta ?? 0;

            parallaxTilt.current = {
                x: THREE.MathUtils.clamp(gamma / 45, -1, 1),
                y: THREE.MathUtils.clamp(beta / 55, -1, 1),
            };
        };

        window.addEventListener("deviceorientation", handleDeviceOrientation, true);
        return () =>
            window.removeEventListener("deviceorientation", handleDeviceOrientation, true);
    }, []);

    return (
        <div className="scene-frame">
            <Canvas
                camera={{ position: [0, 0.2, 4.5], fov: 38 }}
                dpr={isMobile ? [1, 1.5] : [1, 2]}
                shadows={THREE.PCFShadowMap}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.62} color="#f5e8d2" />
                    <directionalLight
                        position={[2.6, 3.4, 3.8]}
                        intensity={1.24}
                        color="#ffd9a0"
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                    />
                    <directionalLight
                        position={[-3, -1.4, 2]}
                        intensity={0.32}
                        color="#e5cda2"
                    />

                    <InvitationCard
                        isFlipped={isFlipped}
                        onToggleFlip={onToggleFlip}
                        parallaxTilt={parallaxTilt}
                        isMobile={isMobile}
                    />

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} receiveShadow>
                        <planeGeometry args={[10, 10]} />
                        <shadowMaterial transparent opacity={0.14} />
                    </mesh>

                    <ContactShadows
                        position={[0, -1.05, 0]}
                        opacity={0.23}
                        scale={5.5}
                        blur={2.8}
                        far={3.8}
                        color="#2f2016"
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
