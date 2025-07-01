
"use client";

import { HowItWorksHeaderLogo } from '../ui/logo';
import { LightbulbIcon, UploadCloudIcon, CheckCircleIcon, HypercertIcon, SearchIcon, ChartBarIcon, GavelIcon, ScaleIcon, IpfsIcon, BeakerIcon, UsersGroupIcon, TwitterIcon, DiscordIcon, GitHubIcon } from '../ui/icons';
import React from 'react';

const HowItWorksHeader = ({ onNavigate } : { onNavigate: (page: 'landing') => void}) => (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-cairn-gray-950/80 backdrop-blur-lg">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
            <HowItWorksHeaderLogo />
            <button onClick={() => onNavigate('landing')} className="text-sm font-semibold text-cairn-gray-600 hover:text-cairn-blue-600 dark:text-cairn-gray-300 dark:hover:text-cairn-blue-400">
                Back to Home
            </button>
        </nav>
    </header>
);

const CtaSection = ({ onEnter, showLearnMore = true, onNavigate }: { onEnter: () => void, showLearnMore?: boolean, onNavigate: (page: 'howitworks') => void }) => (
    <section className="bg-gradient-to-r from-cairn-blue-700 to-cairn-deep-blue">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <div className="relative isolate overflow-hidden text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Pioneer the Future of Research?</h2>
                <p className="mt-6 text-lg leading-8 text-cairn-blue-200">Join CAIRN today. Start a project, fund groundbreaking science, and be part of the DeSci revolution.</p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <button onClick={onEnter} className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-cairn-blue-700 shadow-lg hover:bg-cairn-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-transform hover:scale-105">
                        Enter the Platform
                    </button>
                    {showLearnMore && (
                         <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('howitworks');}} className="text-sm font-semibold leading-6 text-white hover:text-cairn-blue-100 transition-colors">Learn more <span aria-hidden="true">→</span></a>
                    )}
                </div>
            </div>
        </div>
    </section>
);

const LandingFooter = () => (
    <footer className="bg-cairn-gray-900 text-cairn-gray-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-sm font-semibold text-white">Platform</h3>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="hover:text-white">For Researchers</a></li>
                        <li><a href="#" className="hover:text-white">For Funders</a></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-white">Resources</h3>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="hover:text-white">Documentation</a></li>
                        <li><a href="#" className="hover:text-white">How It Works</a></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-white">Community</h3>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="hover:text-white">DAO Governance</a></li>
                        <li><a href="#" className="hover:text-white">Contact</a></li>
                    </ul>
                </div>
                <div>
                     <h3 className="text-sm font-semibold text-white">Legal</h3>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-cairn-gray-800 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm">&copy; {new Date().getFullYear()} CAIRN Protocol. All rights reserved.</p>
                <div className="flex space-x-6 mt-4 sm:mt-0">
                    <a href="#" className="hover:text-white"><TwitterIcon className="h-6 w-6" /></a>
                    <a href="#" className="hover:text-white"><DiscordIcon className="h-6 w-6" /></a>
                    <a href="#" className="hover:text-white"><GitHubIcon className="h-6 w-6" /></a>
                </div>
            </div>
        </div>
    </footer>
);


