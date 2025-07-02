
import React from 'react';

const BaseLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
     <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
         <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgb(96 165 250)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgb(37 99 235)', stopOpacity: 1 }} />
            </linearGradient>
             <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="stop-color-cairn-blue-400" />
                <stop offset="100%" className="stop-color-cairn-blue-600" />
            </linearGradient>
        </defs>
        <g fill="url(#grad2)">
            {/* Body - trapezoid shape */}
            <path d="M25,85 h50 l10,-40 h-70 Z" />
            {/* Head - circle */}
            <circle cx="50" cy="30" r="18" />
        </g>
    </svg>
);

export const LandingHeaderLogo = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div className="flex items-center space-x-3" {...props}>
        <BaseLogoIcon className="w-8 h-8" />
        <span className="text-2xl font-bold text-cairn-gray-900 dark:text-cairn-gray-100">CAIRN</span>
    </div>
);

export const HowItWorksHeaderLogo = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div className="flex items-center space-x-3" {...props}>
        <BaseLogoIcon className="w-8 h-8" />
        <span className="text-2xl font-bold text-cairn-gray-900 dark:text-cairn-gray-100">CAIRN / How It Works</span>
    </div>
);

export const AppLogo = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div className="flex items-center space-x-3" {...props}>
        <BaseLogoIcon className="w-8 h-8" />
        <span className="text-2xl font-bold text-cairn-gray-900 dark:text-cairn-gray-100">CAIRN</span>
    </div>
);