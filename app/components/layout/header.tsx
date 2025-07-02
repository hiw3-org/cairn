"use client";

import { UserRole } from '../../lib/types';
import { AppLogo } from '../ui/logo';
import { SunIcon, MoonIcon, WalletIcon } from '../ui/icons';
import { useAppContext } from '../../context/app-provider';

const IconButton = ({ onClick, children, className = '' }: { onClick?: () => void, children: React.ReactNode, className?: string }) => (
    <button onClick={onClick} className={`p-2 rounded-full hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700/60 transition-colors ${className}`}>
        {children}
    </button>
);

export default function Header() {
    const { userRole, setUserRole, isDarkMode, setIsDarkMode, currentUser } = useAppContext();
    return (
        <header className="sticky top-0 z-40 bg-cairn-gray-25/70 dark:bg-cairn-gray-900/70 backdrop-blur-lg border-b border-cairn-gray-200/80 dark:border-cairn-gray-800/80 shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <AppLogo />
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="bg-cairn-gray-200/70 dark:bg-cairn-gray-800/70 p-1 rounded-full flex items-center">
                            <button
                                onClick={() => setUserRole(UserRole.Scientist)}
                                className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-300 ${userRole === UserRole.Scientist ? 'bg-white dark:bg-cairn-gray-950 shadow-md' : 'text-cairn-gray-600 dark:text-cairn-gray-400 hover:text-cairn-gray-800 dark:hover:text-cairn-gray-200'}`}
                            >
                                👩‍🔬 Scientist
                            </button>
                            <button
                                onClick={() => setUserRole(UserRole.Funder)}
                                className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-300 ${userRole === UserRole.Funder ? 'bg-white dark:bg-cairn-gray-950 shadow-md' : 'text-cairn-gray-600 dark:text-cairn-gray-400 hover:text-cairn-gray-800 dark:hover:text-cairn-gray-200'}`}
                            >
                                💰 Funder
                            </button>
                        </div>
                        <IconButton onClick={() => setIsDarkMode(!isDarkMode)}>
                            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                        </IconButton>
                        <div className="hidden sm:flex items-center space-x-2 p-2 rounded-full bg-cairn-gray-100 dark:bg-cairn-gray-800/70 border border-cairn-gray-200 dark:border-cairn-gray-700">
                            <WalletIcon className="w-5 h-5 text-cairn-blue-600 dark:text-cairn-blue-400"/>
                            <span className="font-mono text-sm">{currentUser.walletAddress}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};