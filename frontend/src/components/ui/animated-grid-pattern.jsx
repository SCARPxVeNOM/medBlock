import { useId } from "react";
import { cn } from "../../lib/utils";

export function AnimatedGridPattern({ numSquares = 30, maxOpacity = 0.5, className, ...props }) {
  const id = useId();
  const patternId = `grid-pattern-${id}`;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={patternId}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x="50%"
          y="50%"
          patternTransform="translate(-50, -50)"
        >
          <path d="M.5 40V.5H40" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <svg x="50%" y="50%" className="overflow-visible">
        {Array.from({ length: numSquares }, (_, i) => (
          <rect
            key={`${i}-${id}`}
            width="10"
            height="10"
            x={-5}
            y={-5}
            className="animate-grid-pulse fill-gray-400/50 stroke-gray-400/50"
            style={{
              animationDelay: `${i * 0.05}s`,
              animationFillMode: "backwards",
            }}
          />
        ))}
      </svg>
    </svg>
  );
}

