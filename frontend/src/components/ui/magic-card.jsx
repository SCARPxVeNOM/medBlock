import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "../../lib/utils";

export function MagicCard({ children, className }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, {
    stiffness: 500,
    damping: 100,
  });
  const mouseYSpring = useSpring(y, {
    stiffness: 500,
    damping: 100,
  });

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct * width);
    y.set(yPct * height);
  };

  const maskImage = useMotionTemplate`radial-gradient(350px at ${mouseXSpring}px ${mouseYSpring}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };
  
  // Reset position on mouse leave
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative flex size-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 p-8",
        className
      )}
    >
      <div className="pointer-events-none absolute -inset-px z-0 rounded-xl opacity-0 transition duration-300 group-hover:opacity-100" />
      <motion.div
        className="pointer-events-none absolute -inset-px z-10 rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={style}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </motion.div>
      {children}
    </motion.div>
  );
}

