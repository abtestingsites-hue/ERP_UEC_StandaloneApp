"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Ticket } from 'lucide-react';
import { CreateTicketModal } from '../../components/tickets/CreateTicketModal';
import { apiFetch } from '../../lib/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/v1/tickets');
      if (res.ok) {
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map((t: any) => ({
          id: t.id || `TKT-${Math.random().toString(36).substring(7).toUpperCase()}`,
          customer: t.customer || t.customerName || 'Unknown Customer',
          subject: t.subject || t.title || t.category || 'General Support',
          status: t.status || 'OPEN',
          priority: t.priority || 'NORMAL',
          updated: t.updated || (t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : 'Today')
        }));
        setTickets(normalized);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchTickets();
  };

  return (
    <div className="flex-1 p-6 h-full flex flex-col bg-[#F5F7F5]">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#202020] mb-1">Ticket Management</h1>
          <p className="text-sm text-[#5F6962]">Track and resolve customer issues</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#039A01] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#027A01] transition-colors shadow-sm">
          Create Ticket
        </button>
      </header>

      <div className="bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#E1E6E1] flex items-center justify-between bg-[#FAFCFA]">
          <div className="relative group w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6962] group-focus-within:text-[#039A01] transition-colors" />
            <input aria-label="Search support tickets" 
              type="text" 
              placeholder="Search tickets..." 
              className="w-full bg-[#FFFFFF] border border-[#E1E6E1] focus:border-[#039A01] rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all text-[#202020] placeholder-[#5F6962]"
            />
          </div>
          <button className="p-2 border border-[#E1E6E1] text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5] rounded-lg transition-colors flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-[#5F6962]">
               <div className="w-6 h-6 border-2 border-[#E1E6E1] border-t-[#039A01] rounded-full animate-spin"></div>
            </div>
          ) : (
            <table aria-label="Support tickets management table" className="w-full text-left text-sm">
              <thead className="text-xs text-[#5F6962] bg-[#F5F7F5] uppercase border-b border-[#E1E6E1] sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Ticket ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Customer</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Subject</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Priority</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Last Updated</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6E1]">
                {tickets.map((ticket, idx) => (
                  <tr key={ticket.id} className="hover:bg-[#F5F7F5] transition-colors group">
                    <td className="px-6 py-4 font-medium text-[#202020]">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-[#5F6962]" />
                        {ticket.id.split('-')[0].toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#202020]">{ticket.customer}</td>
                    <td className="px-6 py-4 text-[#5F6962] max-w-xs truncate">{ticket.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        ticket.status === 'OPEN' ? 'bg-[#E7F4E8] text-[#039A01] border-[#039A01]/20' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${
                        ticket.priority === 'HIGH' || ticket.priority === 'EMERGENCY' ? 'text-rose-600' :
                        ticket.priority === 'NORMAL' ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#5F6962]">{ticket.updated}</td>
                    <td className="px-6 py-4 text-right">
                      <button aria-label="Ticket actions" className="text-[#5F6962] hover:text-[#202020] transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-5 h-5 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#5F6962] italic">No tickets found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleCreateSuccess} 
        />
      )}
    </div>
  );
}
