// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { Plus, Users, Briefcase, FileText, CheckCircle, Table, Download, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { 
  useCandidates, 
  useUpdateCandidate, 
  useCreateInterview, 
  usePlaceCandidate 
} from '../hooks/useHR';

const STAGES = [
  { id: 'LEAD', label: 'New Leads', icon: Users, color: 'bg-blue-500' },
  { id: 'INTERVIEW', label: 'Interview Scheduled', icon: Briefcase, color: 'bg-purple-500' },
  { id: 'VERIFICATION', label: 'Background Check', icon: FileText, color: 'bg-amber-500' },
  { id: 'PLACED', label: 'Placed', icon: CheckCircle, color: 'bg-green-500' }
];

export function CandidatePipeline() {
  const navigate = useNavigate();
  const { data: candidates = [], isLoading: loading } = useCandidates();
  
  const updateCandidateMutation = useUpdateCandidate();
  const createInterviewMutation = useCreateInterview();
  const placeCandidateMutation = usePlaceCandidate();
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'sheet'>('pipeline');
  
  // Placement Modal
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [placingCandidate, setPlacingCandidate] = useState<any>(null);
  const [placeData, setPlaceData] = useState({
    empId: '',
    designation: '',
    department: 'General',
    joiningDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Interview WhatsApp Modal
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<any>(null);
  const [interviewSchedule, setInterviewSchedule] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00'
  });

  // Removed fetchCandidates and useEffect since we use React Query

  const handleDragStart = (candidate: any) => {
    setDraggedItem(candidate);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    if (stageId === 'PLACED') {
      setPlacingCandidate(draggedItem);
      setShowPlaceModal(true);
    } else if (stageId === 'INTERVIEW') {
      setInterviewCandidate(draggedItem);
      setShowInterviewModal(true);
    } else {
      updateCandidateMutation.mutate({
        id: draggedItem.id,
        data: { stage: stageId }
      });
    }
    setDraggedItem(null);
  };

  const handleSendInterviewWhatsApp = async () => {
    try {
      const localDateStr = `${interviewSchedule.date}T${interviewSchedule.time}:00`;
      const isoDateTime = new Date(localDateStr).toISOString();

      // 1. Update backend stage and details
      await updateCandidateMutation.mutateAsync({
        id: interviewCandidate.id,
        data: {
          stage: 'INTERVIEW',
          details: {
            ...(interviewCandidate.details || {}),
            interviewDate: isoDateTime
          }
        }
      });

      // 2. Create Interview Record
      await createInterviewMutation.mutateAsync({
        candidateId: interviewCandidate.id,
        data: {
          scheduledAt: isoDateTime,
          status: 'SCHEDULED'
        }
      });

      // 3. Format professional WhatsApp message
      const message = `Hello ${interviewCandidate.name},

Your profile has been shortlisted for an interview with UNI Senth Elder Care. 

Your interview is scheduled for ${format(new Date(interviewSchedule.date), 'dd MMM yyyy')} at ${interviewSchedule.time}. 
Please bring your original certificates and Aadhar card.

Address: UNI Senth Elder Care, Main Branch
If you have any questions, please reply to this message.

Regards,
HR Department`;

      // 4. Open WhatsApp
      const mobile = String(interviewCandidate.mobileNo || '').replace(/\D/g, '');
      const waUrl = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      // 5. Cleanup
      setShowInterviewModal(false);
      setInterviewCandidate(null);
    } catch (error) {
      console.error('Failed to transition candidate to INTERVIEW stage', error);
      // Wait for React Query to show the toast automatically
    }
  };

  const handlePlaceConfirm = () => {
    placeCandidateMutation.mutate({
      id: placingCandidate.id,
      data: placeData
    }, {
      onSuccess: () => {
        setShowPlaceModal(false);
        setPlacingCandidate(null);
      }
    });
  };

  const exportToCSV = () => {
    // 39 Columns exactly matching the client's Google Sheet
    const headers = [
      "Serial No",
      "Addressing Agent Name",
      "Lead Generated from",
      "Official Name",
      "Colloquial Name",
      "Age / Sex",
      "Mobile No",
      "Alternative Mobile & Family No",
      "Qualification & Experience",
      "Full Address",
      "Previous Location",
      "Company Details",
      "Duty Role & Duration of work",
      "Salary",
      "Proof of Salary",
      "HR Contact / Company Contact",
      "Experience Certificate",
      "Work Timing",
      "Relieving Details",
      "Police Complaint (Yes/No)",
      "Health Condition & Illness",
      "Preferred Working Role",
      "Preferred Working Time",
      "Preferred Working Salary",
      "Day or Stay",
      "Resume Attachment",
      "Social Documents",
      "Minimum 5 Reference Names & Numbers",
      "On-call Note by Interview Agent",
      "Date of Interview Schedule",
      "After Interview Notes by Agent",
      "Character Notes by Agent",
      "Job Placing Details",
      "Job Roles & Responsibilities",
      "Job Salary",
      "Job Timing & Leave",
      "Job Complaint/Deficit plan",
      "Regular Notes on Daily Basis"
    ];

    const escapeCSV = (str: any) => {
      if (!str) return '""';
      const safeStr = String(str).replace(/"/g, '""');
      return `"${safeStr}"`;
    };

    const csvRows = candidates.map(c => {
      const d = c.details || {};
      const row = [
        c.serialNo || "",
        c.sourceAgent || "",
        d.leadSource || "",
        c.name || "",
        d.colloquialName || "",
        `${d.age || ''} / ${d.gender || ''}`,
        c.mobileNo || "",
        d.alternativeMobile || "",
        `${d.qualification || ''} ${d.experience || ''}`,
        d.address || "",
        d.prevLocation || "",
        d.prevCompany || "",
        d.prevRoleDuration || "",
        d.prevSalary || "",
        d.prevSalaryProof || "",
        d.prevHRContact || "",
        d.prevExpCertificate || "",
        d.prevWorkTiming || "",
        d.prevRelievingDetails || "",
        d.policeComplaint || "",
        d.healthCondition || "",
        c.preferredRole || "",
        d.preferredTime || "",
        d.preferredSalary || "",
        d.dayOrStay || "",
        d.resumeUrl ? "Attached" : "No",
        d.socialDocs || "",
        d.references || "",
        d.onCallNote || "",
        d.interviewDate || "",
        d.afterInterviewNote || "",
        d.characterNote || "",
        d.jobPlacingDetails || "",
        d.jobRolesResponsibility || "",
        d.jobSalary || "",
        d.jobTimingLeave || "",
        d.jobComplaintPlan || "",
        d.regularDailyNotes || ""
      ];
      return row.map(escapeCSV).join(",");
    });

    const csvContent = [headers.map(escapeCSV).join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Candidates_Export_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Recruitment Pipeline"
        breadcrumbs={[{ label: "HR" }, { label: "Recruitment" }]}
      />
      
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold dark:text-white">Candidate Tracking</h2>
          
          <div className="flex items-center bg-slate-100 dark:bg-black/30 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('pipeline')}
              className={`p-1.5 px-3 rounded-md flex items-center gap-2 text-sm font-bold transition-colors ${viewMode === 'pipeline' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Pipeline
            </button>
            <button 
              onClick={() => setViewMode('sheet')}
              className={`p-1.5 px-3 rounded-md flex items-center gap-2 text-sm font-bold transition-colors ${viewMode === 'sheet' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Table className="w-4 h-4" /> Sheet View
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#05161A]">
        {viewMode === 'pipeline' ? (
          <div className="flex gap-6 min-w-max h-full p-6">
            {STAGES.map(stage => {
            const stageCandidates = candidates.filter(c => c.stage === stage.id);
            return (
              <div 
                key={stage.id}
                className="w-80 flex flex-col bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${stage.color} text-white`}>
                      <stage.icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{stage.label}</h3>
                  </div>
                  <span className="bg-white dark:bg-white/10 text-xs font-bold px-2 py-1 rounded-full dark:text-white">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stageCandidates.map(candidate => (
                    <div 
                      key={candidate.id}
                      draggable
                      onDragStart={() => handleDragStart(candidate)}
                      className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-[#0F969C] dark:hover:border-[#0F969C] transition-all"
                      onClick={() => navigate(`/hr/recruitment/${candidate.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900 dark:text-white">{candidate.name}</h4>
                        <span className="text-xs text-slate-500 font-medium">#{candidate.serialNo.split('-').pop()}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p>📞 {candidate.mobileNo}</p>
                        {candidate.preferredRole && <p>💼 {candidate.preferredRole}</p>}
                        {candidate.sourceAgent && <p className="text-xs mt-2 text-slate-500">Agent: {candidate.sourceAgent}</p>}
                      </div>
                    </div>
                  ))}
                  {stageCandidates.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        ) : (
          <div className="p-0">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-black/40 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 whitespace-nowrap">
                <tr>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[120px]">Serial No</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Addressing Agent</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Lead Generated from</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Official Name</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Colloquial Name</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[100px]">Age / Sex</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[120px]">Mobile No</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[250px]">Alternative Mobile & Family No</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Qualification & Exp.</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[300px]">Full Address</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Prev Location</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Company Details</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Role & Duration</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[100px]">Prev Salary</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Proof of Salary</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">HR/Company Contact</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Exp Certificate</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[120px]">Work Timing</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Relieving Details</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Police Complaint</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Health / Illness</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Preferred Role</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Preferred Time</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Preferred Salary</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[100px]">Day/Stay</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[100px]">Resume</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Social Docs (Aadhar, etc)</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">5 References</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[250px]">On-Call Note</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Interview Date</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[250px]">After Interview Note</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[250px]">Character Note</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Job Placing Details</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Roles & Responsibilities</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[100px]">Job Salary</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[150px]">Job Timing & Leave</th>
                  <th className="border-b border-r dark:border-white/10 px-4 py-3 min-w-[200px]">Complaint / Deficit Plan</th>
                  <th className="border-b dark:border-white/10 px-4 py-3 min-w-[250px]">Regular Notes</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => {
                  const d = c.details || {};
                  return (
                    <tr key={c.id} className="border-b dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors whitespace-nowrap bg-white dark:bg-transparent">
                      <td className="border-r dark:border-white/5 px-4 py-3 font-medium">{c.serialNo}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{c.sourceAgent}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.leadSource}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3 font-bold">{c.name}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.colloquialName}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.age} / {d.gender}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{c.mobileNo}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.alternativeMobile}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.qualification} {d.experience}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3 truncate max-w-xs">{d.address}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevLocation}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevCompany}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevRoleDuration}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevSalary}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevSalaryProof}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevHRContact}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevExpCertificate}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevWorkTiming}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.prevRelievingDetails}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.policeComplaint}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.healthCondition}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{c.preferredRole}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.preferredTime}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.preferredSalary}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.dayOrStay}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.resumeUrl ? 'Attached' : 'No'}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.socialDocs}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3 truncate max-w-xs">{d.references}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3 truncate max-w-xs">{d.onCallNote}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.interviewDate}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3 truncate max-w-xs">{d.afterInterviewNote}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3 truncate max-w-xs">{d.characterNote}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.jobPlacingDetails}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.jobRolesResponsibility}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.jobSalary}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.jobTimingLeave}</td>
                      <td className="border-r dark:border-white/5 px-4 py-3">{d.jobComplaintPlan}</td>
                      <td className="px-4 py-3 truncate max-w-xs">{d.regularDailyNotes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {candidates.length === 0 && (
              <div className="text-center p-12 text-slate-500">
                No candidates available.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Placement Modal */}
      {showPlaceModal && placingCandidate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold dark:text-white">Confirm Job Placement</h3>
              <p className="text-sm text-slate-500 mt-1">Convert {placingCandidate.name} into an active staff member.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Staff Employee ID (Auto-generated if empty)</label>
                <input 
                  value={placeData.empId} 
                  onChange={e => setPlaceData({...placeData, empId: e.target.value})}
                  className="w-full border rounded-lg p-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  placeholder="e.g. EMP-101"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Designation / Role</label>
                <input 
                  value={placeData.designation} 
                  onChange={e => setPlaceData({...placeData, designation: e.target.value})}
                  className="w-full border rounded-lg p-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  placeholder={placingCandidate.preferredRole}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Department</label>
                <input 
                  value={placeData.department} 
                  onChange={e => setPlaceData({...placeData, department: e.target.value})}
                  className="w-full border rounded-lg p-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Joining Date</label>
                <input 
                  type="date"
                  value={placeData.joiningDate} 
                  onChange={e => setPlaceData({...placeData, joiningDate: e.target.value})}
                  className="w-full border rounded-lg p-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setShowPlaceModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium">Cancel</button>
              <button onClick={handlePlaceConfirm} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow-lg">Confirm Placement</button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Schedule Modal */}
      {showInterviewModal && interviewCandidate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/20">
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">Schedule Interview</h3>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-500 mt-1">Send a professional WhatsApp invitation to {interviewCandidate.name}.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Interview Date</label>
                <input 
                  type="date"
                  value={interviewSchedule.date} 
                  onChange={e => setInterviewSchedule({...interviewSchedule, date: e.target.value})}
                  className="w-full border rounded-lg p-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Interview Time</label>
                <input 
                  type="time"
                  value={interviewSchedule.time} 
                  onChange={e => setInterviewSchedule({...interviewSchedule, time: e.target.value})}
                  className="w-full border rounded-lg p-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-500">
                A pre-written professional message will be sent to <strong>{interviewCandidate.mobileNo}</strong> asking them to bring their Aadhar and certificates.
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setShowInterviewModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium">Cancel</button>
              <button onClick={handleSendInterviewWhatsApp} className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-lg">
                Confirm & Send WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

