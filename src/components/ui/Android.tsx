// Adapted from Magic UI's Android mockup (MIT): https://magicui.design/docs/components/android
import { useId, type SVGProps } from 'react';

interface AndroidProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Shown on the screen; a 360x800 image (or the same 9:20 ratio) fits exactly */
  src?: string;
  /** What the phone is showing, for assistive technology */
  label: string;
}

/**
 * An Android phone frame with a screenshot on its screen. Size it with CSS (e.g. w-60 h-auto).
 * Changes from Magic UI's version: the screenshot is offset to the screen's origin (it was drawn
 * at 0,0, 9px left and 14px above the screen it is clipped to), the clip path id is unique per
 * phone, and the viewBox fits the drawn frame.
 */
export function Android({ src, label, ...props }: AndroidProps) {
  // useId's punctuation (: or «») is not safe in every browser's url(#...) references
  const clipId = `android-screen-${useId().replace(/[^\w-]/g, '')}`;

  return (
    <svg viewBox="0 0 380 830" fill="none" role="img" aria-label={label} {...props}>
      <path
        d="M376 153H378C379.105 153 380 153.895 380 155V249C380 250.105 379.105 251 378 251H376V153Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      <path
        d="M376 301H378C379.105 301 380 301.895 380 303V351C380 352.105 379.105 353 378 353H376V301Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      <path
        d="M0 42C0 18.8041 18.804 0 42 0H336C359.196 0 378 18.804 378 42V788C378 811.196 359.196 830 336 830H42C18.804 830 0 811.196 0 788V42Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      <path
        d="M2 43C2 22.0132 19.0132 5 40 5H338C358.987 5 376 22.0132 376 43V787C376 807.987 358.987 825 338 825H40C19.0132 825 2 807.987 2 787V43Z"
        className="fill-white dark:fill-[#262626]"
      />
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M9.25 48C9.25 29.3604 24.3604 14.25 43 14.25H335C353.64 14.25 368.75 29.3604 368.75 48V780C368.75 798.64 353.64 813.75 335 813.75H43C24.3604 813.75 9.25 798.64 9.25 780V48Z"
          className="fill-[#E5E5E5] stroke-[#E5E5E5] stroke-[0.5] dark:fill-[#404040] dark:stroke-[#404040]"
        />
      </g>
      {src && (
        <image
          href={src}
          x="9"
          y="14"
          width="360"
          height="800"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      )}
      {/* Front camera, drawn over the screenshot */}
      <circle cx="189" cy="28" r="9" className="fill-white dark:fill-[#262626]" />
      <circle cx="189" cy="28" r="4" className="fill-[#E5E5E5] dark:fill-[#404040]" />
      <defs>
        <clipPath id={clipId}>
          <rect width="360" height="800" rx="33" ry="25" transform="translate(9 14)" />
        </clipPath>
      </defs>
    </svg>
  );
}
