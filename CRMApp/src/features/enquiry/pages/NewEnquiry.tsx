import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { Button } from '../../../components/Button';
import { useAddEnquiry, useAddFollowUp } from '../hooks/useEnquiry';
import { enquirySchema, type EnquiryFormValues } from '../schema';
import { useAuthStore } from '../../../store/authStore';
import { PlusCircle, Check, ChevronLeft, ChevronRight, Save, ShieldAlert } from 'lucide-react';

const fallbackServices = [
  'Home Care',
  'Clinical Care',
  'In-House Assisted Living',
  'Dementia Care',
  'Skilled Nursing',
  'Post Operative Care',
  'Ambulance Support',
];

const defaultValues: EnquiryFormValues = {
  unitId: '',
  service: 'Home Care',
  mode: 'Call',
  clientName: '',
  mobile: '',
  email: '',
  comments: '',
  status: 'Open',
  leadQuality: 'Warm',
  enquiryIntent: 'Needs pricing discussion',
  followUpPriority: 'Within 24 hours',
  patientName: '',
  patientAge: '',
  patientGender: '',
  patientHealthCondition: '',
  clientAddress: '',
  clientLocation: '',
  remarks: '',
  followupMode: 'Call',
  followupStatus: 'Followup Required',
  leadValidity: 'Genuine',
  conversionReadiness: 'Discussion Stage',
  urgency: 'Normal',
  clientInterest: 'Neutral',
  readyToPayAmount: '',
  paymentMode: '',
  nextFollowupDate: new Date().toISOString().split('T')[0],
  staffId: '',
  attachmentName: '',
  followupComments: '',
};

const steps = [
  { title: 'Enquiry Intake', helper: 'Client contact, service & source details' },
  { title: 'Lead Qualification', helper: 'Intent, lead quality & priority' },
  { title: 'Patient & Health Context', helper: 'Patient background & address' },
  { title: 'Follow-up Assignment', helper: 'Initial call notes & scheduling' },
];

