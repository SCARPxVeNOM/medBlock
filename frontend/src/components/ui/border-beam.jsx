import { cn } from "../../lib/utils";

export function BorderBeam({ className, size = 200, duration = 15, anchor = 90, borderWidth = 1.5, colorFrom = "#ffaa40", colorTo = "#9c40ff", delay = 0 }) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } 
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        // mask styles
        "[background:linear-gradient(transparent,transparent),linear-gradient(110deg,var(--color-from),var(--color-to))] [background-clip:padding-box,border-box] [background-origin:border-box]",
        // pseudo element
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(90deg,var(--color-from),transparent,var(--color-to))] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className
      )}
    />
  );
}

