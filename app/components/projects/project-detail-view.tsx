"use client";

import { Project, Reproducibility } from '../../lib/types';
import { ChevronLeftIcon, PlusIcon, CodeIcon, LinkIcon } from '../ui/icons';
import { StatusBadge } from '../ui/status-badge';
import PoRModule from './por-module';
import { OutputListItem } from './output-list-item';
import { useAppContext } from '../../context/app-provider';
import { GenerativePlaceholder } from '../ui/generative-placeholder';

export const ProjectDetailView = ({
    project,
    onBack,
    onPorSubmitClick,
    onAddOutputClick,
    onViewReproducibility,
}: {
    project: Project,
    onBack: () => void,
    onPorSubmitClick: () => void,
    onAddOutputClick: () => void,
    onViewReproducibility: (rep: Reproducibility) => void,
}) => {
    const { currentUser } = useAppContext();
    const isOwner = project.ownerId === currentUser.walletAddress;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
            <button onClick={onBack} className="flex items-center space-x-2 text-sm text-cairn-blue-600 dark:text-cairn-blue-400 font-semibold mb-6 hover:underline">
                <ChevronLeftIcon className="w-5 h-5" />
                <span>Back to Dashboard</span>
            </button>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Project Header */}
                     <div className="bg-white dark:bg-cairn-gray-900 rounded-xl shadow-xl overflow-hidden border border-cairn-gray-200 dark:border-cairn-gray-800">
                        <GenerativePlaceholder projectId={project.id} className="w-full h-64"/>
                        <div className="p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold">{project.title}</h2>
                                    {project.organization && (
                                        <p className="text-lg font-semibold text-cairn-blue-600 dark:text-cairn-blue-400 mt-1">{project.organization}</p>
                                    )}
                                    {project.additionalInfoUrl && (
                                        <div className="mt-2">
                                            <a href={project.additionalInfoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm text-cairn-blue-600 dark:text-cairn-blue-400 font-semibold hover:underline">
                                                <LinkIcon className="w-4 h-4" />
                                                <span>Contributor Info</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <StatusBadge status={project.status} />
                            </div>
                            <p className="text-md text-cairn-gray-500 dark:text-cairn-gray-400 mt-1">{project.domain}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {project.tags.map(tag => (
                                    <span key={tag} className="bg-cairn-blue-100 text-cairn-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-cairn-blue-900/50 dark:text-cairn-blue-300">{tag}</span>
                                ))}
                            </div>
                            <p className="mt-4 text-base text-cairn-gray-600 dark:text-cairn-gray-300">{project.description}</p>
                            <div className="mt-6 pt-4 border-t border-cairn-gray-200 dark:border-cairn-gray-700 font-mono text-xs text-cairn-gray-400">
                                <p>Owner: {project.ownerId}</p>
                                <p>CID: {project.cid}</p>
                            </div>
                        </div>
                    </div>

                    {/* Outputs Section */}
                     <div className="bg-white dark:bg-cairn-gray-900 rounded-xl shadow-xl p-8 border border-cairn-gray-200 dark:border-cairn-gray-800">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-xl font-semibold">Research Outputs ({project.outputs.length})</h3>
                       </div>
                        {project.outputs.length > 0 ? (
                            <ul className="divide-y divide-cairn-gray-200 dark:divide-cairn-gray-700">
                                {project.outputs.map(output => (
                                    <OutputListItem key={output.id} output={output} />
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 px-6 border-2 border-dashed border-cairn-gray-200 dark:border-cairn-gray-700 rounded-lg bg-cairn-gray-50 dark:bg-cairn-gray-800/50">
                                <CodeIcon className="mx-auto h-12 w-12 text-cairn-gray-400" />
                                <h4 className="mt-4 text-lg font-semibold text-cairn-gray-900 dark:text-white">No Outputs Yet</h4>
                                <p className="mt-1 text-sm text-cairn-gray-500 dark:text-cairn-gray-400">
                                    {isOwner ? "Add research outputs to make this project active and reviewable." : "The researcher has not recorded any outputs for this project yet."}
                                </p>
                                {isOwner && project.outputs.length === 0 && (
                                    <button onClick={onAddOutputClick} className="mt-6 flex items-center mx-auto space-x-2 bg-cairn-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cairn-blue-700 transition-colors text-sm shadow-md hover:shadow-lg">
                                        <PlusIcon className="w-4 h-4" />
                                        <span>Add Outputs</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {/* PoR Module */}
                <div className="lg:col-span-1 bg-white dark:bg-cairn-gray-900 rounded-xl shadow-xl p-6 h-fit sticky top-24 border border-cairn-gray-200 dark:border-cairn-gray-800">
                    <PoRModule 
                        project={project} 
                        isOwner={isOwner} 
                        onPorSubmitClick={onPorSubmitClick} 
                        onViewReproducibility={onViewReproducibility}
                    />
                </div>
            </div>
        </div>
    );
};