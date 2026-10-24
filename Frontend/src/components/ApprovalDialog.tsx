import React, { useState } from 'react';
import { Modal } from './Modal';

interface ApprovalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    entityName?: string;
    onApprove: (comments: string) => void;
    onReject?: (comments: string) => void;
    isProcessing?: boolean;
}

export function ApprovalDialog({
    isOpen,
    onClose,
    title = 'Approve Request',
    entityName,
    onApprove,
    onReject,
    isProcessing = false
}: ApprovalDialogProps) {
    const [comments, setComments] = useState('');

    const handleApprove = () => {
        onApprove(comments);
        setComments('');
    };

    const handleReject = () => {
        if (onReject) {
            onReject(comments);
            setComments('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type="info"
            size="md"
        >
            <div className="space-y-4">
                {entityName && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Please review the details for <strong>{entityName}</strong> before proceeding.
                    </p>
                )}
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Approval/Rejection Comments (Optional)
                    </label>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add your comments here..."
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30] dark:text-white"
                        rows={3}
                    />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    {onReject && (
                        <button
                            onClick={handleReject}
                            disabled={isProcessing}
                            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Reject'}
                        </button>
                    )}
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {isProcessing ? 'Processing...' : 'Approve'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

