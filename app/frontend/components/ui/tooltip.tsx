import React from "react";

export const Tooltip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => (
  <div className="relative group/tooltip inline-block">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs text-center px-4 py-2 bg-black bg-opacity-90 text-white dark:bg-white dark:bg-opacity-95 dark:text-black text-sm font-semibold rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20">
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-black dark:border-t-white"></div>
    </div>
  </div>
);
