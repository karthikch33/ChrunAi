// ScrollProgress.jsx
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll(); // 0..1 page progress
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.2 });
  const hue = useTransform(scrollYProgress, [0, 1], [216, 156]); // blue->green
  const bg = useTransform(hue, (h) => `hsl(${h}, 100%, 50%)`);
  return (
    <motion.div
      style={{
        position: "fixed",
        insetInlineStart: 0,
        top: 0,
        height: 3,
        width: "100%",
        transformOrigin: "0% 50%",
        zIndex: 1000,
        background: bg,
        scaleX,
      }}
    />
  );
}
