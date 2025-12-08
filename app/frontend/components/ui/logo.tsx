import React from "react";

export const LandingHeaderLogo = (
  props: React.HTMLAttributes<HTMLDivElement>
) => (
  <div className="flex items-center space-x-3" {...props}>
    {/* <BaseLogoIcon className="w-8 h-8 text-primary" /> */}
    <div className="flex items-center space-x-3 max-w-[300px]">
      <object type="image/svg+xml" data="/logo.svg" className="w-12 h-12  " />
    </div>
    <span className="text-2xl font-extrabold text-white">CAIRN</span>
  </div>
);

export const HowItWorksHeaderLogo = (
  props: React.HTMLAttributes<HTMLDivElement>
) => (
  <div className="flex items-center space-x-3" {...props}>
    <object type="image/svg+xml" data="/logo.svg" className="w-12 h-12" />
    <span className="text-2xl font-bold text-text dark:text-text-dark">
      CAIRN / How It Works
    </span>
  </div>
);

export const AppLogo = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="flex items-center space-x-3" {...props}>
    <object type="image/svg+xml" data="/logo.svg" className="w-12 h-12" />
    <span className="text-2xl font-extrabold text-text dark:text-text-dark">
      CAIRN
    </span>
  </div>
);