export const HowItWorksPage = ({ onNavigate, onEnter }: { onNavigate: (page: 'landing') => void, onEnter: () => void }) => {
    const scientistSteps = [
        { icon: LightbulbIcon, title: "Create Project", description: "Define your research scope, goals, and reproducibility criteria upfront." },
        { icon: UploadCloudIcon, title: "Record Outputs", description: "Securely log code, data, and protocols on IPFS for immutable record-keeping." },
        { icon: CheckCircleIcon, title: "Enable Reproducibility", description: "Community members can now attempt to reproduce your work, strengthening its validity." },
        { icon: HypercertIcon, title: "Gain Impact & Rewards", description: "Earn Hypercerts and retroactive funding as your work is built upon." },
    ];
    const funderSteps = [
        { icon: SearchIcon, title: "Discover Projects", description: "Filter and find high-potential projects that align with your funding mission." },
        { icon: ChartBarIcon, title: "Assess Impact", description: "Analyze on-chain data, reproducibility metrics, and real-time project progress." },
        { icon: GavelIcon, title: "Participate in DAO Voting", description: "Use your stake to influence funding allocation towards validated, impactful research." },
        { icon: ScaleIcon, title: "Track Your Contribution", description: "See the real-world impact of your funding through transparent, on-chain reporting." },
    ];
    const coreConcepts = [
        { icon: IpfsIcon, title: "IPFS Integration", description: "All research outputs are stored on the InterPlanetary File System, ensuring data is permanent, content-addressed, and resilient." },
        { icon: HypercertIcon, title: "Hypercerts", description: "We use Hypercerts to create granular, transferable, and composable claims about the impact of scientific work, enabling retroactive rewards." },
        { icon: BeakerIcon, title: "Proof-of-Reproducibility", description: "Our novel on-chain mechanism for verifying scientific claims. Successful reproductions strengthen a project's impact score." },
        { icon: UsersGroupIcon, title: "DAO Governance", description: "The CAIRN protocol is governed by its community. Token holders vote on funding rounds, protocol upgrades, and treasury management." },
    ];

    return (
        <div className="bg-white dark:bg-cairn-gray-950 text-cairn-gray-800 dark:text-cairn-gray-200 font-sans">
            <HowItWorksHeader onNavigate={onNavigate} />
            <main>
                <section className="py-20 sm:py-24 text-center bg-cairn-gray-50 dark:bg-cairn-gray-900">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-cairn-gray-900 dark:text-white tracking-tight">The CAIRN Workflow</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-cairn-gray-600 dark:text-cairn-gray-400">A transparent, step-by-step journey for researchers and funders on our decentralized science platform.</p>
                    </div>
                </section>
                
                <section className="py-20 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold tracking-tight text-cairn-gray-900 dark:text-white sm:text-4xl">A Researcher's Journey</h2>
                            <p className="mt-4 text-lg text-cairn-gray-600 dark:text-cairn-gray-400">
                                Follow these four steps to bring your research from an idea to a globally verifiable and fundable asset on the CAIRN platform.
                            </p>
                        </div>

                        <div className="relative mt-20">
                            {/* The connector line for desktop */}
                            <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-cairn-gray-200 dark:bg-cairn-gray-700" aria-hidden="true"></div>

                            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
                                {scientistSteps.map((step, index) => (
                                    <div key={index} className="flex flex-col items-center text-center">
                                        {/* The circle on the line */}
                                        <div className="relative flex items-center justify-center w-24 h-24 bg-cairn-gray-50 dark:bg-cairn-gray-950 lg:bg-transparent rounded-full z-10">
                                           <div className="flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-cairn-gray-900 ring-4 ring-cairn-blue-500">
                                             <step.icon className="h-9 w-9 text-cairn-blue-600 dark:text-cairn-blue-400" />
                                           </div>
                                            <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-cairn-blue-600 text-white text-sm font-bold ring-4 ring-white dark:ring-cairn-gray-900">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <h3 className="mt-6 text-lg font-semibold text-cairn-gray-900 dark:text-white">{step.title}</h3>
                                        <p className="mt-2 text-sm text-cairn-gray-500 dark:text-cairn-gray-400">{step.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 sm:py-24 bg-cairn-gray-50 dark:bg-cairn-gray-900">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center mb-16 text-cairn-gray-900 dark:text-white">A Funder's Perspective</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {funderSteps.map(step => (
                                <div key={step.title} className="text-center p-6 bg-white dark:bg-cairn-gray-800 rounded-lg shadow-lg border border-cairn-gray-200 dark:border-cairn-gray-700">
                                    <step.icon className="h-10 w-10 text-cairn-blue-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-cairn-gray-900 dark:text-white">{step.title}</h3>
                                    <p className="mt-2 text-cairn-gray-600 dark:text-cairn-gray-400">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                 <section className="py-20 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center mb-16 text-cairn-gray-900 dark:text-white">Core Concepts</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {coreConcepts.map(concept => (
                                <div key={concept.title} className="flex items-start gap-4 p-4">
                                    <concept.icon className="h-8 w-8 text-cairn-blue-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-lg text-cairn-gray-900 dark:text-white">{concept.title}</h3>
                                        <p className="text-cairn-gray-600 dark:text-cairn-gray-400">{concept.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <CtaSection onEnter={onEnter} showLearnMore={false} onNavigate={() => {}}/>
            </main>
            <LandingFooter />
        </div>
    );
}