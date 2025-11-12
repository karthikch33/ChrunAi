// AnimatedBullets.jsx
import { motion, AnimatePresence } from "framer-motion";

const list = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, y: 6, scale: 0.98, filter: "blur(3px)", transition: { duration: 0.12 } },
};

export default function AnimatedBullets({ sentences }) {
  return (
    <motion.ul
      variants={list}
      initial="hidden"
      whileInView="show"
      viewport={{ amount: 0.25, once: false }}
      style={{ margin: 0, paddingInlineStart: 18, display: "grid", gap: 8 }}
    >
      <AnimatePresence initial={false}>
        {sentences.map((s, idx) => (
          <motion.li key={`${idx}-${s.slice(0, 24)}`} variants={item} exit="exit" style={{ lineHeight: 1.45 }}>
            {s}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
