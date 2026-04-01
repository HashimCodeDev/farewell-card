"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox, useTexture } from "@react-three/drei";
import { useGesture } from "@use-gesture/react";
import * as THREE from "three";

type InvitationSceneProps = {
    isMobile: boolean;
};

type CardMeshProps = {
    rotationTarget: React.MutableRefObject<{ x: number; y: number }>;
    inertia: React.MutableRefObject<{ x: number; y: number }>;
    isDragging: React.MutableRefObject<boolean>;
};

function InvitationCard({ rotationTarget, inertia, isDragging }: CardMeshProps) {
    const cardRef = useRef<THREE.Group>(null);
    const frontLayerRef = useRef<THREE.Mesh>(null);
    const backLayerRef = useRef<THREE.Mesh>(null);
    const glowLayerRef = useRef<THREE.Mesh>(null);
    const backTexture = useTexture("/card-back.png");
    const frontTexture = useTexture("/card-front.png");

    useEffect(() => {
        frontTexture.colorSpace = THREE.SRGBColorSpace;
        backTexture.colorSpace = THREE.SRGBColorSpace;
        frontTexture.anisotropy = 8;
        backTexture.anisotropy = 8;
    }, [frontTexture, backTexture]);

    useFrame((state, delta) => {
        if (!cardRef.current) {
            return;
        }

        const card = cardRef.current;
        // Inertia feeds target rotation after release, then decays each frame.
        if (!isDragging.current) {
            rotationTarget.current.x = THREE.MathUtils.clamp(
                rotationTarget.current.x + inertia.current.x,
                -0.62,
                0.62,
            );
            rotationTarget.current.y = THREE.MathUtils.clamp(
                rotationTarget.current.y + inertia.current.y,
                -Math.PI,
                Math.PI,
            );

            const decay = Math.pow(0.9, delta * 60);
            inertia.current.x *= decay;
            inertia.current.y *= decay;
        }

        // Damping gives weighted, smooth motion from current to target rotation.
        card.rotation.x = THREE.MathUtils.damp(
            card.rotation.x,
            rotationTarget.current.x,
            10,
            delta,
        );
        card.rotation.y = THREE.MathUtils.damp(
            card.rotation.y,
            rotationTarget.current.y,
            10,
            delta,
        );

        // Floating motion appears only when idle so interaction stays precise.
        const floatY = isDragging.current ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.045;
        const floatZ = isDragging.current ? 0 : Math.sin(state.clock.elapsedTime * 0.7) * 0.014;
        card.position.y = THREE.MathUtils.damp(card.position.y, floatY, 4.8, delta);
        card.rotation.z = THREE.MathUtils.damp(card.rotation.z, floatZ, 4.8, delta);

        const yInput = THREE.MathUtils.clamp(card.rotation.y / Math.PI, -1, 1);
        const xInput = THREE.MathUtils.clamp(card.rotation.x / 0.62, -1, 1);

        if (frontLayerRef.current) {
            frontLayerRef.current.position.z = THREE.MathUtils.damp(
                frontLayerRef.current.position.z,
                0.034,
                9.2,
                delta,
            );
        }

        if (backLayerRef.current) {
            const targetX = xInput * 0.03;
            const targetY = yInput * 0.03;
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
            const glowX = xInput * 0.05;
            const glowY = yInput * 0.05;
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
        <group ref={cardRef}>
            <RoundedBox
                args={[3.16, 2.04, 0.06]}
                radius={0.08}
                smoothness={6}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color="#c3ae90" roughness={0.9} metalness={0} />
                <meshStandardMaterial color="#c3ae90" roughness={0.9} metalness={0} />
                <meshStandardMaterial color="#c3ae90" roughness={0.9} metalness={0} />
                <meshStandardMaterial color="#c3ae90" roughness={0.9} metalness={0} />
                <meshStandardMaterial color="#ead8bd" roughness={0.92} metalness={0} />
                <meshStandardMaterial color="#ead8bd" roughness={0.92} metalness={0} />
            </RoundedBox>

            <mesh ref={frontLayerRef} position={[0, 0, 0.034]}>
                <planeGeometry args={[2.93, 1.82]} />
                <meshStandardMaterial
                    map={frontTexture}
                    roughness={0.82}
                    metalness={0}
                    polygonOffset
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                />
            </mesh>

            <mesh ref={backLayerRef} position={[0, 0, -0.034]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[2.93, 1.82]} />
                <meshStandardMaterial
                    map={backTexture}
                    roughness={0.84}
                    metalness={0}
                    polygonOffset
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                />
            </mesh>

            <mesh ref={glowLayerRef} position={[0, 0, -0.031]} rotation={[0, Math.PI, 0]}>
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
    isMobile,
}: InvitationSceneProps) {
    const sceneContainerRef = useRef<HTMLDivElement>(null);
    const rotationTarget = useRef({ x: 0, y: 0 });
    const inertia = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useGesture(
        {
            onDrag: ({ first, movement: [mx, my], delta: [dx, dy], timeDelta, last }) => {
                const rotateSpeed = 0.0058;

                if (first) {
                    isDragging.current = true;
                    dragStart.current.x = rotationTarget.current.x;
                    dragStart.current.y = rotationTarget.current.y;
                    inertia.current.x = 0;
                    inertia.current.y = 0;
                }

                // Gesture movement maps directly to 3D rotation targets.
                rotationTarget.current.y = THREE.MathUtils.clamp(
                    dragStart.current.y + mx * rotateSpeed,
                    -Math.PI,
                    Math.PI,
                );
                rotationTarget.current.x = THREE.MathUtils.clamp(
                    dragStart.current.x + my * rotateSpeed,
                    -0.62,
                    0.62,
                );

                if (last) {
                    isDragging.current = false;

                    // Use final drag speed to inject a tiny post-release inertia.
                    const dt = Math.max(timeDelta, 16);
                    inertia.current.y = THREE.MathUtils.clamp((dx / dt) * 0.034, -0.035, 0.035);
                    inertia.current.x = THREE.MathUtils.clamp((dy / dt) * 0.034, -0.02, 0.02);
                }
            },
        },
        {
            target: sceneContainerRef,
            drag: {
                filterTaps: true,
                threshold: 2,
                pointer: {
                    touch: true,
                },
            },
        },
    );

    return (
        <div ref={sceneContainerRef} className="scene-frame" style={{ touchAction: "none" }}>
            <Canvas
                camera={{ position: [0, 0.2, 4.5], fov: 38 }}
                dpr={isMobile ? [1, 1.5] : [1, 2]}
                gl={{ antialias: true, powerPreference: "high-performance" }}
                shadows="basic"
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.52} color="#f5e8d2" />
                    <directionalLight
                        position={[2.6, 3.4, 3.8]}
                        intensity={1.16}
                        color="#ffd9a0"
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                    />
                    <directionalLight
                        position={[-3, -1.4, 2]}
                        intensity={0.28}
                        color="#e5cda2"
                    />

                    <InvitationCard
                        rotationTarget={rotationTarget}
                        inertia={inertia}
                        isDragging={isDragging}
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
