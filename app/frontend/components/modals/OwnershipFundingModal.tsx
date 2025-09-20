
import React from 'react';
import { Project, ProjectStatus } from '../../lib/types';
import { Modal } from '../ui/modal';
import { ImpactAssetOwnershipWidget } from '../widgets/ImpactAssetOwnershipWidget';
import { FundingDetailsWidget } from '../widgets/FundingDetailsWidget';

export const OwnershipFundingModal = ({ project, onClose }: { project: Project; onClose: () => void; }) => {
    
    const hasOwnership = project.impactAssetOwners && project.impactAssetOwners.length > 0;
    const hasFunding = project.status === ProjectStatus.Funded && project.fundingPool > 0;
    const hasContent = hasOwnership || hasFunding;

    return (
        <Modal 
            onClose={onClose} 
            title="Ownership & Funding Details"
        >
            {hasContent ? (
                <div className="space-y-8">
                    {hasOwnership && <ImpactAssetOwnershipWidget project={project} />}
                    {hasFunding && <FundingDetailsWidget project={project} />}
                </div>
            ) : (
                <div className="text-center py-12">
                     <p className="text-text-secondary dark:text-text-dark-secondary">This project has no ownership or funding data to display yet.</p>
                </div>
            )}
        </Modal>
    );
};
