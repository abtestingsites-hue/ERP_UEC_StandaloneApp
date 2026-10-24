import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { Save, ArrowLeft, Upload, ChevronRight, ChevronLeft, CheckCircle, Search, X } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useStaff } from '../hooks/useHR';

const InputGroup = ({ label, children }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
      {label}
    </label>
    {children}
  </div>
);

export function CandidateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';
  
  const { data: staffList = [] } = useStaff({ scope: 'all' });
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);

  // File UI State (No persistence)
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [salaryProofFile, setSalaryProofFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [socialFiles, setSocialFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    initialCallNotes: '',
    serialNo: '',
    addressingAgent: '',
    leadSource: '',
    name: '',
    colloquialName: '',
    dob: '',
    email: '',
    maritalStatus: 'Single',
    nationality: 'Indian',
    emergencyContactName: '',
    emergencyContactNumber: '',
    formalIdType: 'Aadhaar',
    formalIdNumber: '',
    age: '',
    gender: 'Male',
    mobileNo: '',
    alternativeMobile: '',
    qualification: '',
    experience: '',
    address: '',
    
    prevLocation: '',
    prevCompany: '',
    prevRoleDuration: '',
    prevSalary: '',
    prevSalaryProof: '',
    prevHRContact: '',
    prevExpCertificate: 'No',
    prevWorkTiming: '',
    prevRelievingDetails: '',
    
    policeComplaint: 'No',
    policeComplaintDetails: '',
    healthCondition: '',
    
    preferredRole: '',
    preferredTime: '',
    preferredSalary: '',
    dayOrStay: 'Day',
    
    resumeUrl: '',
    socialDocs: '',
    references: [] as any[],
    
    onCallNote: '',
    interviewDate: '',
    afterInterviewNote: '',
    characterNote: '',

    jobPlacingDetails: '',
    jobRolesResponsibility: '',
    jobSalary: '',
    jobTimingLeave: '',
    jobComplaintPlan: '',
    regularDailyNotes: ''
  });

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      api.get('/hr/candidates').then(res => {
        const candidate = res.data.data.find((c: any) => c.id === id);
        if (candidate) {
          setFormData(prev => ({
            ...prev,
            serialNo: candidate.serialNo || '',
            name: candidate.name || '',
            mobileNo: candidate.mobileNo || '',
            preferredRole: candidate.preferredRole || '',
            addressingAgent: candidate.sourceAgent || '',
            ...candidate.details,
            references: Array.isArray(candidate.details?.references) ? candidate.details.references : [],
            prevExpCertificate: candidate.details?.prevExpCertificate === 'Yes' ? 'Yes' : 'No'
          }));
          
          if (candidate.termsAcceptedAt) {
            setTermsAccepted(true);
            setPoliciesAccepted(true);
          }
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (isDraft = false) => {
    // If not a draft and we are on final step, we must have terms accepted
    if (!isDraft && currentStep === 5 && (!termsAccepted || !policiesAccepted)) {
      alert("You must accept the Terms & Conditions and Staff Policies before final submission.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        serialNo: formData.serialNo,
        name: formData.name,
        mobileNo: formData.mobileNo,
        preferredRole: formData.preferredRole,
        sourceAgent: formData.addressingAgent,
        details: formData,
        ...(termsAccepted && policiesAccepted ? { termsAccepted: true } : {})
      };

      if (isEditing) {
        await api.patch(`/hr/candidates/${id}`, payload);
      } else {
        await api.post('/hr/candidates', payload);
      }
      navigate('/hr/recruitment');
    } catch (error: any) {
      alert("Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border rounded-lg p-3 dark:bg-slate-900 dark:border-slate-700 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors";

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={isEditing ? "Edit Candidate" : "New Job Enquiry / Application"}
        breadcrumbs={[
          { label: "HR" },
          { label: "Recruitment Pipeline", href: "/hr/recruitment" },
          { label: isEditing ? "Edit" : "New Application" }
        ]}
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => navigate('/hr/recruitment')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-6 py-2 rounded-xl font-bold transition-colors"
              >
                Save Draft
              </button>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex justify-between mb-8">
            {[
              "1. Personal",
              "2. Professional",
              "3. Documents",
              "4. Interview",
              "5. Terms & Submit"
            ].map((step, index) => (
              <div 
                key={step} 
                className={`flex-1 text-center py-2 border-b-4 ${currentStep === index + 1 ? 'border-[#0F969C] text-[#0F969C] font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}
              >
                {step}
              </div>
            ))}
          </div>

          <div className="space-y-12">
            
            {/* Quick Notes (Always visible or in Step 1) */}
            {currentStep === 1 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-xl">
                <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-500 mb-2">
                  ⚡ Quick Call Notes (Scratchpad)
                </label>
                <p className="text-xs text-yellow-700/80 dark:text-yellow-600 mb-3">Use this to rapidly type unstructured notes while talking to the candidate on the phone. You can organize it into the fields below later.</p>
                <textarea 
                  name="initialCallNotes" 
                  value={formData.initialCallNotes} 
                  onChange={handleChange} 
                  rows={4}
                  className="w-full border-none rounded-lg p-4 bg-white dark:bg-slate-900 shadow-inner placeholder-slate-400 focus:ring-2 focus:ring-yellow-400" 
                  placeholder="E.g. Wants 40k salary, worked at Apollo, has 2 kids..."
                />
              </div>
            )}

            {/* Step 1. Basic Info */}
            {currentStep === 1 && (
              <section className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">1. Basic Details</h2>
                
                <InputGroup label="1. Serial No">
                  <input name="serialNo" value={formData.serialNo} className={`${inputClass} bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed`} placeholder="Auto-generated by system" disabled />
                </InputGroup>
                <InputGroup label="2. Addressing Agent Name">
                  <div className="relative">
                    <div className="flex items-center">
                      <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search HR Staff..."
                        value={showStaffDropdown ? staffSearch : formData.addressingAgent}
                        onChange={(e) => {
                          if (!showStaffDropdown) {
                            setShowStaffDropdown(true);
                          }
                          setStaffSearch(e.target.value);
                        }}
                        onFocus={() => setShowStaffDropdown(true)}
                        className={`pl-9 pr-10 ${inputClass}`}
                      />
                      {formData.addressingAgent && !showStaffDropdown && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, addressingAgent: '' }))}
                          className="absolute right-3 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>
                    {showStaffDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {staffList
                          .filter((s: any) => s.name.toLowerCase().includes(staffSearch.toLowerCase()))
                          .map((staff: any) => (
                            <button
                              key={staff.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, addressingAgent: staff.name }));
                                setShowStaffDropdown(false);
                                setStaffSearch('');
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors border-b last:border-b-0 border-slate-100 dark:border-slate-700/50"
                            >
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-xs text-slate-500">{staff.role} • {staff.department}</div>
                            </button>
                          ))}
                        {staffList.filter((s: any) => s.name.toLowerCase().includes(staffSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">No staff found</div>
                        )}
                      </div>
                    )}
                  </div>
                </InputGroup>
                <InputGroup label="3. Lead Generated From">
                  <select name="leadSource" value={formData.leadSource} onChange={handleChange} className={inputClass}>
                    <option value="">Select Source...</option>
                    <option>WhatsApp</option>
                    <option>Facebook</option>
                    <option>Reference</option>
                    <option>Walk-in</option>
                    <option>Other</option>
                  </select>
                </InputGroup>
                <InputGroup label="4. Official Name">
                  <input name="name" value={formData.name} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="5. Colloquial Name (Nickname)">
                  <input name="colloquialName" value={formData.colloquialName} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="6. Date of Birth & Age">
                  <div className="flex gap-4">
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={`w-1/2 ${inputClass}`} />
                    <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" className={`w-1/2 ${inputClass}`} />
                  </div>
                </InputGroup>
                <InputGroup label="7. Gender & Marital Status">
                  <div className="flex gap-4">
                    <select name="gender" value={formData.gender} onChange={handleChange} className={`w-1/2 ${inputClass}`}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className={`w-1/2 ${inputClass}`}>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                </InputGroup>
                <InputGroup label="8. Email Address & Nationality">
                  <div className="flex gap-4">
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className={`w-1/2 ${inputClass}`} />
                    <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Nationality" className={`w-1/2 ${inputClass}`} />
                  </div>
                </InputGroup>
                <InputGroup label="9. Mobile No & Alternative Mobile">
                  <div className="flex gap-4">
                    <input type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="Primary Mobile" className={`w-1/2 ${inputClass}`} />
                    <input type="tel" name="alternativeMobile" value={formData.alternativeMobile} onChange={handleChange} placeholder="Alternative Mobile" className={`w-1/2 ${inputClass}`} />
                  </div>
                </InputGroup>
                <InputGroup label="10. Formal ID Proof">
                  <div className="flex gap-4">
                    <select name="formalIdType" value={formData.formalIdType} onChange={handleChange} className={`w-1/3 ${inputClass}`}>
                      <option>Aadhaar</option>
                      <option>PAN</option>
                      <option>Passport</option>
                      <option>Driving Licence</option>
                      <option>Voter ID</option>
                      <option>Other</option>
                    </select>
                    <input type="text" name="formalIdNumber" value={formData.formalIdNumber} onChange={handleChange} placeholder="ID Number" className={`w-2/3 ${inputClass}`} />
                  </div>
                </InputGroup>
                <InputGroup label="11. Emergency Contact">
                  <div className="flex gap-4">
                    <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="Contact Name" className={`w-1/2 ${inputClass}`} />
                    <input type="tel" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} placeholder="Contact Phone" className={`w-1/2 ${inputClass}`} />
                  </div>
                </InputGroup>
                <InputGroup label="12. Qualification & Experience">
                  <input name="qualification" value={formData.qualification} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="13. Full Address">
                  <textarea name="address" value={formData.address} onChange={handleChange} className={inputClass} rows={3}></textarea>
                </InputGroup>
              </section>
            )}

            {/* Step 2. Employment History */}
            {currentStep === 2 && (
              <section className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">2. Previous Employment</h2>
                <InputGroup label="12. Previous Location">
                  <input name="prevLocation" value={formData.prevLocation} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="13. Company Details">
                  <input name="prevCompany" value={formData.prevCompany} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="14. Duty Role & Duration of Work">
                  <input name="prevRoleDuration" value={formData.prevRoleDuration} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="15. Salary">
                  <input type="number" name="prevSalary" value={formData.prevSalary} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="16. Proof of Salary">
                  <input type="file" onChange={(e) => setSalaryProofFile(e.target.files?.[0] || null)} className={inputClass} />
                </InputGroup>
                <InputGroup label="17. HR Contact / Company Contact">
                  <input type="tel" name="prevHRContact" value={formData.prevHRContact} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="18. Experience Certificate Available?">
                  <select name="prevExpCertificate" value={formData.prevExpCertificate} onChange={handleChange} className={inputClass}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                  {formData.prevExpCertificate === 'Yes' && (
                    <div className="mt-2">
                      <input type="file" onChange={(e) => setCertFile(e.target.files?.[0] || null)} className={inputClass} />
                    </div>
                  )}
                </InputGroup>
                <InputGroup label="19. Work Timing">
                  <input name="prevWorkTiming" value={formData.prevWorkTiming} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="20. Relieving Details">
                  <textarea name="prevRelievingDetails" value={formData.prevRelievingDetails} onChange={handleChange} className={inputClass} rows={2}></textarea>
                </InputGroup>
              </section>
            )}

            {/* Step 3. Verification & Preferences */}
            {currentStep === 3 && (
              <section className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">3. Verification, Preferences & Documents</h2>
                <InputGroup label="21. Police Complain (Yes/No) - If yes, what?">
                  <div className="flex gap-4">
                    <select name="policeComplaint" value={formData.policeComplaint} onChange={handleChange} className={`w-1/3 ${inputClass}`}>
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                    {formData.policeComplaint === 'Yes' && (
                      <input name="policeComplaintDetails" value={formData.policeComplaintDetails} onChange={handleChange} placeholder="Complaint Details" className={`w-2/3 ${inputClass}`} />
                    )}
                  </div>
                </InputGroup>
                <InputGroup label="22. Health Condition & Illness">
                  <input name="healthCondition" value={formData.healthCondition} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="23. Preferred Working Role">
                  <select name="preferredRole" value={formData.preferredRole} onChange={handleChange} className={inputClass}>
                    <option value="">Select Role...</option>
                    <option>Maid</option>
                    <option>Cook</option>
                    <option>Nurse</option>
                    <option>Nanny</option>
                    <option>Caregiver</option>
                    <option>Other</option>
                  </select>
                </InputGroup>
                <InputGroup label="24. Preferred Working Time">
                  <input name="preferredTime" value={formData.preferredTime} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="25. Preferred Working Salary">
                  <input type="number" name="preferredSalary" value={formData.preferredSalary} onChange={handleChange} className={inputClass} />
                </InputGroup>
                <InputGroup label="26. Day or Stay?">
                  <select name="dayOrStay" value={formData.dayOrStay} onChange={handleChange} className={inputClass}>
                    <option value="">Select...</option>
                    <option>Day</option>
                    <option>Stay</option>
                  </select>
                </InputGroup>
                <InputGroup label="27. Resume Attachment">
                  <div className="flex items-center gap-4">
                    <input type="file" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className={inputClass} accept=".pdf,.doc,.docx" />
                  </div>
                </InputGroup>
                <InputGroup label="28. Social Documents (Aadhar, Marksheet, etc.)">
                  <div className="flex flex-col gap-2">
                    <input type="file" multiple onChange={(e) => setSocialFiles(Array.from(e.target.files || []))} className={inputClass} />
                    {socialFiles.length > 0 && (
                      <div className="text-sm text-slate-500">Selected {socialFiles.length} file(s)</div>
                    )}
                  </div>
                </InputGroup>
                <InputGroup label="29. Minimum 5 Reference Names & Numbers">
                  <div className="flex flex-col gap-3">
                    {formData.references.map((ref, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input 
                          type="text" 
                          placeholder="Name" 
                          value={ref.name || ''}
                          onChange={(e) => {
                            const newRefs = [...formData.references];
                            newRefs[idx].name = e.target.value;
                            setFormData(prev => ({ ...prev, references: newRefs }));
                          }}
                          className={`w-1/3 ${inputClass}`} 
                        />
                        <input 
                          type="tel" 
                          placeholder="Phone" 
                          value={ref.phone || ''}
                          onChange={(e) => {
                            const newRefs = [...formData.references];
                            newRefs[idx].phone = e.target.value;
                            setFormData(prev => ({ ...prev, references: newRefs }));
                          }}
                          className={`w-1/3 ${inputClass}`} 
                        />
                        <input 
                          type="text" 
                          placeholder="Relation" 
                          value={ref.relation || ''}
                          onChange={(e) => {
                            const newRefs = [...formData.references];
                            newRefs[idx].relation = e.target.value;
                            setFormData(prev => ({ ...prev, references: newRefs }));
                          }}
                          className={`w-1/3 ${inputClass}`} 
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newRefs = formData.references.filter((_, i) => i !== idx);
                            setFormData(prev => ({ ...prev, references: newRefs }));
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          references: [...prev.references, { name: '', phone: '', relation: '', notes: '' }]
                        }));
                      }}
                      className="self-start text-sm font-medium text-[#0F969C] hover:text-[#0F969C]/80"
                    >
                      + Add Reference
                    </button>
                  </div>
                </InputGroup>
              </section>
            )}

            {/* Step 4. Interview Process */}
            {currentStep === 4 && (
              <section className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col gap-5">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">4. Interview & Agent Notes</h2>
                  <InputGroup label="30. On Call Note by Interview Agent">
                    <textarea name="onCallNote" value={formData.onCallNote} onChange={handleChange} className={inputClass} rows={3}></textarea>
                  </InputGroup>
                  <InputGroup label="31. Date of Interview Schedule (If physical)">
                    <input type="datetime-local" name="interviewDate" value={formData.interviewDate} onChange={handleChange} className={inputClass} />
                  </InputGroup>
                  <InputGroup label="32. After Interview Notes by Agent">
                    <textarea name="afterInterviewNote" value={formData.afterInterviewNote} onChange={handleChange} className={inputClass} rows={3}></textarea>
                  </InputGroup>
                  <InputGroup label="33. Character Notes by Agent">
                    <textarea name="characterNote" value={formData.characterNote} onChange={handleChange} className={inputClass} rows={3}></textarea>
                  </InputGroup>
                </div>

                <div className="flex flex-col gap-5 bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800/50">
                  <h2 className="text-xl font-extrabold text-green-800 dark:text-green-500 pb-2 border-b border-green-200 dark:border-green-800/50">Placement Details</h2>
                  <p className="text-sm text-green-700 dark:text-green-600 mb-2">Fill this section only when the candidate is successfully placed.</p>
                  
                  <InputGroup label="Job Placing Details">
                    <input name="jobPlacingDetails" value={formData.jobPlacingDetails} onChange={handleChange} className={inputClass} />
                  </InputGroup>
                  <InputGroup label="Job Roles & Responsibilities">
                    <input name="jobRolesResponsibility" value={formData.jobRolesResponsibility} onChange={handleChange} className={inputClass} />
                  </InputGroup>
                  <InputGroup label="Job Salary">
                    <input name="jobSalary" value={formData.jobSalary} onChange={handleChange} className={inputClass} />
                  </InputGroup>
                  <InputGroup label="Job Timing & Leave">
                    <input name="jobTimingLeave" value={formData.jobTimingLeave} onChange={handleChange} className={inputClass} />
                  </InputGroup>
                  <InputGroup label="Job Complaint / Deficit Plan (by agent)">
                    <textarea name="jobComplaintPlan" value={formData.jobComplaintPlan} onChange={handleChange} className={inputClass} rows={2}></textarea>
                  </InputGroup>
                  <InputGroup label="Regular Notes on Daily Basis">
                    <textarea name="regularDailyNotes" value={formData.regularDailyNotes} onChange={handleChange} className={inputClass} rows={3}></textarea>
                  </InputGroup>
                </div>
              </section>
            )}

            {/* Step 5. Terms & Policies */}
            {currentStep === 5 && (
              <section className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">5. Terms & Policies</h2>
                
                <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Terms & Conditions</h3>
                    <span className="text-xs bg-[#0F969C]/10 text-[#0F969C] px-3 py-1 rounded-full font-bold">Version: v1.0</span>
                  </div>
                  <div className="h-40 overflow-y-auto text-sm text-slate-600 dark:text-slate-400 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 whitespace-pre-wrap">
                    {"1. The candidate agrees to provide accurate and truthful information during the application process.\n2. The organization reserves the right to verify all submitted documents and references.\n3. Any false information provided may result in immediate termination of the application or subsequent employment.\n4. The candidate agrees to maintain confidentiality regarding any proprietary information accessed during the interview process.\n5. Standard background checks will be conducted in accordance with company policy."}
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={termsAccepted} 
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-[#0F969C] focus:ring-[#0F969C]" 
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">I have read and agree to the current Terms & Conditions.</span>
                  </label>
                </div>

                <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Staff Policies</h3>
                    <span className="text-xs bg-[#0F969C]/10 text-[#0F969C] px-3 py-1 rounded-full font-bold">Version: v1.0</span>
                  </div>
                  <div className="h-40 overflow-y-auto text-sm text-slate-600 dark:text-slate-400 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 whitespace-pre-wrap">
                    {"1. Workplace Conduct: All staff must maintain professional behavior and adhere to the code of conduct.\n2. Attendance & Punctuality: Staff are expected to adhere strictly to their scheduled working hours.\n3. Confidentiality (HIPAA/PHI): Any patient or client data accessed must remain strictly confidential.\n4. Health & Safety: Staff must follow all safety protocols, especially in clinical or patient-facing environments.\n5. Grievance Procedure: Staff have the right to report workplace issues through the standard HR grievance channels."}
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={policiesAccepted} 
                      onChange={(e) => setPoliciesAccepted(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-[#0F969C] focus:ring-[#0F969C]" 
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">I acknowledge and agree to the Staff Policies.</span>
                  </label>
                </div>

                {/* Review Summary */}
                <div className="mt-4 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                  <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-3">Review Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${formData.name && formData.mobileNo ? 'text-green-500' : 'text-slate-300'}`} />
                      <span className="text-slate-700 dark:text-slate-300">Personal Information Complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${termsAccepted ? 'text-green-500' : 'text-slate-300'}`} />
                      <span className="text-slate-700 dark:text-slate-300">Terms & Conditions Accepted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${formData.resumeUrl || formData.socialDocs || resumeFile || socialFiles.length > 0 ? 'text-green-500' : 'text-slate-300'}`} />
                      <span className="text-slate-700 dark:text-slate-300">Documents Attached</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${policiesAccepted ? 'text-green-500' : 'text-slate-300'}`} />
                      <span className="text-slate-700 dark:text-slate-300">Staff Policies Acknowledged</span>
                    </div>
                  </div>
                </div>

              </section>
            )}

          </div>

          {/* Bottom Action Bar */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between">
            <div>
              {currentStep > 1 && (
                <button 
                  onClick={prevStep}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-bold transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" /> Previous
                </button>
              )}
            </div>
            
            <div>
              {currentStep < 5 ? (
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-[#0F969C] hover:bg-[#0c7a80] text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => handleSave(false)}
                  disabled={loading || !termsAccepted || !policiesAccepted}
                  className={`flex items-center gap-2 px-10 py-4 rounded-xl font-bold shadow-xl transition-all text-lg ${
                    loading || !termsAccepted || !policiesAccepted 
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-[#0F969C] hover:bg-[#0c7a80] text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  <Save className="w-6 h-6" /> {loading ? "Saving..." : "Submit Application"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
