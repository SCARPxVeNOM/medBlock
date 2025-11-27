import { cn } from "../../lib/utils";

export function ShimmerButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "group relative z-10 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:linear-gradient(110deg,transparent,transparent)] [background-clip:padding-box] transition-colors duration-300 hover:border-white/20",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute inset-0 z-0 block translate-y-[100%] bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:200%_auto] transition-transform duration-500 group-hover:translate-y-[0%]"
        )}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

