"use client";

import React, { useState } from 'react';
import { Ticket, Search, Filter, Plus } from 'lucide-react';
import { CreateTicketModal } from '../../../components/tickets/CreateTicketModal';

export default function AgentTickets() {
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar relative bg-[#F5F7F5]">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#202020] mb-1 flex items-center gap-2">
            <Ticket className="text-[#039A01] w-6 h-6" /> Assigned Tickets
          </h1>
          <p className="text-sm text-[#5F6962]">Manage and resolve tickets assigned to you.</p>
        </div>
        <button onClick={() => setIsCreateTicketModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#039A01] text-white rounded-lg hover:bg-[#028001] shadow-sm transition-colors text-sm font-semibold">
          <Plus className="w-4 h-4" /> Create Ticket
        </button>
      </header>

      <div className="bg-white border border-[#E1E6E1] rounded-xl flex-1 flex flex-col shadow-xs">
        <div className="p-4 border-b border-[#E1E6E1] flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#849389]" />
            <input aria-label="Search assigned tickets" 
              type="text" 
              placeholder="Search assigned tickets..." 
              className="w-full bg-[#F5F7F5] border border-[#E1E6E1] focus:border-[#039A01] rounded-lg pl-9 pr-3 py-2 text-sm outline-none text-[#202020] transition-all placeholder-[#849389]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-[#E1E6E1] rounded-lg text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5] transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" /> Filter Status
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-16 h-16 rounded-2xl bg-[#E7F4E8] flex items-center justify-center border border-[#C8E6CA] mb-4">
            <Ticket className="w-8 h-8 text-[#039A01]" />
          </div>
          <h3 className="text-lg font-bold text-[#202020] mb-2">No Active Tickets</h3>
          <p className="text-[#5F6962] max-w-md text-center text-sm">
            You currently do not have any unresolved tickets assigned to your queue. Enjoy the quiet time or assist other queues!
          </p>
        </div>
      </div>

      {isCreateTicketModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsCreateTicketModalOpen(false)} 
          onSuccess={() => setIsCreateTicketModalOpen(false)} 
        />
      )}
    </div>
  );
}
