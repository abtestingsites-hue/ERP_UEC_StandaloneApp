import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { visitorService } from '../services';
import { VisitorDetailsModal } from './VisitorDetailsModal';
import { formatVisitorCategory } from '../../../lib/utils';

export function HeaderSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [viewingPass, setViewingPass] = useState<any>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: passes = [], isLoading } = useQuery({
        queryKey: ['visitor-passes'],
        queryFn: visitorService.getPasses,
        enabled: isOpen
    });

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node) && !viewingPass) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [viewingPass]);

    const filteredPasses = passes.filter((pass: any) => {
        if (!query.trim()) return false;
        const lowerQuery = query.toLowerCase();
        
        const nameMatch = pass.visitor?.name?.toLowerCase().includes(lowerQuery);
        const mobileMatch = pass.visitor?.mobile?.includes(lowerQuery);
        const passIdMatch = pass.passId?.toLowerCase().includes(lowerQuery) || pass.id?.toLowerCase().includes(lowerQuery);
        
        return nameMatch || mobileMatch || passIdMatch;
    });

    return (
        <div className="relative flex items-center justify-end" ref={searchRef}>
            <div className={`flex h-11 items-center rounded-full border bg-[#072E33] shadow-[0_14px_34px_rgba(5,22,26,0.12)] transition-all overflow-hidden ${isOpen ? 'w-[280px] sm:w-[320px] bg-white border-slate-200 shadow-xl' : 'w-11 justify-center border-[#6DA5C0]/15'}`}>
                {!isOpen ? (
                    <button 
                        onClick={() => setIsOpen(true)}
                        className="flex h-full w-full items-center justify-center rounded-full text-[#D8EEF5] hover:bg-[#0F969C] hover:text-white transition-colors shrink-0"
                    >
                        <Search className="h-4 w-4" />
                    </button>
                ) : (
                    <div className="flex w-full items-center h-full px-3">
                        <Search className="h-4 w-4 text-slate-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search visitors, pass ID, or mobile..."
                            className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-700 placeholder:text-slate-400 font-medium"
                        />
                        {isLoading && query ? (
                            <Loader2 className="h-4 w-4 text-teal-600 animate-spin shrink-0" />
                        ) : (
                            <button 
                                onClick={() => {
                                    setIsOpen(false);
                                    setQuery('');
                                }}
                                className="text-slate-400 hover:text-slate-600 shrink-0 p-1 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isOpen && query.trim() && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[60] flex flex-col max-h-[400px]">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results</span>
                        <span className="text-xs font-semibold text-slate-400">{filteredPasses.length} found</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto app-scrollbar p-2">
                        {isLoading ? (
                            <div className="p-6 text-center text-sm font-medium text-slate-500 flex flex-col items-center gap-2">
                                <Loader2 className="h-5 w-5 text-teal-600 animate-spin" />
                                Searching records...
                            </div>
                        ) : filteredPasses.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {filteredPasses.map((pass: any) => (
                                    <button
                                        key={pass.id}
                                        onClick={() => setViewingPass(pass)}
                                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 group border border-transparent hover:border-slate-100"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                                                {pass.visitor?.name || 'Unknown'}
                                            </div>
                                            <div className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-2 truncate">
                                                <span className="text-slate-600 truncate max-w-[120px]">{formatVisitorCategory(pass.visitor?.category)}</span>
                                                <span className="text-slate-300 shrink-0">•</span>
                                                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 truncate">{pass.passId || pass.id}</span>
                                            </div>
                                            <div className="text-xs font-medium text-slate-400 mt-1 truncate">
                                                {pass.visitor?.mobile}
                                            </div>
                                        </div>
                                        
                                        <div className="shrink-0 pt-0.5">
                                            {pass.checkOutAt ? (
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                                                    Exited
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Inside
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <Search className="h-8 w-8 text-slate-200 mb-3" />
                                <span className="text-sm font-bold text-slate-600">No results found</span>
                                <span className="text-xs font-medium text-slate-400 mt-1 max-w-[200px]">
                                    We couldn't find any visitors matching "{query}"
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <VisitorDetailsModal viewingPass={viewingPass} onClose={() => {
                setViewingPass(null);
            }} />
        </div>
    );
}
