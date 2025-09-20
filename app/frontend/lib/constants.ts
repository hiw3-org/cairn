import { Project, ResearchDomain, ProjectStatus, Output, Reproducibility, PoRStatus, UserProfile, FundingEvent, Opportunity, FundingRound, RoundApplicant, Notification, HuggingFaceOutput } from './types';

export const RESEARCH_DOMAINS: ResearchDomain[] = [
  ResearchDomain.Robotics,
  ResearchDomain.Simulation,
  ResearchDomain.Hardware,
];

export const FUNDING_ROUND_FOCUS_AREAS = [
  'Robotics', 'Simulation', 'Hardware', 'Embodied AI', 'AI regulation', 'AI Safety', 'Other'
];

// --- MOCK USER WALLETS ---
export const CURRENT_USER_WALLET = '0x1A2B...C3D4';
export const RESEARCHER_WALLET_ALICE = '0xAlice...E5F6';
export const RESEARCHER_WALLET_BOB = '0xBob...A7B8';
export const RESEARCHER_WALLET_CHARLIE = '0xCharlie...C9D0';
export const FUNDER_WALLET_1 = '0xabc...123';
export const FUNDER_WALLET_2 = '0xdef...456';
export const FUNDER_WALLET_3 = '0xghi...789';

// --- MOCK USERS ---
export const MOCK_USERS: UserProfile[] = [
    { walletAddress: CURRENT_USER_WALLET, name: 'Dr. Pat Smith (You)', porContributedCount: 2, isVerified: false },
    { walletAddress: RESEARCHER_WALLET_ALICE, name: 'Dr. Alice', porContributedCount: 5, isVerified: true },
    { walletAddress: RESEARCHER_WALLET_BOB, name: 'Dr. Bob', porContributedCount: 8, isVerified: true },
    { walletAddress: RESEARCHER_WALLET_CHARLIE, name: 'Dr. Charlie', porContributedCount: 2, isVerified: false },
    { walletAddress: FUNDER_WALLET_1, name: 'Verifier Alpha', porContributedCount: 12, isVerified: true },
    { walletAddress: FUNDER_WALLET_2, name: 'Verifier Beta', porContributedCount: 7, isVerified: false },
    { walletAddress: FUNDER_WALLET_3, name: 'Verifier Gamma', porContributedCount: 3, isVerified: true },
    { walletAddress: '0x123...abc', name: 'Dr. Eve', porContributedCount: 15, isVerified: true },
    { walletAddress: '0x456...def', name: 'Dr. Frank', porContributedCount: 1, isVerified: true },
    { walletAddress: '0x789...ghi', name: 'Dr. Grace', porContributedCount: 9, isVerified: false },
    { walletAddress: '0xVerifier...1', name: 'Heidi', porContributedCount: 4, isVerified: true },
    { walletAddress: '0xVerifier...3', name: 'Ivan', porContributedCount: 6, isVerified: true },
    { walletAddress: '0xVerifier...4', name: 'Judy', porContributedCount: 11, isVerified: true },
    { walletAddress: '0xVerifier...5', name: 'Mallory', porContributedCount: 13, isVerified: false },
];

export const MOCK_HUGGINGFACE_OUTPUTS: HuggingFaceOutput[] = [
  { id: 'hf-1', type: 'model', name: 'my-awesome-robot-model', downloads: 1250, likes: 150, lastModified: '2024-08-01', private: false, status: 'Reproducible', cairnProjectId: 'proj-003' },
  { id: 'hf-2', type: 'dataset', name: 'robot-arm-sensor-data', downloads: 850, likes: 75, lastModified: '2024-07-22', private: false, status: 'Reproducible', cairnProjectId: 'proj-003' },
  { id: 'hf-3', type: 'space', name: 'interactive-arm-demo', downloads: 2100, likes: 230, lastModified: '2024-08-05', private: false, status: 'Not Imported' },
  { id: 'hf-4', type: 'model', name: 'vision-transformer-embodied', downloads: 5600, likes: 420, lastModified: '2024-06-15', private: false, status: 'Not Imported' },
  { id: 'hf-5', type: 'dataset', name: 'warehouse-navigation-logs', downloads: 350, likes: 30, lastModified: '2024-05-10', private: true, status: 'Not Imported' },
  { id: 'hf-6', type: 'model', name: 'bert-base-uncased-finetuned', downloads: 99000, likes: 1200, lastModified: '2024-08-10', private: false, status: 'Not Imported' },
  { id: 'hf-7', type: 'dataset', name: 'squad-v2-processed', downloads: 45000, likes: 800, lastModified: '2024-07-30', private: false, status: 'Not Imported' },
  { id: 'hf-8', type: 'model', name: 'legacy-simulation-model', downloads: 200, likes: 10, lastModified: '2022-01-20', private: false, status: 'Not Imported' },
  { id: 'hf-9', type: 'space', name: 'particle-simulator-live', downloads: 890, likes: 95, lastModified: '2024-08-08', private: false, status: 'Not Imported' },
  { id: 'hf-10', type: 'model', name: 'private-gripper-controller', downloads: 5, likes: 1, lastModified: '2024-06-01', private: true, status: 'Not Imported' },
  { id: 'hf-11', type: 'dataset', name: 'drone-flight-paths', downloads: 1500, likes: 110, lastModified: '2024-08-12', private: false, status: 'Not Imported' },
  { id: 'hf-12', type: 'model', name: 'material-stress-model', downloads: 450, likes: 25, lastModified: '2024-08-01', private: false, status: 'Pending Evaluation', cairnProjectId: 'proj-009'},
  { id: 'hf-13', type: 'model', name: 'my-other-project-model', downloads: 10, likes: 2, lastModified: '2024-07-28', private: false, status: 'Imported', cairnProjectId: 'proj-004'},
];


