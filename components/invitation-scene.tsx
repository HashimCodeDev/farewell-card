"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
    isHovered: React.MutableRefObject<boolean>;
};

function InvitationCard({ rotationTarget, inertia, isDragging, isHovered }: CardMeshProps) {
    const { gl } = useThree();
    const cardRef = useRef<THREE.Group>(null);
    const frontLayerRef = useRef<THREE.Mesh>(null);
    const backLayerRef = useRef<THREE.Mesh>(null);
    const glowLayerRef = useRef<THREE.Mesh>(null);
    const edgeLayerRef = useRef<THREE.Mesh>(null);
    const backTexture = useTexture("/card-back.png");
    const frontTexture = useTexture("/card-front.png");

    useEffect(() => {
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy();

        frontTexture.colorSpace = THREE.SRGBColorSpace;
        backTexture.colorSpace = THREE.SRGBColorSpace;
        frontTexture.anisotropy = maxAnisotropy;
        backTexture.anisotropy = maxAnisotropy;
        frontTexture.wrapS = THREE.ClampToEdgeWrapping;
        frontTexture.wrapT = THREE.ClampToEdgeWrapping;
        backTexture.wrapS = THREE.ClampToEdgeWrapping;
        backTexture.wrapT = THREE.ClampToEdgeWrapping;
        frontTexture.magFilter = THREE.LinearFilter;
        frontTexture.minFilter = THREE.LinearMipmapLinearFilter;
        backTexture.magFilter = THREE.LinearFilter;
        backTexture.minFilter = THREE.LinearMipmapLinearFilter;
        frontTexture.generateMipmaps = true;
        backTexture.generateMipmaps = true;
        frontTexture.premultiplyAlpha = false;
        backTexture.premultiplyAlpha = false;
        frontTexture.needsUpdate = true;
        backTexture.needsUpdate = true;
    }, [frontTexture, backTexture, gl]);

    useFrame((state, delta) => {
        if (!cardRef.current) {
            return;
        }

        const card = cardRef.current;
        // Inertia feeds target rotation after release, then decays each frame.
        if (!isDragging.current) {
            rotationTarget.current.x = THREE.MathUtils.clamp(
                rotationTarget.current.x + inertia.current.x,
                -0.48,
                0.48,
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
            11.6,
            delta,
        );
        card.rotation.y = THREE.MathUtils.damp(
            card.rotation.y,
            rotationTarget.current.y,
            11.6,
            delta,
        );

        // Floating motion appears only when idle so interaction stays precise.
        const hoverLift = isHovered.current && !isDragging.current ? 0.012 : 0;
        const floatY = isDragging.current
            ? 0
            : Math.sin(state.clock.elapsedTime * 1.1) * 0.01 + hoverLift;
        const floatZ = isDragging.current ? 0 : Math.sin(state.clock.elapsedTime * 0.7) * 0.004;
        card.position.y = THREE.MathUtils.damp(card.position.y, floatY, 4.8, delta);
        card.rotation.z = THREE.MathUtils.damp(card.rotation.z, floatZ, 4.8, delta);
        const targetScale = isHovered.current && !isDragging.current ? 1.004 : 1;
        card.scale.x = THREE.MathUtils.damp(card.scale.x, targetScale, 6.8, delta);
        card.scale.y = THREE.MathUtils.damp(card.scale.y, targetScale, 6.8, delta);
        card.scale.z = THREE.MathUtils.damp(card.scale.z, targetScale, 6.8, delta);

        const yInput = THREE.MathUtils.clamp(card.rotation.y / Math.PI, -1, 1);
        const xInput = THREE.MathUtils.clamp(card.rotation.x / 0.48, -1, 1);

        if (frontLayerRef.current) {
            frontLayerRef.current.position.z = THREE.MathUtils.damp(
                frontLayerRef.current.position.z,
                0.006,
                9.2,
                delta,
            );
        }

        if (backLayerRef.current) {
            const targetX = xInput * 0.008;
            const targetY = yInput * 0.008;
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
            const glowX = xInput * 0.012;
            const glowY = yInput * 0.012;
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
            const glowMaterial = glowLayerRef.current.material as THREE.MeshStandardMaterial;
            const targetOpacity = isHovered.current ? 0.12 : 0.08;
            glowMaterial.opacity = THREE.MathUtils.damp(glowMaterial.opacity, targetOpacity, 8, delta);
        }

        if (edgeLayerRef.current) {
            const edgeMaterial = edgeLayerRef.current.material as THREE.MeshPhysicalMaterial;
            const targetOpacity = isHovered.current ? 0.28 : 0.2;
            edgeMaterial.opacity = THREE.MathUtils.damp(edgeMaterial.opacity, targetOpacity, 7.6, delta);
        }
    });

    return (
        <group ref={cardRef}>
            <RoundedBox
                args={[3.16, 2.04, 0.008]}
                radius={0.1}
                smoothness={8}
                castShadow
                receiveShadow
            >
                <meshPhysicalMaterial color="#d6c2a6" roughness={0.5} metalness={0.05} clearcoat={0.22} />
                <meshPhysicalMaterial color="#d6c2a6" roughness={0.5} metalness={0.05} clearcoat={0.22} />
                <meshPhysicalMaterial color="#d6c2a6" roughness={0.5} metalness={0.05} clearcoat={0.22} />
                <meshPhysicalMaterial color="#d6c2a6" roughness={0.5} metalness={0.05} clearcoat={0.22} />
                <meshPhysicalMaterial color="#ebdcc3" roughness={0.44} metalness={0.04} clearcoat={0.32} />
                <meshPhysicalMaterial color="#ebdcc3" roughness={0.44} metalness={0.04} clearcoat={0.32} />
            </RoundedBox>

            <mesh ref={frontLayerRef} position={[0, 0, 0.006]}>
                <planeGeometry args={[2.93, 1.82]} />
                <meshBasicMaterial
                    map={frontTexture}
                    toneMapped={false}
                    polygonOffset
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                />
            </mesh>

            <mesh ref={backLayerRef} position={[0, 0, -0.006]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[2.93, 1.82]} />
                <meshBasicMaterial
                    map={backTexture}
                    toneMapped={false}
                    polygonOffset
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                />
            </mesh>

            <mesh ref={glowLayerRef} position={[0, 0, -0.0052]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[2.95, 1.84]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.08}
                    color="#fff5df"
                    roughness={0.34}
                    metalness={0}
                />
            </mesh>

            <mesh ref={edgeLayerRef} position={[0, 0, 0.0068]}>
                <planeGeometry args={[3.02, 1.88]} />
                <meshPhysicalMaterial
                    transparent
                    opacity={0.2}
                    color="#fffdf7"
                    roughness={0.18}
                    metalness={0.06}
                    clearcoat={1}
                    transmission={0.08}
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
    const isHovered = useRef(false);
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
                    -0.48,
                    0.48,
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
        <div
            ref={sceneContainerRef}
            className="scene-frame"
            style={{ touchAction: "none" }}
            onPointerEnter={() => {
                isHovered.current = true;
            }}
            onPointerLeave={() => {
                isHovered.current = false;
            }}
        >
            <div className="scene-surface" aria-hidden />
            <Canvas
                camera={{ position: [0, 0.2, 4.5], fov: 38 }}
                dpr={isMobile ? [1.5, 2.5] : [1.5, 3]}
                gl={{ antialias: true, powerPreference: "high-performance" }}
                shadows="basic"
                onCreated={({ gl: renderer }) => {
                    renderer.outputColorSpace = THREE.SRGBColorSpace;
                    renderer.toneMapping = THREE.ACESFilmicToneMapping;
                    renderer.toneMappingExposure = 1;
                }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.56} color="#f8eddf" />
                    <hemisphereLight intensity={0.24} color="#fffaf2" groundColor="#b79970" />
                    <directionalLight
                        position={[1.8, 2.8, 4.2]}
                        intensity={1.05}
                        color="#ffe5bf"
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                    />
                    <directionalLight
                        position={[-2.6, 0.8, 3.2]}
                        intensity={0.3}
                        color="#fff0d8"
                    />
                    <directionalLight
                        position={[0, 1.6, -3.2]}
                        intensity={0.19}
                        color="#f5d6ac"
                    />

                    <InvitationCard
                        rotationTarget={rotationTarget}
                        inertia={inertia}
                        isDragging={isDragging}
                        isHovered={isHovered}
                    />

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} receiveShadow>
                        <planeGeometry args={[10, 10]} />
                        <shadowMaterial transparent opacity={0.14} />
                    </mesh>

                    <ContactShadows
                        position={[0, -1.05, 0]}
                        opacity={0.14}
                        scale={4.7}
                        blur={4}
                        far={3.8}
                        color="#4a331d"
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
