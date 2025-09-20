
"use client";

import React from 'react';
import { FileTextIcon, ChartBarIcon, GavelIcon, BookOpenIcon, HuggingFaceIcon } from '../ui/icons';
import { useAppContext } from '../../context/app-provider';
import { UserRole } from '../../lib/types';

const NavItem = ({ icon: Icon, label, isActive, onClick, disabled, notificationCount }: { icon: React.FC<any>, label: string, isActive: boolean, onClick: () => void, disabled?: boolean, notificationCount?: number }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 space-y-1 transition-colors duration-200 h-full ${
            isActive ? 'text-primary dark:text-primary-light' : 
            disabled ? 'text-hf-gray-400 dark:text-hf-gray-600 cursor-not-allowed' :
            'text-text-secondary dark:text-dark-text-secondary'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        <Icon className="w-6 h-6" />
        {notificationCount && notificationCount > 0 && (
             <span className="absolute top-0.5 right-1/2 translate-x-4 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-white text-[10px] font-bold ring-2 ring-hf-gray-100 dark:ring-hf-gray-950">
                {notificationCount}
            </span>
        )}
        <span className="text-[11px] font-semibold tracking-wide">{label}</span>
        {disabled && (
            <span className="absolute top-1 right-2 text-[9px] font-bold bg-hf-gray-200 text-hf-gray-500 dark:bg-hf-gray-700 dark:text-hf-gray-400 px-1 rounded-sm">Soon</span>
        )}
    </button>
);

export const BottomNavBar = ({ activePage, onNavigate, draftProjectsCount, newOpportunitiesCount }: { activePage: string; onNavigate: (page: string) => void; draftProjectsCount: number; newOpportunitiesCount: number; }) => {
    const { userRole } = useAppContext();

    const researcherNavItems = [
        { id: 'outputs', label: 'Reproduced', icon: BookOpenIcon },
        { id: 'projects', label: 'My Projects', icon: FileTextIcon, notificationCount: draftProjectsCount },
        { id: 'funding', label: 'Funding', icon: ChartBarIcon, notificationCount: newOpportunitiesCount },
    ];

    const funderNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
        { id: 'portfolio', label: 'Portfolio', icon: FileTextIcon },
        { id: 'dao', label: 'DAO', icon: GavelIcon, disabled: true },
    ];

    let navItems: any[] = [];
    if (userRole === UserRole.Researcher) {
        navItems = researcherNavItems;
    } else if (userRole === UserRole.Funder) {
        navItems = funderNavItems;
    }


    if (navItems.length === 0) {
        return null;
    }

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-hf-gray-100/95 dark:bg-hf-gray-950/95 backdrop-blur-lg border-t border-border dark:border-border-dark z-40">
            <nav className="flex justify-around items-stretch h-full">
                {navItems.map(item => (
                    <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={activePage === item.id}
                        onClick={() => !item.disabled && onNavigate(item.id)}
                        disabled={item.disabled}
                        notificationCount={item.notificationCount}
                    />
                ))}
            </nav>
        </div>
    );
};