export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'notif-1', type: 'deadline', title: 'Q3 Robotics Grant Deadline', description: 'Applications close in 3 days.', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), relatedId: 'round-1', action: { text: 'View Round' } },
    { id: 'notif-2', type: 'review_needed', title: 'New PoR for Quadrupedal Locomotion', description: 'A new Proof-of-Reproducibility submission is available.', date: new Date().toISOString(), relatedId: 'proj-008', action: { text: 'Review' } },
    { id: 'notif-7', type: 'review_needed', title: 'DeSci Sim Fund is Ready for Voting', description: 'The application period has ended. Review applicants to distribute funds.', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), relatedId: 'round-2', action: { text: 'Review' } },
    { id: 'notif-5', type: 'impact_event', title: 'Project Reused', description: '"Quadrupedal Locomotion" was reused in 2 new projects.', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), relatedId: 'proj-008', action: { text: 'View Impact' } },
    { id: 'notif-3', type: 'new_submission', title: 'New Applicant for Robotics Grant', description: '"Low-Cost Robotic Arm" has applied for your funding round.', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), relatedId: 'round-1', action: { text: 'View Applicant' } },
    { id: 'notif-4', type: 'deadline', title: 'DeSci Sim Fund Voting Ends', description: 'Voting concludes in 1 day.', date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), relatedId: 'round-2', action: { text: 'Vote Now' } },
    { id: 'notif-6', type: 'system_nudge', title: 'Distribute Funds', description: 'Voting for "DeSci Sim Fund" is complete. Distribute the pool to winners.', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), relatedId: 'round-2', action: { text: 'Allocate' } },
];


export const REPRODUCIBILITY_TEMPLATES: Record<ResearchDomain, string[]> = {
  [ResearchDomain.Robotics]: [
    'Provide full simulation environment files.',
    'List all hardware components and firmware versions.',
    'Include ROS bag files for all experiments.',
    'Document calibration procedures for all sensors.',
  ],
  [ResearchDomain.Simulation]: [
    'Specify simulation software and version.',
    'Include all environment and agent configuration files.',
    'Provide random seeds for all runs.',
    'Document results for baseline comparisons.',
  ],
  [ResearchDomain.Hardware]: [
    'Provide complete schematics and PCB layout files.',
    'List all components in a detailed Bill of Materials (BOM).',
    'Include firmware source code and compiled binaries.',
    'Document assembly instructions with photos or diagrams.',
  ],
};