export const NewEnquiry: React.FC = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const addEnquiry = useAddEnquiry();
  const addFollowUp = useAddFollowUp();

  const user = useAuthStore((state) => state.user);
  const activeUnitId = useAuthStore((state) => state.activeUnitId);
  const units = useAuthStore((state) => state.units);
  const resolvedUnitId = (activeUnitId && activeUnitId !== 'ALL' ? activeUnitId : user?.unitId) || (units.length > 0 ? units[0].id : '');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      ...defaultValues,
      unitId: resolvedUnitId,
    },
  });

  const leadQuality = watch('leadQuality');
  const enquiryIntent = watch('enquiryIntent');
  const isInvalidLead = leadQuality === 'Fake / Invalid' || enquiryIntent === 'Wrong / fake enquiry';

  useEffect(() => {
    if (resolvedUnitId) setValue('unitId', resolvedUnitId);
  }, [resolvedUnitId, setValue]);

  useEffect(() => {
    if (isInvalidLead) {
      setValue('status', 'Lost');
      setValue('followupStatus', 'Lost');
      setValue('followUpPriority', 'No follow-up needed');
    }
  }, [isInvalidLead, setValue]);

  const goNext = async () => {
    const fieldsByStep: Array<Array<keyof EnquiryFormValues>> = [
      ['unitId', 'service', 'mode', 'clientName', 'mobile', 'email', 'status'],
      ['leadQuality', 'enquiryIntent', 'followUpPriority'],
      [],
      [],
    ];
    const valid = await trigger(fieldsByStep[step]);
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const onSubmit = async (data: EnquiryFormValues) => {
    const qualificationNotes = [
      '[Lead Qualification]',
      `Lead Quality: ${data.leadQuality}`,
      `Intent: ${data.enquiryIntent}`,
      `Follow-up Priority: ${data.followUpPriority}`,
    ].join('\n');

    const payload = {
      ...data,
      unitId: data.unitId || resolvedUnitId,
      status: isInvalidLead ? ('Lost' as const) : data.status,
      comments: [data.comments, qualificationNotes].filter(Boolean).join('\n\n'),
      remarks: [
        data.remarks,
        isInvalidLead
          ? 'Marked as fake/invalid during enquiry qualification.'
          : 'Qualified as lead from enquiry form.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    };

    const created: any = await addEnquiry.mutateAsync(payload);
    const enquiryId = created?.id;

    if (enquiryId && !isInvalidLead) {
      const note = [
        `Mode: ${data.followupMode || 'N/A'}`,
        `Status: ${data.followupStatus || 'N/A'}`,
        `Lead Validity: ${data.leadValidity || 'N/A'}`,
        `Conversion Readiness: ${data.conversionReadiness || 'N/A'}`,
        `Urgency: ${data.urgency || 'Normal'}`,
        `Client Interest: ${data.clientInterest || 'Neutral'}`,
        `Comments: ${data.followupComments?.trim() || 'Initial follow-up assigned from New Enquiry workflow'}`,
      ]
        .filter(Boolean)
        .join(' | ');

      await addFollowUp.mutateAsync({
        id: enquiryId,
        data: {
          notes: note,
          channel: data.followupMode || undefined,
          outcome: data.followupStatus || undefined,
          clientInterest: data.clientInterest || undefined,
          nextFollowupStatus: data.followupStatus || undefined,
          nextDate:
            data.followupStatus !== 'Followup Not Required' &&
            data.followupStatus !== 'Lost' &&
            data.nextFollowupDate
              ? new Date(data.nextFollowupDate).toISOString()
              : new Date().toISOString(),
        },
      });
    }

    navigate('/crm/enquiry-follow-up');
  };

  const isSubmitting = addEnquiry.isPending || addFollowUp.isPending;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Guided New Lead Capture"
        subtitle="Create a new lead inquiry with intake validation & initial call scheduling"
        icon={PlusCircle}
      />

      {/* Multi-step progress bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((item, idx) => {
          const isDone = step > idx;
          const isCurrent = step === idx;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => idx < step && setStep(idx)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isCurrent
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-slate-100 shadow-md'
                  : isDone
                  ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Step {idx + 1}</span>
                {isDone && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <h4 className="text-xs font-bold truncate">{item.title}</h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.helper}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 0: ENQUIRY INTAKE */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-indigo-300 border-b border-slate-800 pb-2">
                1. Client Contact & Service Intake
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Client Contact Name *"
                  placeholder="e.g. Ramesh Kumar"
                  error={errors.clientName?.message}
                  {...register('clientName')}
                />
                <Input
                  label="Mobile Number *"
                  placeholder="e.g. 9876543210"
                  error={errors.mobile?.message}
                  {...register('mobile')}
                />
                <Input
                  label="Email Address"
                  placeholder="client@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Select
                  label="Service Required *"
                  options={fallbackServices.map((s) => ({ value: s, label: s }))}
                  error={errors.service?.message}
                  {...register('service')}
                />
                <Select
                  label="Inquiry Mode *"
                  options={[
                    { value: 'Call', label: 'Phone Call' },
                    { value: 'Walk-in', label: 'Walk-in' },
                    { value: 'Website', label: 'Website Form' },
                    { value: 'Reference', label: 'Reference / Partner' },
                  ]}
                  error={errors.mode?.message}
                  {...register('mode')}
                />
                <Select
                  label="Initial Status *"
                  options={[
                    { value: 'Open', label: 'Open / New' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Just Enquiry', label: 'Just Enquiry / Info Request' },
                    { value: 'Emergency', label: 'Emergency Priority' },
                  ]}
                  error={errors.status?.message}
                  {...register('status')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Intake Notes / Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter initial client inquiry notes or specific questions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  {...register('comments')}
                />
              </div>
            </div>
          )}

          {/* STEP 1: LEAD QUALIFICATION */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-indigo-300 border-b border-slate-800 pb-2">
                2. Lead Qualification & Intent Filter
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Lead Quality *"
                  options={[
                    { value: 'Hot', label: 'Hot — Immediate Need' },
                    { value: 'Warm', label: 'Warm — Active Consideration' },
                    { value: 'Cold', label: 'Cold — Future Requirement' },
                    { value: 'Fake / Invalid', label: 'Fake / Invalid Inquiry' },
                  ]}
                  {...register('leadQuality')}
                />
                <Select
                  label="Enquiry Intent *"
                  options={[
                    { value: 'Ready to start service', label: 'Ready to start service' },
                    { value: 'Needs pricing discussion', label: 'Needs pricing discussion' },
                    { value: 'Needs family discussion', label: 'Needs family discussion' },
                    { value: 'Just checking', label: 'Just checking rates' },
                    { value: 'Wrong / fake enquiry', label: 'Wrong / fake inquiry' },
                  ]}
                  {...register('enquiryIntent')}
                />
                <Select
                  label="Follow-up Priority *"
                  options={[
                    { value: 'Today', label: 'Today (Urgent)' },
                    { value: 'Within 24 hours', label: 'Within 24 Hours' },
                    { value: 'This week', label: 'This Week' },
                    { value: 'No follow-up needed', label: 'No Follow-up Needed' },
                  ]}
                  {...register('followUpPriority')}
                />
              </div>

              {isInvalidLead && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Marked as Fake / Invalid lead. Status will be automatically updated to Lost.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PATIENT DETAILS */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-indigo-300 border-b border-slate-800 pb-2">
                3. Patient Background & Care Context
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Patient Name" placeholder="e.g. Suresh Kumar" {...register('patientName')} />
                <Input label="Patient Age" placeholder="e.g. 72" {...register('patientAge')} />
                <Select
                  label="Patient Gender"
                  options={[
                    { value: '', label: 'Select Gender' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  {...register('patientGender')}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Health Condition / Medical Concerns"
                  placeholder="e.g. Post-stroke rehabilitation, hypertension"
                  {...register('patientHealthCondition')}
                />
                <Input
                  label="Client Address / Location"
                  placeholder="e.g. Koramangala 4th Block, Bangalore"
                  {...register('clientAddress')}
                />
              </div>
            </div>
          )}

          {/* STEP 3: FOLLOW-UP ASSIGNMENT */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-indigo-300 border-b border-slate-800 pb-2">
                4. Initial Follow-up Call Scheduling
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Follow-up Mode"
                  options={[
                    { value: 'Call', label: 'Phone Call' },
                    { value: 'WhatsApp', label: 'WhatsApp' },
                    { value: 'In-Person', label: 'In-Person Visit' },
                  ]}
                  {...register('followupMode')}
                />
                <Select
                  label="Follow-up Status"
                  options={[
                    { value: 'Followup Required', label: 'Followup Required' },
                    { value: 'Ready To Convert', label: 'Ready To Convert' },
                    { value: 'Call Later', label: 'Call Later' },
                    { value: 'Followup Not Required', label: 'Followup Not Required' },
                  ]}
                  {...register('followupStatus')}
                />
                <Input label="Next Call Date" type="date" {...register('nextFollowupDate')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Initial Action Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter specific call agenda or topics to discuss on next follow-up..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  {...register('followupComments')}
                />
              </div>
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {step > 0 ? (
              <Button type="button" variant="outline" icon={ChevronLeft} onClick={() => setStep(step - 1)}>
                Previous Step
              </Button>
            ) : (
              <div></div>
            )}

            {step < steps.length - 1 ? (
              <Button type="button" variant="primary" icon={ChevronRight} onClick={goNext}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" variant="primary" icon={Save} isLoading={isSubmitting}>
                Submit & Save Enquiry
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};
