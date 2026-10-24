import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { useContracts, useAdmissionContract } from '../hooks/useContracts';
import { CreateContractModal } from '../components/CreateContractModal';
import { ContractDetailsDrawer } from '../components/ContractDetailsDrawer';
import { Plus, Eye, HeartHandshake } from 'lucide-react';

function AdmissionContractRow({
    admission,
    onOpenCreate,
    onOpenDetails
}: {
    admission: any;
    onOpenCreate: (adm: any) => void;
    onOpenDetails: (adm: any, contract: any) => void;
}) {
    const { data: contract } = useAdmissionContract(admission.id);
    const hasContract = Boolean(contract && contract.id);

    return (
        <tr className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
            <td className="p-4">
                <div className="flex items-center space-x-2">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        hasContract && contract.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : hasContract && contract.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                    }`}>
                        {hasContract ? contract.contractNumber : 'NO CONTRACT'}
                    </span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white mt-1">
                    {admission.patient?.name || admission.enquiry?.client?.name || 'Home Care Patient'}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                    Ref: {admission.enquiry?.refNo || admission.id?.slice(0, 8)}
                </p>
            </td>

            <td className="p-4 text-xs text-gray-700 dark:text-gray-200">
                <p className="font-bold">{admission.enquiry?.service?.name || 'Home Care Service'}</p>
                <p className="text-gray-400">Unit: {admission.unitId}</p>
            </td>

            <td className="p-4 text-xs text-gray-700 dark:text-gray-200">
                {hasContract ? (
                    <>
                        <p className="font-semibold">{contract.shift || '12 Hours Day'} ({contract.frequency || 'Daily'})</p>
                        <p className="text-gray-400">{contract.staffRequired || 1} Caregiver(s)</p>
                    </>
                ) : (
                    <span className="text-gray-400 italic font-medium">No contract generated</span>
                )}
            </td>

            <td className="p-4 text-xs font-semibold text-gray-900 dark:text-white">
                {hasContract && contract.servicePrice ? `₹${contract.servicePrice} / ${contract.billingCycle || 'Month'}` : '-'}
            </td>

            <td className="p-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    hasContract && contract.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : hasContract && contract.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                }`}>
                    {hasContract ? contract.status : 'NO CONTRACT'}
                </span>
            </td>

            <td className="p-4 text-right space-x-2">
                <button
                    onClick={() => onOpenDetails(admission, hasContract ? contract : null)}
                    className="p-1.5 rounded-lg text-[#0F969C] hover:bg-[#0F969C]/10 transition-colors"
                    title="View / Manage Contract"
                >
                    <Eye className="w-4 h-4" />
                </button>

                {!hasContract ? (
                    <button
                        onClick={() => onOpenCreate(admission)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#0F969C] hover:bg-[#0C7075] text-white text-xs font-bold rounded-xl shadow transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Draft Contract</span>
                    </button>
                ) : contract.status === 'DRAFT' ? (
                    <button
                        onClick={() => onOpenDetails(admission, contract)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition-colors"
                    >
                        <span>Edit / Activate</span>
                    </button>
                ) : (
                    <button
                        onClick={() => onOpenDetails(admission, contract)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
                    >
                        <span>Active Contract</span>
                    </button>
                )}
            </td>
        </tr>
    );
}

export default function ServiceContracts() {
    const { admissions, isLoading, createContract, updateContract, activateContract } = useContracts();
    const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleCreateSubmit = async (payload: any) => {
        await createContract(payload);
    };

    const handleCreateDraftFromDrawer = async (admissionId: string) => {
        await createContract({
            admissionId,
            startDate: new Date().toISOString()
        });
        setIsDetailsOpen(false);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <PageHeader
                title="Service Contracts"
                subtitle="Manage home care service agreements, draft contract terms, and contract activations."
            />

            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Home Care Admissions & Service Contracts</h2>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-[#0F969C] font-bold animate-pulse flex flex-col items-center">
                        <HeartHandshake className="w-10 h-10 mb-2 animate-bounce" />
                        <span>Loading Home Care admissions & contracts...</span>
                    </div>
                ) : !admissions.length ? (
                    <div className="p-12 text-center text-gray-500 dark:text-[#B8D9E8]">
                        No active home care admissions found to draft contracts.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 dark:bg-white/5 text-xs text-gray-500 dark:text-[#B8D9E8] uppercase font-bold border-b border-gray-100 dark:border-[#6DA5C0]/15">
                                <tr>
                                    <th className="p-4">Contract / Patient</th>
                                    <th className="p-4">Service</th>
                                    <th className="p-4">Care Requirements</th>
                                    <th className="p-4">Price & Cycle</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#6DA5C0]/15">
                                {admissions.map((adm: any) => (
                                    <AdmissionContractRow
                                        key={adm.id}
                                        admission={adm}
                                        onOpenCreate={(admission) => {
                                            setSelectedAdmission(admission);
                                            setIsCreateOpen(true);
                                        }}
                                        onOpenDetails={(admission, contract) => {
                                            setSelectedAdmission(admission);
                                            setSelectedContract(contract);
                                            setIsDetailsOpen(true);
                                        }}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateContractModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                admission={selectedAdmission}
                onSubmit={handleCreateSubmit}
            />

            <ContractDetailsDrawer
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                contract={selectedContract}
                admission={selectedAdmission}
                onCreateDraft={handleCreateDraftFromDrawer}
                onActivate={async (id) => {
                    await activateContract(id);
                }}
                onUpdate={async (id, payload) => {
                    await updateContract({ id, payload });
                }}
            />
        </div>
    );
}
