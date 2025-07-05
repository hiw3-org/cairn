import React from "react";

const BaseLogoIcon = ({
  width = 100,
  height = 100,
  ...props
}: React.SVGProps<SVGSVGElement> & { width?: number; height?: number }) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    {...props}
  >
    <defs>
      <linearGradient id="grad-new" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" />
      </linearGradient>
    </defs>
    <object type="image/svg+xml" data="/logo.svg" className="w-24 h-24" />
  </svg>
);

export const LandingHeaderLogo = (
  props: React.HTMLAttributes<HTMLDivElement>
) => (
  <div className="flex items-center space-x-3" {...props}>
    {/* <BaseLogoIcon className="w-8 h-8 text-primary" /> */}
    <div className="flex items-center space-x-3 max-w-[300px]">
      <object type="image/svg+xml" data="/logo.svg" className="w-24 h-24" />
    </div>
    <span className="text-2xl font-extrabold text-white">CAIRN</span>
  </div>
);

export const HowItWorksHeaderLogo = (
  props: React.HTMLAttributes<HTMLDivElement>
) => (
  <div className="flex items-center space-x-3" {...props}>
    <object type="image/svg+xml" data="/logo.svg" className="w-24 h-24" />
    <span className="text-2xl font-bold text-text dark:text-text-dark">
      CAIRN / How It Works
    </span>
  </div>
);

export const AppLogo = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="flex items-center space-x-3" {...props}>
    <object type="image/svg+xml" data="/logo.svg" className="w-24 h-24" />
    <span className="text-2xl font-extrabold text-text dark:text-text-dark">
      CAIRN
    </span>
  </div>
);