// --- MOCK FUNDING DATA ---
export const MOCK_FUNDING_HISTORY: FundingEvent[] = [
  // New funding event for newly funded project
  { id: 'fh-15', projectId: 'proj-draft-001', projectTitle: 'Early-Stage Particle Simulation Framework', amount: 10000, timestamp: '2024-08-08', funderWallet: FUNDER_WALLET_3, txHash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' },
  { id: 'fh-16', projectId: 'proj-draft-001', projectTitle: 'Early-Stage Particle Simulation Framework', amount: 10000, timestamp: '2024-08-09', funderWallet: FUNDER_WALLET_1, txHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' },
  // New funding events for newly funded projects
  { id: 'fh-17', projectId: 'proj-draft-002', projectTitle: 'Concept for a Bio-Inspired Gripper', amount: 8000, timestamp: '2024-08-10', funderWallet: FUNDER_WALLET_3, txHash: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
  { id: 'fh-18', projectId: 'proj-draft-002', projectTitle: 'Concept for a Bio-Inspired Gripper', amount: 4000, timestamp: '2024-08-11', funderWallet: FUNDER_WALLET_1, txHash: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' },
  { id: 'fh-19', projectId: 'proj-draft-003', projectTitle: 'Modular Drone Component Research', amount: 15000, timestamp: '2024-08-05', funderWallet: FUNDER_WALLET_2, txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  { id: 'fh-20', projectId: 'proj-draft-003', projectTitle: 'Modular Drone Component Research', amount: 10100, timestamp: '2024-08-09', funderWallet: FUNDER_WALLET_2, txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
  { id: 'fh-8', projectId: 'proj-005', projectTitle: 'Open Source 3D-Printed Robotic Hand', amount: 20000, timestamp: '2024-07-20', funderWallet: FUNDER_WALLET_1, txHash: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e' },
  { id: 'fh-9', projectId: 'proj-005', projectTitle: 'Open Source 3D-Printed Robotic Hand', amount: 15000, timestamp: '2024-07-25', funderWallet: FUNDER_WALLET_2, txHash: '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f' },
  { id: 'fh-10', projectId: 'proj-002', projectTitle: 'Generative Adversarial Networks for Physics Simulation', amount: 50000, timestamp: '2024-07-15', funderWallet: FUNDER_WALLET_3, txHash: '0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a' },
  { id: 'fh-11', projectId: 'proj-006', projectTitle: 'Swarm Robotics Behavior Analysis', amount: 10000, timestamp: '2024-06-10', funderWallet: FUNDER_WALLET_1, txHash: '0x1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b' },
  { id: 'fh-12', projectId: 'proj-006', projectTitle: 'Swarm Robotics Behavior Analysis', amount: 5000, timestamp: '2024-06-18', funderWallet: FUNDER_WALLET_3, txHash: '0x2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c' },
  // Existing funding events
  { id: 'fh-1', projectId: 'proj-001', projectTitle: 'Autonomous Drone Navigation in Dense Forests', amount: 5000, timestamp: '2024-08-01', funderWallet: FUNDER_WALLET_1, txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b' },
  { id: 'fh-2', projectId: 'proj-008', projectTitle: 'Reinforcement Learning for Quadrupedal Locomotion', amount: 10000, timestamp: '2024-07-28', funderWallet: FUNDER_WALLET_2, txHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c' },
  { id: 'fh-3', projectId: 'proj-005', projectTitle: 'Open Source 3D-Printed Robotic Hand', amount: 2500, timestamp: '2024-07-22', funderWallet: FUNDER_WALLET_3, txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d' },
  // Funding for current user's projects
  { id: 'fh-13', projectId: 'proj-003', projectTitle: 'Low-Cost, Open-Source Robotic Arm', amount: 7500, timestamp: '2024-06-15', funderWallet: FUNDER_WALLET_1, txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  { id: 'fh-14', projectId: 'proj-003', projectTitle: 'Low-Cost, Open-Source Robotic Arm', amount: 7500, timestamp: '2024-07-01', funderWallet: FUNDER_WALLET_2, txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
  { id: 'fh-4', projectId: 'proj-004', projectTitle: 'My Other Project With Outputs', amount: 1000, timestamp: '2024-07-10', funderWallet: FUNDER_WALLET_1, txHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e' },
  { id: 'fh-5', projectId: 'proj-010', projectTitle: 'Embodied AI Agent for Warehouse Logistics', amount: 3700, timestamp: '2024-03-20', funderWallet: FUNDER_WALLET_2, txHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f' },
  { id: 'fh-6', projectId: 'proj-010', projectTitle: 'Embodied AI Agent for Warehouse Logistics', amount: 3700, timestamp: '2024-04-05', funderWallet: FUNDER_WALLET_3, txHash: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a' },
  { id: 'fh-7', projectId: 'proj-007', projectTitle: 'Legacy Project: Fluid Dynamics Simulation', amount: 75000, timestamp: '2022-06-15', funderWallet: FUNDER_WALLET_1, txHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b' },
];

// --- MOCK OPPORTUNITIES ---
export const MOCK_OPPORTUNITIES: Opportunity[] = [
    {
        id: 'opp-1',
        issuer: 'Schmidt Futures',
        amount: '2.0M',
        currency: 'USD',
        title: 'AI for Climate Science Initiative',
        deadline: '15 Aug',
        isNew: true,
        url: 'https://www.schmidtfutures.com/',
        creationDate: '2024-07-15',
    },
    {
        id: 'opp-2',
        issuer: 'Wellcome Trust',
        amount: '500K',
        currency: 'GBP',
        title: 'Global Health Innovation Grant',
        deadline: '30 Sep',
        isNew: true,
        url: 'https://wellcome.org/',
        creationDate: '2024-07-10',
    },
    {
        id: 'opp-3',
        issuer: 'NSF Program',
        amount: '100K',
        currency: 'USD',
        title: 'Trustworthy AI Systems Program',
        deadline: '01 Nov',
        isNew: false,
        url: 'https://www.nsf.gov/',
        creationDate: '2024-06-20',
    }
];

// --- MOCK FUNDING ROUNDS ---
const getImpactLevel = (fraction: number): 'High' | 'Medium' | 'Low' => {
    if (fraction >= 0.75) return 'High';
    if (fraction >= 0.3) return 'Medium';
    return 'Low';
};

const MOCK_APPLICANTS_ROUND_1: RoundApplicant[] = [
    {
        projectId: 'proj-008',
        projectTitle: 'Reinforcement Learning for Quadrupedal Locomotion',
        verifiedPors: 5,
        impactLevel: getImpactLevel(0.50),
        hfUpvotes: 1250,
        communityScore: 92,
    },
    {
        projectId: 'proj-001',
        projectTitle: 'Autonomous Drone Navigation in Dense Forests',
        verifiedPors: 4,
        impactLevel: getImpactLevel(0.75),
        hfUpvotes: 980,
        communityScore: 88,
    },
    {
        projectId: 'proj-003',
        projectTitle: 'Low-Cost, Open-Source Robotic Arm',
        verifiedPors: 0,
        impactLevel: getImpactLevel(0.78),
        hfUpvotes: 2400,
        communityScore: 85,
    },
];

const MOCK_APPLICANTS_ROUND_2: RoundApplicant[] = [
    {
        projectId: 'proj-002',
        projectTitle: 'Generative Adversarial Networks for Physics Simulation',
        verifiedPors: 2,
        impactLevel: getImpactLevel(0.4),
        hfUpvotes: 3100,
        communityScore: 95,
    },
     {
        projectId: 'proj-draft-001',
        projectTitle: 'Early-Stage Particle Simulation Framework',
        verifiedPors: 0,
        impactLevel: getImpactLevel(0.25),
        hfUpvotes: 150,
        communityScore: 76,
    },
];

const MOCK_APPLICANTS_ROUND_3: RoundApplicant[] = [
    {
        projectId: 'proj-005',
        projectTitle: 'Open Source 3D-Printed Robotic Hand',
        verifiedPors: 2,
        impactLevel: getImpactLevel(0.65),
        hfUpvotes: 1800,
        communityScore: 90,
        fundingAmount: 25000,
        fundingPercentage: 50,
  },
  {
        projectId: 'proj-003',
        projectTitle: 'Low-Cost, Open-Source Robotic Arm',
        verifiedPors: 0,
        impactLevel: getImpactLevel(0.78),
        hfUpvotes: 2100,
        communityScore: 87,
        fundingAmount: 15000,
        fundingPercentage: 30,
    },
    {
        projectId: 'proj-009',
        projectTitle: 'New Study on Material Stress Tolerance',
        verifiedPors: 0,
        impactLevel: getImpactLevel(0),
        hfUpvotes: 400,
        communityScore: 75,
        fundingAmount: 10000,
        fundingPercentage: 20,
    },
];

export const MOCK_FUNDING_ROUNDS: FundingRound[] = [
    {
        id: 'round-1',
        funderName: 'Robotics Guild',
        title: 'Q3 Robotics Innovation Grant',
        description: 'Funding innovative open-source projects in robotics, with a focus on manipulation and locomotion.',
        poolSize: 250000,
        topics: ['Robotics', 'AI', 'Open Source', 'Hardware'],
        applicationDeadline: '2024-09-30',
        status: 'Open',
        applicationCount: MOCK_APPLICANTS_ROUND_1.length,
        totalImpactScore: 980,
        applicants: MOCK_APPLICANTS_ROUND_1,
        evaluationDeadline: '2024-10-15',
        distributionDeadline: '2024-10-30',
        distributionMethod: 'By Score',
        maxProjects: 10,
        creationDate: '2024-07-01',
    },
    {
        id: 'round-2',
        funderName: 'DeSci Collective',
        title: 'DeSci Simulation Advancement Fund',
        description: 'A funding round for projects pushing the boundaries of decentralized physics and material science simulations.',
        poolSize: 100000,
        topics: ['Simulation', 'Physics', 'DeSci'],
        applicationDeadline: '2024-08-01',
        status: 'Voting',
        applicationCount: MOCK_APPLICANTS_ROUND_2.length,
        totalImpactScore: 450,
        applicants: MOCK_APPLICANTS_ROUND_2,
        evaluationDeadline: '2024-08-15',
        distributionDeadline: '2024-08-30',
        distributionMethod: 'Even',
        maxProjects: 5,
        creationDate: '2024-06-15',
    },
    {
        id: 'round-3',
        funderName: 'Hardware Makers DAO',
        title: 'Q2 Hardware Acceleration Prize',
        description: 'Retroactive funding for completed projects that have demonstrated significant advances in open-source hardware for research.',
        poolSize: 50000,
        topics: ['Hardware', 'Completed Research'],
        applicationDeadline: '2024-06-30',
        status: 'Closed',
        applicationCount: MOCK_APPLICANTS_ROUND_3.length,
        totalImpactScore: 2150,
        applicants: MOCK_APPLICANTS_ROUND_3,
        evaluationDeadline: '2024-07-15',
        distributionDeadline: '2024-07-30',
        distributionMethod: 'Manual',
        maxProjects: 3,
        creationDate: '2024-05-10',
        impactAssetMinted: false,
    },
     {
        id: 'round-4',
        funderName: 'AI Safety Fund',
        title: 'Q1 AI Safety Research Grant',
        description: 'Retroactive funding for projects focusing on AI alignment and safety.',
        poolSize: 75000,
        topics: ['AI Safety', 'AI', 'DeSci'],
        applicationDeadline: '2024-03-31',
        status: 'Closed',
        applicationCount: 2,
        totalImpactScore: 1800,
        applicants: [ MOCK_APPLICANTS_ROUND_1[0], MOCK_APPLICANTS_ROUND_2[0] ],
        evaluationDeadline: '2024-04-15',
        distributionDeadline: '2024-04-30',
        distributionMethod: 'By Score',
        maxProjects: 2,
        creationDate: '2024-02-01',
        impactAssetMinted: true,
  },
];


// --- MOCK PROJECT DATA ---

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
};

const createOutputMetrics = (id: string) => ({
    downloads: simpleHash(id + 'd') % 10000,
    stars: simpleHash(id + 's') % 1000,
    citations: simpleHash(id + 'c') % 200,
});


const MOCK_OUTPUTS_PROJ_1: Output[] = [
  {
        id: 'out-1-1', type: 'Code', timestamp: '2024-07-10', description: 'Initial commit of navigation algorithm.', 
        data: { url: 'github.com/org/repo', otherText: 'Commit hash: a1b2c3d' },
        metrics: createOutputMetrics('out-1-1'),
  },
  {
        id: 'out-1-2', type: 'Dataset', timestamp: '2024-07-15', description: 'Forest simulation sensor data.', 
        data: { ipfsCid: 'QmDataset...1', fileName: 'forest_sensor_data.zip' },
        metrics: createOutputMetrics('out-1-2'),
    }
];

const MOCK_OUTPUTS_PROJ_2: Output[] = [
  {
        id: 'out-2-1', type: 'Code', timestamp: '2024-06-20', description: 'GAN model architecture definition.', 
        data: { url: 'github.com/org/gan-repo', otherText: 'e4f5g6h' },
        metrics: createOutputMetrics('out-2-1'),
  },
  {
        id: 'out-2-2', type: 'Document', timestamp: '2024-06-28', description: 'Training protocol and hyperparameters.', 
        data: { otherText: 'Train for 100 epochs with batch size 32...' },
        metrics: createOutputMetrics('out-2-2'),
    }
];

const MOCK_OUTPUTS_PROJ_4: Output[] = [
    { id: 'out-4-1', type: 'Code', timestamp: '2024-07-28', description: 'Added sensor fusion logic', data: { otherText: 'Commit hash: f4b3a2c1' }, metrics: createOutputMetrics('out-4-1')},
    { id: 'out-4-2', type: 'Output Log', timestamp: '2024-07-30', description: 'Logs from a 2-hour test run in simulation.', data: { fileName: 'sim_run_log.txt' }, metrics: createOutputMetrics('out-4-2')},
    { id: 'out-4-3', type: 'Tools & External Services', timestamp: '2024-08-01', description: 'Core technologies for this stage.', data: { tools: ['Python', 'ROS'] }, metrics: createOutputMetrics('out-4-3')}
];

const MOCK_OUTPUTS_PROJ_5: Output[] = [
    { id: 'out-5-1', type: 'Document', timestamp: '2024-07-01', description: 'v1.0 Schematics released', data: { ipfsCid: 'QmHardwareSchematics...5', fileName: 'schematics_v1.pdf' }, metrics: createOutputMetrics('out-5-1')},
    { id: 'out-5-2', type: 'Code', timestamp: '2024-07-18', description: 'Firmware for microcontroller', data: { url: 'github.com/org/robot-arm', otherText: 'Commit hash: b4a5c6d' }, metrics: createOutputMetrics('out-5-2')},
];

const MOCK_OUTPUTS_PROJ_6: Output[] = [
    { id: 'out-6-1', type: 'Document', timestamp: '2024-04-11', description: 'Experimental setup protocol.', data: { otherText: 'Detailed setup instructions for replication...' }, metrics: createOutputMetrics('out-6-1') },
    { id: 'out-6-2', type: 'Dataset', timestamp: '2024-05-20', description: 'Raw sensor data from trial 1-50.', data: { ipfsCid: 'QmSensorData...6', fileName: 'raw_sensor_data_trials_1-50.csv' }, metrics: createOutputMetrics('out-6-2')},
    { id: 'out-6-3', type: 'Dataset', timestamp: '2024-06-05', description: 'Processed data and visualizations.', data: { ipfsCid: 'QmProcessedData...6', fileName: 'processed_data.json' }, metrics: createOutputMetrics('out-6-3')},
];

const MOCK_OUTPUTS_PROJ_8: Output[] = [
    { id: 'out-8-1', type: 'Code', timestamp: '2024-02-10', description: 'Core reinforcement learning model', data: { url: 'github.com/org/rl-quadruped', otherText: 'Commit hash: a1b2c3d4' }, metrics: createOutputMetrics('out-8-1')},
    { id: 'out-8-2', type: 'Code', timestamp: '2024-03-22', description: 'MuJoCo simulation environment files', data: { ipfsCid: 'QmSimEnv...8', fileName: 'mujoco_env.xml' }, metrics: createOutputMetrics('out-8-2')},
    { id: 'out-8-3', type: 'Document', timestamp: '2024-05-01', description: 'Training protocol for achieving gait', data: { otherText: 'Train with PPO for 10M timesteps...' }, metrics: createOutputMetrics('out-8-3')},
    { id: 'out-8-4', type: 'Tools & External Services', timestamp: '2024-05-15', description: 'Core technologies used in the simulation and training pipeline.', data: { tools: ['Python', 'MuJoCo', 'AWS'] }, metrics: createOutputMetrics('out-8-4')},
    { id: 'out-8-5', type: 'Dataset', timestamp: '2024-06-15', description: 'Logged states and actions during successful runs', data: { ipfsCid: 'QmLogData...8', fileName: 'successful_run_logs.pkl' }, metrics: createOutputMetrics('out-8-5')}
];

const MOCK_OUTPUTS_PROJ_10: Output[] = [
    { id: 'out-10-1', type: 'Document', timestamp: '2024-03-01', description: 'System Architecture and Design Principles', data: { url: 'arxiv.org/abs/2403.xxxx' }, metrics: createOutputMetrics('out-10-1') },
    { id: 'out-10-2', type: 'Code', timestamp: '2024-04-15', description: 'Pathfinding and obstacle avoidance module', data: { url: 'github.com/my-org/warehouse-ai', otherText: 'Commit hash: 9a8b7c6d' }, metrics: createOutputMetrics('out-10-2') },
    { id: 'out-10-3', type: 'Dataset', timestamp: '2024-05-20', description: 'Simulated warehouse layouts and item distributions', data: { ipfsCid: 'QmWrhsLayout...10', fileName: 'warehouse-layouts.zip' }, metrics: createOutputMetrics('out-10-3') },
    { id: 'out-10-4', type: 'Tools & External Services', timestamp: '2024-06-01', description: 'Technologies used.', data: { tools: ['Python', 'ROS', 'AWS', 'BitRobot'] }, metrics: createOutputMetrics('out-10-4')}
];

const MOCK_OUTPUTS_DRAFT_2: Output[] = [
    { id: 'out-draft-2-1', type: 'Document', timestamp: '2024-08-12', description: 'Initial design document and material specification.', data: { ipfsCid: 'QmDesignDoc...Gripper', fileName: 'gripper_design_v1.pdf' }, metrics: createOutputMetrics('out-draft-2-1')},
    { id: 'out-draft-2-2', type: 'Video', timestamp: '2024-08-15', description: 'Prototype v0.1 test footage.', data: { url: 'https://youtube.com/watch?v=prototype' }, metrics: createOutputMetrics('out-draft-2-2')}
];

const MOCK_OUTPUTS_DRAFT_3: Output[] = [
    { id: 'out-draft-3-1', type: 'Document', timestamp: '2024-08-01', description: 'Feasibility study and component standardization proposal.', data: { ipfsCid: 'QmFeasibility...Drone', fileName: 'drone_modularity_proposal.pdf' }, metrics: createOutputMetrics('out-draft-3-1')},
    { id: 'out-draft-3-2', type: 'Code', timestamp: '2024-08-11', description: 'Initial firmware for standardized ESC communication.', data: { url: 'github.com/cairn/drone-esc-fw', otherText: 'Commit hash: d3c4b5a' }, metrics: createOutputMetrics('out-draft-3-2')}
];

const createReproducibility = (id: string, timestamp: string, verifier: string, cid: string, notes: string, status: PoRStatus): Reproducibility => ({
  id,
  timestamp,
  verifier,
  notes,
  status,
    evidence: [{
      id: `ev-${id}`,
        type: 'Others',
      timestamp,
        description: 'Log files and recordings of the reproduction run.',
        data: { ipfsCid: cid, fileName: `repro-evidence-${id}.zip` }
    }]
});

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-008',
    ownerId: RESEARCHER_WALLET_BOB,
    title: 'Reinforcement Learning for Quadrupedal Locomotion',
    description: 'A project exploring advanced reinforcement learning techniques to achieve stable and dynamic locomotion in simulated quadrupedal robots. Focus on energy efficiency and robustness to external perturbations.',
    tags: ['AI', 'Reinforcement Learning', 'Robotics', 'Simulation'],
    status: ProjectStatus.Funded,
    domain: ResearchDomain.Simulation,
    cid: 'QmRL...Quad8',
    hypercertFraction: 0.50,
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    lastOutputDate: '2024-07-22',
    reproducibilities: [
        createReproducibility('rep-10', '2024-06-30', FUNDER_WALLET_1, 'QmEvidence...10', 'Reproduction successful. The agent achieved a stable gait within the specified training time.', PoRStatus.Success),
        createReproducibility('rep-11', '2024-07-05', FUNDER_WALLET_2, 'QmEvidence...11', 'Confirmed results. Energy efficiency metrics are within 2% of the original paper.', PoRStatus.Success),
        createReproducibility('rep-12', '2024-07-15', FUNDER_WALLET_3, 'QmEvidence...12', 'Ran the simulation with added perturbations as described. The robot maintained stability.', PoRStatus.Disputed),
        createReproducibility('rep-13', '2024-07-22', CURRENT_USER_WALLET, 'QmEvidence...13', 'My own verification of the baseline experiment. Everything checks out.', PoRStatus.Waiting),
        createReproducibility('rep-14', '2024-07-28', RESEARCHER_WALLET_ALICE, 'QmEvidence...14', 'Verified. The provided environment and model files work as expected.', PoRStatus.Success)
    ],
    fundingPool: 150000,
    fundingPrice: 1000,
    impactScore: 98,
    outputs: MOCK_OUTPUTS_PROJ_8,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Simulation],
    organization: 'Nexus Simulation Labs',
    impactAssetOwners: [
        { walletAddress: RESEARCHER_WALLET_BOB, contribution: 'Lead Researcher', ownershipPercentage: 40.0, claimed: true },
        { walletAddress: FUNDER_WALLET_1, contribution: 'Early PoR Verifier', ownershipPercentage: 5.0, claimed: true },
        { walletAddress: FUNDER_WALLET_2, contribution: 'PoR Verifier', ownershipPercentage: 5.0, claimed: false },
        { walletAddress: RESEARCHER_WALLET_ALICE, contribution: 'Protocol Contributor', ownershipPercentage: 5.0, claimed: true },
        { walletAddress: CURRENT_USER_WALLET, contribution: 'Early Backer', ownershipPercentage: 2.0, claimed: false },
    ],
    scientificMetrics: {
        citations: { value: 124, trend: 32 },
        arxivDownloads: { value: 2400, trend: 18 },
    },
    adoptionMetrics: {
        githubStars: { value: 215, trend: 45 },
        githubForks: { value: 48, trend: 33 },
        dependencies: { value: 5, trend: 150 },
        huggingFaceDownloads: { value: 18500, trend: 60 },
        huggingFaceModels: ['nexus-sim/quad-locomotion-v2'],
        huggingFaceDatasets: ['nexus-sim/quad-perturbation-data'],
    },
    stars: 3200,
    license: 'MIT',
  },
  {
    id: 'proj-001',
    ownerId: RESEARCHER_WALLET_ALICE,
    title: 'Autonomous Drone Navigation in Dense Forests',
    description: 'Development of a novel SLAM algorithm for drones operating in GPS-denied environments like dense forests, using only onboard sensor data.',
    tags: ['Drones', 'SLAM', 'Robotics', 'Autonomous Systems'],
    status: ProjectStatus.Reproducible,
    domain: ResearchDomain.Robotics,
    cid: 'QmXyZ...A1b2C3',
    hypercertFraction: 0.75,
    startDate: '2023-09-01',
    endDate: '2024-09-01',
    lastOutputDate: '2024-07-20',
    reproducibilities: [
      createReproducibility('rep-1', '2024-07-20', '0x123...abc', 'QmEvidence...1', 'Followed the protocol and was able to reproduce the drone trajectory in the simulated forest.', PoRStatus.Success),
      createReproducibility('rep-2', '2024-07-22', '0x456...def', 'QmEvidence...2', 'The SLAM algorithm works. Map accuracy is consistent with the claims.', PoRStatus.Success),
      createReproducibility('rep-3', '2024-07-25', '0x789...ghi', 'QmEvidence...3', 'Reproduction successful. The provided dataset was sufficient for verification.', PoRStatus.Success),
      createReproducibility('rep-15', '2024-07-29', CURRENT_USER_WALLET, 'QmEvidence...15', 'I was able to run the code and get the same output. Looks good.', PoRStatus.Success),
      createReproducibility('rep-16', '2024-08-01', RESEARCHER_WALLET_BOB, 'QmEvidence...16', 'Verified the results. This is solid work.', PoRStatus.Waiting),
    ],
    fundingPool: 0,
    fundingPrice: 500,
    impactScore: 82,
    outputs: MOCK_OUTPUTS_PROJ_1,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Robotics],
    organization: 'BioSynth Dynamics',
    impactAssetOwners: [
        { walletAddress: RESEARCHER_WALLET_ALICE, contribution: 'Lead Researcher', ownershipPercentage: 50.0, claimed: true },
        { walletAddress: '0x123...abc', contribution: 'PoR Verifier', ownershipPercentage: 5.0, claimed: true },
        { walletAddress: '0x456...def', contribution: 'PoR Verifier', ownershipPercentage: 5.0, claimed: false },
        { walletAddress: CURRENT_USER_WALLET, contribution: 'PoR Verifier', ownershipPercentage: 5.0, claimed: true },
    ],
    scientificMetrics: {
        citations: { value: 45, trend: 15 },
        arxivDownloads: { value: 850, trend: 10 },
    },
    adoptionMetrics: {
        githubStars: { value: 95, trend: 20 },
        githubForks: { value: 22, trend: 18 },
        dependencies: { value: 2, trend: 100 },
        huggingFaceDownloads: { value: 1200, trend: 25 },
    },
    stars: 1800,
    license: 'Apache 2.0',
  },
  {
    id: 'proj-005',
    ownerId: RESEARCHER_WALLET_CHARLIE,
    title: 'Open Source 3D-Printed Robotic Hand',
    description: 'This project aims to create a low-cost, highly dexterous robotic hand that can be produced using standard 3D printers and off-the-shelf components. All designs and software are open source.',
    tags: ['3D Printing', 'Robotics', 'Hardware', 'Open Source'],
    status: ProjectStatus.Funded,
    domain: ResearchDomain.Hardware,
    cid: 'QmHardware...Hand5',
    hypercertFraction: 0.65,
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    lastOutputDate: '2024-07-18',
    reproducibilities: [
      createReproducibility('rep-5', '2024-07-25', '0xVerifier...1', 'QmRep...5a', '3D printed the parts and assembled the hand. The firmware works as described.', PoRStatus.Success),
      createReproducibility('rep-6', '2024-07-28', CURRENT_USER_WALLET, 'QmRep...5b', 'I was able to build the hand following the instructions. The BOM was accurate.', PoRStatus.Waiting),
    ],
    fundingPool: 35000,
    fundingPrice: 250,
    impactScore: 88,
    outputs: MOCK_OUTPUTS_PROJ_5,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Hardware],
    impactAssetOwners: [
      { walletAddress: RESEARCHER_WALLET_CHARLIE, contribution: 'Lead Researcher', ownershipPercentage: 90.0, claimed: true },
      { walletAddress: CURRENT_USER_WALLET, contribution: 'Design Contributor', ownershipPercentage: 10.0, claimed: false },
    ],
    scientificMetrics: {
        citations: { value: 12, trend: 50 },
        arxivDownloads: { value: 300, trend: 30 },
    },
    adoptionMetrics: {
        githubStars: { value: 450, trend: 100 },
        githubForks: { value: 150, trend: 80 },
        dependencies: { value: 15, trend: 200 },
        huggingFaceDownloads: { value: 0, trend: 0 },
    },
    stars: 950,
    license: 'GPL-3.0',
  },
  {
    id: 'proj-002',
    ownerId: RESEARCHER_WALLET_BOB,
    title: 'Generative Adversarial Networks for Physics Simulation',
    description: 'Using GANs to generate realistic physics-based simulations, potentially accelerating scientific discovery in fields like fluid dynamics and material science.',
    tags: ['GANs', 'AI', 'Physics', 'Simulation'],
    status: ProjectStatus.Funded,
    domain: ResearchDomain.Simulation,
    cid: 'QmAbC...d4e5F6',
    hypercertFraction: 0.4,
    startDate: '2024-03-10',
    endDate: '2025-03-10',
    lastOutputDate: '2024-07-05',
    reproducibilities: [
        createReproducibility('rep-4', '2024-07-05', '0xabc...123', 'QmEvidence...4', 'The GAN training protocol is clear and the model converges as expected.', PoRStatus.Success),
        createReproducibility('rep-17', '2024-07-19', CURRENT_USER_WALLET, 'QmEvidence...17', 'Re-ran the training script, results are consistent.', PoRStatus.Waiting),
        createReproducibility('rep-18', '2024-07-21', RESEARCHER_WALLET_CHARLIE, 'QmEvidence...18', 'Verified. The generated simulations are qualitatively similar to the examples.', PoRStatus.Success),
    ],
    fundingPool: 50000,
    fundingPrice: 750,
    impactScore: 91,
    outputs: MOCK_OUTPUTS_PROJ_2,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Simulation],
    impactAssetOwners: [
      { walletAddress: RESEARCHER_WALLET_BOB, contribution: 'Lead Researcher', ownershipPercentage: 100.0, claimed: true },
    ],
     scientificMetrics: {
        citations: { value: 78, trend: 40 },
        arxivDownloads: { value: 1500, trend: 22 },
    },
    adoptionMetrics: {
        githubStars: { value: 320, trend: 55 },
        githubForks: { value: 80, trend: 40 },
        dependencies: { value: 8, trend: 100 },
        huggingFaceDownloads: { value: 25000, trend: 70 },
        huggingFaceModels: ['phys-sim/gan-fluid-dynamics', 'phys-sim/gan-material-stress-v3'],
        huggingFaceSpaces: ['phys-sim/interactive-gan-demo'],
    },
    stars: 880,
    license: 'Apache 2.0',
  },
  {
    id: 'proj-006',
    ownerId: RESEARCHER_WALLET_ALICE,
    title: 'Swarm Robotics Behavior Analysis',
    description: 'Analyzing emergent behaviors in large-scale robot swarms. This research explores decentralized coordination algorithms and their application in exploration and task allocation.',
    tags: ['Swarm Intelligence', 'Robotics', 'Multi-agent Systems'],
    status: ProjectStatus.Funded,
    domain: ResearchDomain.Robotics,
    cid: 'QmSwarm...Robo6',
    hypercertFraction: 0.25,
    startDate: '2024-01-01',
    endDate: '2024-10-01',
    lastOutputDate: '2024-06-05',
    reproducibilities: [
      createReproducibility('rep-7', '2024-06-20', '0xVerifier...3', 'QmRep...6a', 'Launched the swarm simulation. The emergent patterns match the video evidence.', PoRStatus.Success)
    ],
    fundingPool: 15000,
    fundingPrice: 200,
    impactScore: 75,
    outputs: MOCK_OUTPUTS_PROJ_6,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Robotics],
    impactAssetOwners: [
      { walletAddress: RESEARCHER_WALLET_ALICE, contribution: 'Lead Researcher', ownershipPercentage: 100.0, claimed: true },
    ],
     scientificMetrics: {
        citations: { value: 5, trend: 100 },
        arxivDownloads: { value: 150, trend: 80 },
    },
    adoptionMetrics: {
        githubStars: { value: 30, trend: 120 },
        githubForks: { value: 10, trend: 100 },
        dependencies: { value: 1, trend: 0 },
        huggingFaceDownloads: { value: 0, trend: 0 },
    },
    stars: 120,
    license: 'MIT',
  },
  {
    id: 'proj-009',
    ownerId: RESEARCHER_WALLET_CHARLIE,
    title: 'New Study on Material Stress Tolerance',
    description: 'A foundational study to determine the stress tolerance of new composite materials under extreme temperature variations. This data will be crucial for aerospace and hardware applications.',
    tags: ['Material Science', 'Hardware', 'Stress Analysis'],
    status: ProjectStatus.PendingEvaluation,
    domain: ResearchDomain.Hardware,
    cid: 'QmMaterial...Stress9',
    hypercertFraction: 0,
    startDate: '2024-07-20',
    endDate: '2025-02-20',
    lastOutputDate: '2024-08-01',
    reproducibilities: [],
    fundingPool: 0,
    impactScore: 10,
    outputs: [
        {id: 'out-9-1', type: 'Document', timestamp: '2024-08-01', description: 'Initial testing protocol defined.', data: {otherText: 'Apply stress until fracture...'}, metrics: createOutputMetrics('out-9-1')}
    ],
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Hardware],
    impactAssetOwners: [
      { walletAddress: RESEARCHER_WALLET_CHARLIE, contribution: 'Lead Researcher', ownershipPercentage: 100.0, claimed: true },
    ],
    stars: 45,
    license: 'Other',
  },
  // --- Current User's Projects ---
  {
    id: 'proj-003',
    ownerId: CURRENT_USER_WALLET,
    title: 'Low-Cost, Open-Source Robotic Arm',
    description: 'An early-stage project to design and build a 6-axis robotic arm for less than $500, aimed at hobbyists and educational institutions.',
    tags: ['Robotics', 'Hardware', 'DIY', 'Education'],
    status: ProjectStatus.Funded,
    domain: ResearchDomain.Hardware,
    cid: 'QmGhI...j7k8L9',
    hypercertFraction: 0.78,
    startDate: '2024-05-01',
    endDate: '2025-05-01',
    lastOutputDate: '2024-08-05',
    reproducibilities: [],
    fundingPool: 15000,
    fundingPrice: 300,
    impactScore: 85,
    outputs: [
        { id: 'out-3-1', type: 'Document', timestamp: '2024-08-05', description: 'v0.1 Schematics', data: { fileName: 'robotic-arm-schematics-v0.1.pdf' }, metrics: createOutputMetrics('out-3-1')}
    ],
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Hardware],
    organization: 'Atlas Robotics',
    additionalInfoUrl: 'https://www.atlasrobotics.dev/research/arm',
    impactAssetOwners: [
        { walletAddress: CURRENT_USER_WALLET, contribution: 'Lead Designer', ownershipPercentage: 80.0, claimed: true },
        { walletAddress: FUNDER_WALLET_1, contribution: 'Initial Funder', ownershipPercentage: 10.0, claimed: false },
        { walletAddress: FUNDER_WALLET_2, contribution: 'Initial Funder', ownershipPercentage: 10.0, claimed: false },
    ],
    scientificMetrics: {
        citations: { value: 2, trend: 100 },
        arxivDownloads: { value: 80, trend: 60 },
    },
    adoptionMetrics: {
        githubStars: { value: 600, trend: 150 },
        githubForks: { value: 200, trend: 120 },
        dependencies: { value: 25, trend: 250 },
        huggingFaceDownloads: { value: 0, trend: 0 },
    },
    stars: 600,
    license: 'MIT',
  },
  {
    id: 'proj-draft-001',
    ownerId: CURRENT_USER_WALLET,
    title: 'Early-Stage Particle Simulation Framework',
    description: 'A new framework for simulating particle interactions in a vacuum. Now funded for initial development.',
    tags: ['Simulation', 'Physics', 'Funded'],
    status: ProjectStatus.Funded,
    domain: ResearchDomain.Simulation,
    cid: 'QmDraft...Sim1',
    hypercertFraction: 0.25,
    startDate: '2024-08-01',
    endDate: '2025-08-01',
    lastOutputDate: '2024-08-10',
    reproducibilities: [],
    fundingPool: 20000,
    fundingPrice: 500,
    impactScore: 65,
    outputs: [
        { id: 'out-draft-1-1', type: 'Document', timestamp: '2024-08-10', description: 'Initial whitepaper on simulation architecture.', data: { ipfsCid: 'QmWhitepaper...1', fileName: 'simulation_whitepaper_v1.pdf' }, metrics: createOutputMetrics('out-draft-1-1')}
    ],
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Simulation],
    impactAssetOwners: [
        { walletAddress: CURRENT_USER_WALLET, contribution: 'Lead Researcher', ownershipPercentage: 95.0, claimed: true },
        { walletAddress: FUNDER_WALLET_3, contribution: 'Initial Seed Funder', ownershipPercentage: 5.0, claimed: false },
    ],
    stars: 150,
    license: 'Apache 2.0',
  },
  {
    id: 'proj-draft-002',
    ownerId: CURRENT_USER_WALLET,
    title: 'Concept for a Bio-Inspired Gripper',
    description: 'A funded project to develop a new type of robotic gripper inspired by octopus tentacles, focusing on soft robotics principles.',
    tags: ['Robotics', 'Hardware', 'Biomimicry', 'Funded'],
    status: ProjectStatus.Funded,
    domain: ResearchDomain.Hardware,
    cid: 'QmDraft...Grip2',
    hypercertFraction: 0.6,
    startDate: '2024-08-05',
    endDate: '2025-08-05',
    lastOutputDate: '2024-08-15',
    reproducibilities: [
        createReproducibility('rep-draft-2-1', '2024-08-16', RESEARCHER_WALLET_ALICE, 'QmRep...d2a', 'Printed and assembled the gripper. It functions according to the design spec.', PoRStatus.Success),
        createReproducibility('rep-draft-2-2', '2024-08-17', RESEARCHER_WALLET_BOB, 'QmRep...d2b', 'Currently testing the actuation mechanism. Looks promising.', PoRStatus.Waiting),
    ],
    fundingPool: 12000,
    fundingPrice: 400,
    impactScore: 78,
    outputs: MOCK_OUTPUTS_DRAFT_2,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Hardware],
    impactAssetOwners: [
        { walletAddress: CURRENT_USER_WALLET, contribution: 'Lead Designer', ownershipPercentage: 80.0, claimed: true },
        { walletAddress: FUNDER_WALLET_3, contribution: 'Seed Funder', ownershipPercentage: 10.0, claimed: false },
        { walletAddress: RESEARCHER_WALLET_ALICE, contribution: 'PoR Verifier', ownershipPercentage: 5.0, claimed: false },
    ],
    stars: 320,
    license: 'MIT',
  },
  {
    id: 'proj-draft-003',
    ownerId: CURRENT_USER_WALLET,
    title: 'Modular Drone Component Research',
    description: 'A funded research project to create standardized, modular components for custom drone assembly, enhancing interoperability.',
    tags: ['Drones', 'Hardware', 'Modular Design', 'Funded'],
    status: ProjectStatus.Funded,
    domain: ResearchDomain.Robotics,
    cid: 'QmDraft...Drone3',
    hypercertFraction: 0.8,
    startDate: '2024-07-28',
    endDate: '2025-07-28',
    lastOutputDate: '2024-08-11',
    reproducibilities: [
        createReproducibility('rep-draft-3-1', '2024-08-14', RESEARCHER_WALLET_CHARLIE, 'QmRep...d3a', 'The standardized ESC communication firmware works flawlessly on my custom test drone.', PoRStatus.Success),
    ],
    fundingPool: 25100,
    fundingPrice: 1000,
    impactScore: 89,
    outputs: MOCK_OUTPUTS_DRAFT_3,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Robotics],
    impactAssetOwners: [
        { walletAddress: CURRENT_USER_WALLET, contribution: 'Lead Researcher', ownershipPercentage: 85.0, claimed: true },
        { walletAddress: FUNDER_WALLET_2, contribution: 'Grant Provider', ownershipPercentage: 10.0, claimed: true },
        { walletAddress: RESEARCHER_WALLET_CHARLIE, contribution: 'PoR Verifier', ownershipPercentage: 5.0, claimed: false },
    ],
    stars: 450,
    license: 'GPL-3.0',
  },
   {
    id: 'proj-004',
    ownerId: CURRENT_USER_WALLET,
    title: 'My Other Project With Outputs',
    description: 'A test project to demonstrate the output recording functionality on the CAIRN platform.',
    tags: ['Testing', 'Platform'],
    status: ProjectStatus.Draft,
    domain: ResearchDomain.Robotics,
    cid: 'QmNew...proj4',
    hypercertFraction: 0.1,
    startDate: '2024-07-01',
    endDate: '2024-09-01',
    lastOutputDate: '2024-08-01',
    reproducibilities: [],
    fundingPool: 0,
    fundingPrice: 100,
    impactScore: 70,
    outputs: MOCK_OUTPUTS_PROJ_4,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Robotics],
    impactAssetOwners: [
      { walletAddress: CURRENT_USER_WALLET, contribution: 'Lead Researcher', ownershipPercentage: 100.0, claimed: true },
    ],
    stars: 50,
    license: 'MIT',
  },
  {
    id: 'proj-010',
    ownerId: CURRENT_USER_WALLET,
    title: 'Embodied AI Agent for Warehouse Logistics',
    description: 'Developing a physical AI agent capable of navigating complex warehouse environments, identifying packages, and performing sorting tasks. The project integrates computer vision with robotic manipulation.',
    tags: ['Embodied AI', 'Logistics', 'Robotics', 'Computer Vision'],
    status: ProjectStatus.Reproducible,
    domain: ResearchDomain.Robotics,
    cid: 'QmWarehouseAI...10',
    hypercertFraction: 0.85,
    startDate: '2024-02-15',
    endDate: '2025-02-15',
    lastOutputDate: '2024-06-01',
    reproducibilities: [
      createReproducibility('rep-20', '2024-06-15', '0xabc...123', 'QmEvidence...20', 'Successfully ran the warehouse simulation. The agent sorts packages with 98% accuracy.', PoRStatus.Success),
      createReproducibility('rep-21', '2024-06-20', '0xdef...456', 'QmEvidence...21', 'Verified pathfinding on the provided layouts. No collisions observed.', PoRStatus.Waiting),
    ],
    fundingPool: 0,
    fundingPrice: 2000,
    impactScore: 92,
    outputs: MOCK_OUTPUTS_PROJ_10,
    reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Robotics],
    organization: 'My Personal Research',
    impactAssetOwners: [
        { walletAddress: CURRENT_USER_WALLET, contribution: 'Lead Researcher', ownershipPercentage: 60.0, claimed: true },
        { walletAddress: '0xabc...123', contribution: 'PoR Verifier', ownershipPercentage: 10.0, claimed: true },
        { walletAddress: FUNDER_WALLET_2, contribution: 'External Service Provider', ownershipPercentage: 15.0, claimed: true },
    ],
    stars: 1200,
    license: 'Apache 2.0',
  },
];
