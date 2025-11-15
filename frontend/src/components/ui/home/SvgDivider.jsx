import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValue,
  animate,
  useAnimation,
} from "framer-motion";

/**
 * Trendy animated SVG divider with layered waves and subtle motion.
 * Props:
 *  - className: additional wrapper classes
 */
function SvgDivider({ className = "my-12", heightClass = "h-40 md:h-60" }) {
  const shouldReduceMotion = useReducedMotion();

  // Allow a developer/user override to force animations even when OS-level
  // "prefers-reduced-motion" is enabled. Useful for testing or when you
  // intentionally want motion. Enable by adding ?motion=1 to the URL or
  // set localStorage.setItem('motionOverride', '1'). Respects user's choice
  // unless explicitly overridden.
  let motionOverride = false;
  try {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      motionOverride =
        params.get("motion") === "1" ||
        window.localStorage.getItem("motionOverride") === "1";
    }
  } catch (e) {
    motionOverride = false;
  }

  // Effective reduced-motion flag used throughout this component. When
  // `effectiveReduceMotion` is true we disable decorative motion; when false
  // animations run even if the OS requested reduced motion (because of override).
  const effectiveReduceMotion = shouldReduceMotion && !motionOverride;

  // Use framer-motion global scroll for parallax
  const { scrollYProgress } = useScroll();

  // Map global scroll progress to translate values (stronger parallax)
  const backY = useTransform(scrollYProgress, [0, 1], [16, -16]);
  const frontY = useTransform(scrollYProgress, [0, 1], [10, -10]);
  const shineX = useTransform(scrollYProgress, [0, 1], ["-80%", "140%"]);

  // Smooth the motion with springs
  const springConfig = { damping: 20, stiffness: 120 };
  const backYSpring = useSpring(backY, springConfig);
  const frontYSpring = useSpring(frontY, springConfig);
  const shineXSpring = useSpring(shineX, { damping: 30, stiffness: 160 });

  // If user prefers reduced motion (and no override), disable transforms
  const backStyle = effectiveReduceMotion ? {} : { translateY: backYSpring };
  const frontStyle = effectiveReduceMotion ? {} : { translateY: frontYSpring };
  const shineStyle = effectiveReduceMotion ? {} : { translateX: shineXSpring };

  // Path variants for gentle morphing (matching point counts for smooth SMIL morph)
  const backD1 =
    "M0 40 C180 10 360 70 720 56 C1080 42 1260 12 1440 36 C1260 70 1080 100 720 84 C360 68 180 98 0 80 Z";
  const backD2 =
    "M0 36 C180 24 360 60 720 48 C1080 36 1260 8 1440 32 C1260 64 1080 96 720 80 C360 64 180 92 0 72 Z";

  const frontD1 =
    "M0 60 C220 100 420 20 720 52 C1020 84 1220 60 1440 72 C1220 100 1020 120 720 100 C420 80 220 110 0 92 Z";
  const frontD2 =
    "M0 64 C220 92 420 28 720 58 C1020 88 1220 66 1440 76 C1220 98 1020 118 720 98 C420 78 220 108 0 94 Z";

  // Morph progress tied to global scroll — creates parallax-driven morphing
  const backMorphBase = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const frontMorphBase = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  // Add a gentle idle oscillator so the divider still morphs when the page isn't scrolled
  // Use motion values + animate to avoid manual RAF loops
  const idleBack = React.useRef();
  const idleFront = React.useRef();
  const idleBackMv = useMotionValue(0);
  const idleFrontMv = useMotionValue(0);
  // Animation controls for waving motion
  const backControls = useAnimation();
  const frontControls = useAnimation();

  React.useEffect(() => {
    if (effectiveReduceMotion) return;
    // start idle morph oscillators (motion values)
    const backAnim = animate(idleBackMv, [0, 0.9, 0], {
      duration: 10,
      ease: "easeInOut",
      repeat: Infinity,
    });
    const frontAnim = animate(idleFrontMv, [0, 0.8, 0], {
      duration: 8,
      ease: "easeInOut",
      repeat: Infinity,
    });

    idleBack.current = backAnim;
    idleFront.current = frontAnim;

    // play an entrance transition first, then start the continuous waving loops
    const startWaves = async () => {
      // set initial visual state
      backControls.set({ opacity: 0, translateY: 16 });
      frontControls.set({ opacity: 0, translateY: 24 });

      // entrance animation
      await backControls.start({
        opacity: 1,
        translateY: [16, 0],
        transition: { duration: 0.8, ease: "easeOut" },
      });
      await frontControls.start({
        opacity: 1,
        translateY: [24, 0],
        transition: { duration: 0.9, ease: "easeOut" },
      });

      // continuous waving motions
      backControls.start({
        translateY: [0, -10, 0],
        rotate: [0, 0.6, 0],
        transition: { duration: 9, repeat: Infinity, ease: "easeInOut" },
      });
      frontControls.start({
        translateY: [0, -14, 0],
        rotate: [0, 0.9, 0],
        transition: { duration: 7, repeat: Infinity, ease: "easeInOut" },
      });
    };

    startWaves();

    return () => {
      backAnim && backAnim.stop && backAnim.stop();
      frontAnim && frontAnim.stop && frontAnim.stop();
      backControls.stop();
      frontControls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveReduceMotion]);

  // Blend scroll-driven morph with idle oscillator (weights chosen for natural feel)
  const combinedBackBase = useTransform([backMorphBase, idleBackMv], ([s, i]) =>
    Math.max(0, Math.min(1, s * 0.7 + i * 0.5))
  );
  const combinedFrontBase = useTransform(
    [frontMorphBase, idleFrontMv],
    ([s, i]) => Math.max(0, Math.min(1, s * 0.6 + i * 0.55))
  );

  // Smooth morph progress with springs for natural motion
  const backMorph = useSpring(combinedBackBase, {
    damping: 24,
    stiffness: 140,
  });
  const frontMorph = useSpring(combinedFrontBase, {
    damping: 26,
    stiffness: 160,
  });

  // Interpolate between path strings using the morph progress
  const backD = effectiveReduceMotion
    ? backD1
    : useTransform(backMorph, [0, 1], [backD1, backD2]);
  const frontD = effectiveReduceMotion
    ? frontD1
    : useTransform(frontMorph, [0, 1], [frontD1, frontD2]);

  return (
    // outer wrapper keeps vertical spacing, inner svg is full-bleed
    <div
      className={`w-full flex items-center justify-center overflow-hidden ${className}`}
    >
      <motion.svg
        className={`${heightClass} block`}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        role="img"
        aria-label="section divider"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "100vw",
          // centers the full-bleed svg regardless of parent padding
          marginLeft: "calc(50% - 50vw)",
        }}
      >
        <defs>
          {/* subtle drop shadow filter for depth */}
          <filter id="dropShadow" x="-50%" y="-50%" width="220%" height="220%">
            <feDropShadow
              dx="0"
              dy="16"
              stdDeviation="26"
              floodColor="#1e40af"
              floodOpacity="0.12"
            />
          </filter>

          <linearGradient id="divGrad" x1="0" x2="1">
            <stop className="g1-s1" offset="0%" stopColor="#60a5fa" />
            <stop className="g1-s2" offset="50%" stopColor="#2563eb" />
            <stop className="g1-s3" offset="100%" stopColor="#93c5fd" />
          </linearGradient>
          <linearGradient id="divGrad2" x1="0" x2="1">
            <stop className="g2-s1" offset="0%" stopColor="#2563eb" />
            <stop className="g2-s2" offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>

        {/* Back wave (slow pan) */}
        <motion.path
          className="wave-back"
          d={backD}
          fill="url(#divGrad2)"
          opacity="1"
          style={backStyle}
          animate={backControls}
        />

        {/* Front wave (faster, subtle up/down) */}
        <motion.path
          className="wave-front"
          d={frontD}
          fill="url(#divGrad)"
          opacity="1"
          filter="url(#dropShadow)"
          style={frontStyle}
          stroke="#1e40af"
          strokeOpacity={0.08}
          strokeWidth={2}
          animate={frontControls}
        />

        {/* Moving shine overlay (subtle highlight) */}
        <motion.rect
          className="divider-shine"
          x="-60%"
          y="0"
          width="60%"
          height="160"
          fill="#ffffff"
          opacity="0.12"
          style={shineStyle}
        />
      </motion.svg>

      {/* Inline styles keep this component self-contained and lightweight */}
      <style>{`
        /* Wave animations */
        /* Wave animations */
        .wave-back {
          transform-box: fill-box;
          transform-origin: center;
          animation: back-pan 9s linear infinite, wave-bob 12s ease-in-out infinite;
          will-change: transform;
          filter: drop-shadow(0 8px 20px rgba(30,64,175,0.06));
        }
        .wave-front {
          transform-box: fill-box;
          transform-origin: center;
          animation: front-float 6.5s ease-in-out infinite, wave-tilt 8.5s ease-in-out infinite;
          will-change: transform;
        }

        /* shine overlay moves left->right across the divider */
        .divider-shine {
          transform-box: fill-box;
          transform-origin: center;
          mix-blend-mode: screen;
          filter: blur(20px);
          animation: shine 5s linear infinite;
          will-change: transform, opacity;
        }

        /* subtle bobbing of waves for organic motion */
        @keyframes wave-bob {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }

        /* slow horizontal pan for background wave */
        @keyframes back-pan {
          0% { transform: translateX(0) translateY(0) scaleX(1); }
          50% { transform: translateX(-18px) translateY(-3px) scaleX(1.02); }
          100% { transform: translateX(0) translateY(0) scaleX(1); }
        }

        @keyframes front-float {
          0% { transform: translateX(0) translateY(0) scaleX(1); }
          25% { transform: translateX(12px) translateY(-8px) scaleX(1.01); }
          50% { transform: translateX(0) translateY(0) scaleX(1); }
          75% { transform: translateX(-12px) translateY(6px) scaleX(0.995); }
          100% { transform: translateX(0) translateY(0) scaleX(1); }
        }

        @keyframes wave-tilt {
          0% { transform: rotateZ(0deg); }
          50% { transform: rotateZ(0.7deg); }
          100% { transform: rotateZ(0deg); }
        }

        @keyframes shine {
          0% { transform: translateX(-40%); opacity: 0.06; }
          50% { transform: translateX(40%); opacity: 0.22; }
          100% { transform: translateX(140%); opacity: 0.06; }
        }

  /* animated gradient color shifts via stop-color (tuned to current gradients) */
  .g1-s1 { stop-color: #93c5fd; animation: gradA 8s ease-in-out infinite; }
  .g1-s2 { stop-color: #60a5fa; animation: gradB 8s ease-in-out infinite; }
  .g1-s3 { stop-color: #eff6ff; }
  .g2-s1 { stop-color: #60a5fa; animation: gradC 10s ease-in-out infinite; }
  .g2-s2 { stop-color: #e0f2ff; }

  @keyframes gradA { 0% { stop-color:#93c5fd } 50% { stop-color:#a5d8ff } 100% { stop-color:#93c5fd } }
  @keyframes gradB { 0% { stop-color:#60a5fa } 50% { stop-color:#3b82f6 } 100% { stop-color:#60a5fa } }
  @keyframes gradC { 0% { stop-color:#60a5fa } 50% { stop-color:#7cc0ff } 100% { stop-color:#60a5fa } }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .wave-back, .wave-front, .divider-shine, .g1-s1, .g1-s2, .g2-s1 {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default SvgDivider;
