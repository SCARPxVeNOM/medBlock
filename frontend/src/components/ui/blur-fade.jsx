import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function BlurFade({ children, className, delay = 0, inView = true }) {
  return (
    <motion.div
      initial={inView ? { opacity: 0, filter: "blur(10px)", y: 20 } : false}
      animate={inView ? { opacity: 1, filter: "blur(0px)", y: 0 } : false}
      transition={{ duration: 0.5, delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

