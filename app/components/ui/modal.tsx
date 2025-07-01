"use client";

import { CloseIcon } from './icons';

const IconButton = ({ onClick, children, className = '' }: { onClick: () => void, children: React.ReactNode, className?: string }) => (
    <button onClick={onClick} className={`p-2 rounded-full hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700 transition-colors ${className}`}>
        {children}
    </button>
);

export const Modal = ({ children, onClose, title, footer }: { children: React.ReactNode, onClose: () => void, title: string, footer?: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-cairn-gray-50 dark:bg-cairn-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-modal-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-cairn-gray-200 dark:border-cairn-gray-800 flex-shrink-0">
                <h2 className="text-xl font-semibold">{title}</h2>
                <IconButton onClick={onClose}><CloseIcon className="w-6 h-6" /></IconButton>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">{children}</div>
            {footer && (
                <div className="p-4 border-t border-cairn-gray-200 dark:border-cairn-gray-800 flex-shrink-0 bg-cairn-gray-100/50 dark:bg-cairn-gray-800/50 rounded-b-2xl">
                    {footer}
                </div>
            )}
        </div>
    </div>
);