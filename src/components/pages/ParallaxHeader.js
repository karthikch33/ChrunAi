// ParallaxHeader.jsx
import { motion, useScroll, useTransform } from "framer-motion";

export default function ParallaxHeader({ children }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -12]); // subtle lift
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.92]);
  return <motion.div style={{ y, opacity }}>{children}</motion.div>;
}
