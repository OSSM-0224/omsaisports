import { useId } from "react";

type Props = {
  madeFor: string;
};

export default function FloorRing({ madeFor }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pathId = `dsv-ring-path-${rawId}`;
  const label = `OM SAI SPORTS • JERSEY MAKERS SINCE 2000 • MADE FOR ${madeFor.toUpperCase()} • `;

  return (
    <div className="dsv-floor" aria-hidden="true">
      <div className="dsv-floor-ring">
        <div className="dsv-floor-ring-spin">
          <svg viewBox="0 0 600 600" role="presentation" focusable="false">
            <defs>
              <path
                id={pathId}
                d="M300,300 m-236,0 a236,236 0 1,1 472,0 a236,236 0 1,1 -472,0"
              />
            </defs>
            <circle cx="300" cy="300" r="236" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <text>
              <textPath href={`#${pathId}`} startOffset="0%">
                {label.repeat(3)}
              </textPath>
            </text>
          </svg>
        </div>
      </div>
      <div className="dsv-contact-shadow" />
    </div>
  );
}
