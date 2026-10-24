import { useState, useMemo, useEffect } from 'react'
import {
	CheckCircle2,
	Clock,
	Download,
	Home,
	MapPin,
	MessageSquare,
	Package,
	Plus,
	Printer,
	Save,
	ShieldAlert,
	UserCheck,
	Users,
	X,
} from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { UNCF_BRANDING } from '../../../constants/branding'
import { financeService } from '../finance.service'
import { careService } from '../../care/care.service'
import { visitorSecurityService } from '../../visitor-security/visitorSecurity.service'
import { homeCareService } from '../../home-care/homeCare.service'
import { useActiveUnit } from '../../../context/useActiveUnit'
import { PatientBillReceiptDrawer } from '../components/PatientBillReceiptDrawer'
import { formatElderId } from '../../../utils/idFormatters'
import type { CarePatient } from '../../care/care.types'
import type { HomeCareAdmission } from '../../home-care/homeCare.types'
import type {
	AccountTransaction,
	InvoiceRecord,
	ManualBillingPayload,
	PatientLookupResult,
} from '../finance.types'

type ManualBillingTabProps = {
	onInvoiceGenerated: () => void
}

export function ManualBillingTab({ onInvoiceGenerated }: ManualBillingTabProps) {
	const { activeUnitId } = useActiveUnit()
	const [billType, setBillType] = useState<'ELDER_CARE' | 'HOME_CARE'>('ELDER_CARE')

	// Active resident patient dropdown state (Elder Care)
	const [activeResidents, setActiveResidents] = useState<CarePatient[]>([])
	const [isLoadingResidents, setIsLoadingResidents] = useState<boolean>(true)
	const [selectedResidentId, setSelectedResidentId] = useState<string>('')
	const [showManualPatientEntry, setShowManualPatientEntry] = useState<boolean>(false)

	// Active Home Care clients dropdown state (Home Care)
	const [activeHomeCareClients, setActiveHomeCareClients] = useState<HomeCareAdmission[]>([])
	const [isLoadingHomeCareClients, setIsLoadingHomeCareClients] = useState<boolean>(true)
	const [selectedHomeCareAdmissionId, setSelectedHomeCareAdmissionId] = useState<string>('')

	// Common Patient / Client details
	const [patientName, setPatientName] = useState<string>('')
	const [patientId, setPatientId] = useState<string>('')
	const [elderId, setElderId] = useState<string>('')
	const [patientAge, setPatientAge] = useState<string>('')
	const [patientSex, setPatientSex] = useState<string>('Male')
	const [patientDob, setPatientDob] = useState<string>('')

	// Elder Care specific fields
	const [membershipPlan, setMembershipPlan] = useState<string>('Assisted Care')
	const [membershipCategory, setMembershipCategory] = useState<string>('Standard')
	const [bedSharing, setBedSharing] = useState<string>('Single Room')

	// Home Care specific fields
	const [homeCareShift, setHomeCareShift] = useState<string>('12 Hours Day Duty (8:00 AM - 8:00 PM)')
	const [homeCarePackage, setHomeCarePackage] = useState<string>('General Elder Attendant Support')
	const [homeServiceAddress, setHomeServiceAddress] = useState<string>('')
	const [assignedStaffName, setAssignedStaffName] = useState<string>('')

	// Billing period
	const [billingMonthYear, setBillingMonthYear] = useState<string>(
		new Date().toISOString().slice(0, 7),
	)
	const [billingFrequency, setBillingFrequency] = useState<string>('Monthly')
	const [billingDays, setBillingDays] = useState<string>('30')
	const [contractStartDate, setContractStartDate] = useState<string>('')
	const [contractEndDate, setContractEndDate] = useState<string>('')

	// Guardian / Sponsor details
	const [guardianName, setGuardianName] = useState<string>('')
	const [guardianContact, setGuardianContact] = useState<string>('')
	const [guardianCity, setGuardianCity] = useState<string>('')

	// Elder Care residential charges (Rate & Subsidy)
	const [boardingRate, setBoardingRate] = useState<number>(20000)
	const [boardingSubsidy, setBoardingSubsidy] = useState<number>(0)

	const [careStaffRate, setCareStaffRate] = useState<number>(8000)
	const [careStaffSubsidy, setCareStaffSubsidy] = useState<number>(0)

	const [therapyRate, setTherapyRate] = useState<number>(3000)
	const [therapySubsidy, setTherapySubsidy] = useState<number>(0)

	const [foodRate, setFoodRate] = useState<number>(6000)
	const [foodSubsidy, setFoodSubsidy] = useState<number>(0)

	const [utilityRate, setUtilityRate] = useState<number>(2500)
	const [medicalConsumablesRate, setMedicalConsumablesRate] = useState<number>(1500)

	// Home Care domiciliary tariffs (Rate strictly Zero Subsidy)
	const [homeNursingRate, setHomeNursingRate] = useState<number>(20000)
	const [doctorVisitRate, setDoctorVisitRate] = useState<number>(1500)
	const [physioHomeRate, setPhysioHomeRate] = useState<number>(3000)
	const [equipmentRentalRate, setEquipmentRentalRate] = useState<number>(0)
	const [homeConsumablesRate, setHomeConsumablesRate] = useState<number>(1500)
	const [conveyanceRate, setConveyanceRate] = useState<number>(1000)

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceRecord | null>(null)
	const [isSent, setIsSent] = useState<boolean>(false)
	const [sentContact, setSentContact] = useState<string>('')
	const [showStatementDrawer, setShowStatementDrawer] = useState<boolean>(false)
	const [isDispatching, setIsDispatching] = useState<boolean>(false)

	// PDF Download state
	const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false)
	const [pdfSuccessNotice, setPdfSuccessNotice] = useState<string | null>(null)

	// Patient lookup
	const [searchResults, setSearchResults] = useState<PatientLookupResult[]>([])
	const [isSearching, setIsSearching] = useState<boolean>(false)

	// Load active residents for Elder Care on mount or unit change
	useEffect(() => {
		let isMounted = true
		setIsLoadingResidents(true)

		const fetchResidents = async () => {
			try {
				const carePatients = await careService.getActivePatients(activeUnitId)
				if (isMounted && Array.isArray(carePatients) && carePatients.length > 0) {
					setActiveResidents(carePatients)
					setIsLoadingResidents(false)
					return
				}
			} catch {
				// Fallback
			}

			try {
				const fallback = await visitorSecurityService.getResidents(activeUnitId)
				if (isMounted) {
					const mapped: CarePatient[] = (fallback || []).map((r) => ({
						id: r.id,
						name: r.name,
						elderId: r.elderId || null,
					}))
					setActiveResidents(mapped)
				}
			} catch {
				if (isMounted) setActiveResidents([])
			} finally {
				if (isMounted) setIsLoadingResidents(false)
			}
		}

		fetchResidents()

		return () => {
			isMounted = false
		}
	}, [activeUnitId])

	// Load active Home Care clients on mount or unit change
	useEffect(() => {
		let isMounted = true
		setIsLoadingHomeCareClients(true)

		homeCareService
			.getAdmissions(activeUnitId)
			.then((admissions) => {
				if (isMounted) {
					setActiveHomeCareClients(Array.isArray(admissions) ? admissions : [])
				}
			})
			.catch(() => {
				if (isMounted) setActiveHomeCareClients([])
			})
			.finally(() => {
				if (isMounted) setIsLoadingHomeCareClients(false)
			})

		return () => {
			isMounted = false
		}
	}, [activeUnitId])

	const handleSelectResident = (resId: string) => {
		setSelectedResidentId(resId)
		if (!resId) return

		const resident = activeResidents.find((r) => r.id === resId)
		if (resident) {
			setPatientId(resident.id)
			setPatientName(resident.name)
			if (resident.elderId) setElderId(resident.elderId)
			if (resident.age) setPatientAge(String(resident.age))
			if (resident.gender) setPatientSex(resident.gender)
			if (resident.phone || resident.emergencyContact) {
				setGuardianContact(resident.emergencyContact || resident.phone || '')
			}
			if (resident.room) {
				setBedSharing(`Room ${resident.room}${resident.bed ? ` / Bed ${resident.bed}` : ''}`)
			}
		}
	}

	const handleClearResidentSelection = () => {
		setSelectedResidentId('')
		setPatientId('')
		setElderId('')
		setPatientName('')
		setPatientAge('')
		setGuardianContact('')
	}

	const handleSelectHomeCareClient = (admissionId: string) => {
		setSelectedHomeCareAdmissionId(admissionId)
		if (!admissionId) return

		const admission = activeHomeCareClients.find((a) => a.id === admissionId)
		if (admission) {
			const pName = admission.patient?.name || admission.enquiry?.client?.name || ''
			setPatientName(pName)
			if (admission.patient?.id) setPatientId(admission.patient.id)
			if (admission.patient?.age) setPatientAge(String(admission.patient.age))
			if (admission.patient?.gender) setPatientSex(admission.patient.gender)
			if (admission.enquiry?.client?.name) setGuardianName(admission.enquiry.client.name)
			if (admission.enquiry?.client?.mobile || admission.patient?.mobile) {
				setGuardianContact(admission.enquiry?.client?.mobile || admission.patient?.mobile || '')
			}
			if (admission.enquiry?.client?.address) {
				setHomeServiceAddress(admission.enquiry.client.address)
			}
			if (admission.enquiry?.service?.name) {
				setHomeCarePackage(admission.enquiry.service.name)
			}
		}
	}

	const handleClearHomeCareSelection = () => {
		setSelectedHomeCareAdmissionId('')
		setPatientId('')
		setPatientName('')
		setPatientAge('')
		setGuardianName('')
		setGuardianContact('')
		setHomeServiceAddress('')
	}

	// Generate authoritative HTML for bill PDF
	const generatePrintableBillHtml = (customRef?: string) => {
		const isHomeCare = billType === 'HOME_CARE'
		const refNo = customRef || generatedInvoice?.refNo || (isHomeCare ? 'UHC-HOME-INV' : 'UEC-INV-MANUAL')
		const billTypeLabel =
			isHomeCare ? 'Home Care Domiciliary Service' : 'Elder Care Boarding'
		const contractPeriod =
			contractStartDate && contractEndDate
				? `${contractStartDate} to ${contractEndDate}`
				: `${billingMonthYear}-01 to ${billingMonthYear}-30`

		const grossTotal = totals.gross
		const subsidyTotal = totals.totalSubsidies
		const netPayable = totals.netPayable

		const accountHolder = UNCF_BRANDING.bankDetails.accountName
		const upiId = UNCF_BRANDING.bankDetails.upiId
		const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountHolder)}&am=${netPayable.toFixed(2)}&cu=INR&tn=CareBill-${refNo}`
		const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`

		return `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<title>${billTypeLabel} Statement - ${patientName || 'Client'}</title>
	<style>
		@page { size: A4; margin: 12mm; }
		* { box-sizing: border-box; }
		body { margin: 0; background: #fff; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; }
		.sheet { width: 680px; margin: 0 auto; background: #fff; padding: 18px; }
		.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0F969C; padding-bottom: 14px; margin-bottom: 16px; }
		.org-title { font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; }
		.org-subtitle { font-size: 10px; color: #0F969C; font-weight: 700; margin-top: 2px; }
		.org-meta { font-size: 9.5px; color: #64748b; line-height: 1.4; margin-top: 4px; }
		.invoice-tag { text-align: right; background: #f0fdfa; border: 1.5px solid #0F969C; border-radius: 8px; padding: 10px 14px; }
		.invoice-tag h2 { margin: 0; font-size: 14px; color: #0f766e; font-weight: 800; }
		.invoice-tag p { margin: 3px 0 0; font-size: 9.5px; color: #475569; }
		
		.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
		.meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; }
		.meta-box h4 { margin: 0 0 6px; font-size: 10px; color: #0F969C; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
		.meta-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
		.meta-label { color: #64748b; font-weight: 600; }
		.meta-val { color: #0f172a; font-weight: 700; }
		
		.item-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
		.item-table th { background: #0F969C; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 8px 10px; text-align: left; }
		.item-table td { padding: 7px 10px; font-size: 10px; border-bottom: 1px solid #e2e8f0; }
		.item-table tr:nth-child(even) { background: #fafcff; }
		.item-table .num { text-align: right; font-variant-numeric: tabular-nums; }
		
		.totals-area { display: flex; justify-content: flex-end; margin-bottom: 16px; }
		.totals-box { width: 260px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; }
		.total-row { display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 4px; }
		.grand-total { border-top: 1.5px solid #0F969C; padding-top: 6px; margin-top: 4px; font-size: 13px; font-weight: 800; color: #0f766e; }

		.payment-qr-section { display: grid; grid-template-columns: 1fr auto; gap: 14px; background: #f0fdfa; border: 1.5px solid #99f6e4; border-radius: 8px; padding: 12px 14px; align-items: center; margin-bottom: 16px; }
		.pay-info h4 { margin: 0 0 6px; font-size: 10.5px; color: #0f766e; text-transform: uppercase; font-weight: 800; }
		.pay-info p { margin: 2px 0; font-size: 10px; color: #1e293b; }
		.qr-wrapper { text-align: center; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; }
		.qr-wrapper img { width: 110px; height: 110px; display: block; margin: 0 auto; }
		.qr-caption { font-size: 9px; font-weight: 800; color: #0f172a; margin-top: 3px; }

		.gita-box { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 10px 14px; text-align: center; margin-bottom: 14px; }
		.gita-title { font-size: 9.5px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
		.gita-verse { font-size: 9.5px; font-style: italic; color: #78350f; margin: 3px 0; }
		.gita-meta { font-size: 8.5px; color: #b45309; border-top: 1px dashed #fcd34d; padding-top: 3px; margin-top: 4px; }

		.bill-footer { font-size: 8.5px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
	</style>
</head>
<body>
	<div class="sheet">
		<!-- Header -->
		<div class="header">
			<div>
				<div class="org-title">${UNCF_BRANDING.organizationName}</div>
				<div class="org-subtitle">${UNCF_BRANDING.trustSubtitle}</div>
				<div class="org-meta">
					${UNCF_BRANDING.regNumber} • ${UNCF_BRANDING.taxExemptionText}<br/>
					${UNCF_BRANDING.address} • Phone: ${UNCF_BRANDING.phone} • Email: ${UNCF_BRANDING.email}
				</div>
			</div>
			<div class="invoice-tag">
				<h2>OFFICIAL INVOICE</h2>
				<p>Ref: <strong>${refNo}</strong></p>
				<p>Date: <strong>${new Date().toLocaleDateString('en-IN')}</strong></p>
			</div>
		</div>

		<!-- Beneficiary & Contract Metadata -->
		<div class="meta-grid">
			${isHomeCare ? `
			<div class="meta-box">
				<h4>Home Care Patient & Residence Details</h4>
				<div class="meta-row"><span class="meta-label">Client / Patient:</span><span class="meta-val">${patientName}</span></div>
				<div class="meta-row"><span class="meta-label">Age / Gender:</span><span class="meta-val">${patientAge ? `${patientAge} Yrs` : 'Adult'} / ${patientSex}</span></div>
				<div class="meta-row"><span class="meta-label">Care Shift / Duty:</span><span class="meta-val">${homeCareShift}</span></div>
				<div class="meta-row"><span class="meta-label">Service Package:</span><span class="meta-val">${homeCarePackage}</span></div>
				<div class="meta-row"><span class="meta-label">Home Address:</span><span class="meta-val">${homeServiceAddress || 'Client Residence'}</span></div>
				${assignedStaffName ? `<div class="meta-row"><span class="meta-label">Assigned Staff:</span><span class="meta-val">${assignedStaffName}</span></div>` : ''}
			</div>
			` : `
			<div class="meta-box">
				<h4>Patient & Beneficiary Details</h4>
				<div class="meta-row"><span class="meta-label">Patient Name:</span><span class="meta-val">${patientName}</span></div>
				<div class="meta-row"><span class="meta-label">Elder ID:</span><span class="meta-val">${formatElderId(elderId, patientId)}</span></div>
				<div class="meta-row"><span class="meta-label">Age / Gender:</span><span class="meta-val">${patientAge ? `${patientAge} Yrs` : 'Elderly'} / ${patientSex}</span></div>
				<div class="meta-row"><span class="meta-label">Accommodation:</span><span class="meta-val">${bedSharing}</span></div>
				<div class="meta-row"><span class="meta-label">Care Plan:</span><span class="meta-val">${membershipPlan} (${membershipCategory})</span></div>
			</div>
			`}

			<div class="meta-box">
				<h4>Service Contract & Guardian</h4>
				<div class="meta-row"><span class="meta-label">Service Domain:</span><span class="meta-val">${billTypeLabel}</span></div>
				<div class="meta-row"><span class="meta-label">Contract Period:</span><span class="meta-val">${contractPeriod}</span></div>
				<div class="meta-row"><span class="meta-label">Billing Cycle:</span><span class="meta-val">${billingFrequency} (${billingDays || '30'} Days)</span></div>
				<div class="meta-row"><span class="meta-label">Guardian / Sponsor:</span><span class="meta-val">${guardianName || 'Family Sponsor'}</span></div>
				<div class="meta-row"><span class="meta-label">Contact / City:</span><span class="meta-val">${guardianContact || 'On Record'} ${guardianCity ? `• ${guardianCity}` : ''}</span></div>
			</div>
		</div>

		<!-- Itemized Charges Table -->
		<table class="item-table">
			<thead>
				<tr>
					<th>${isHomeCare ? 'Home Care Service / Domiciliary Component' : 'Service / Care Component'}</th>
					<th class="num" style="width: 100px;">Tariff Rate</th>
					${!isHomeCare ? '<th class="num" style="width: 100px;">UNCF Subsidy</th>' : ''}
					<th class="num" style="width: 110px;">Net Payable</th>
				</tr>
			</thead>
			<tbody>
				${isHomeCare ? `
					${homeNursingRate > 0 ? `
					<tr>
						<td><strong>Home Nursing & Caregiver Attendant Fee</strong><br/><span style="color:#64748b; font-size:8.5px;">Dedicated bedside care attendant / nurse (${homeCareShift})</span></td>
						<td class="num">₹${homeNursingRate.toFixed(2)}</td>
						<td class="num"><strong>₹${homeNursingRate.toFixed(2)}</strong></td>
					</tr>` : ''}

					${doctorVisitRate > 0 ? `
					<tr>
						<td><strong>Doctor Home Visits & Clinical Assessment</strong><br/><span style="color:#64748b; font-size:8.5px;">Periodic physician domiciliary review, vital check & prescription management</span></td>
						<td class="num">₹${doctorVisitRate.toFixed(2)}</td>
						<td class="num"><strong>₹${doctorVisitRate.toFixed(2)}</strong></td>
					</tr>` : ''}

					${physioHomeRate > 0 ? `
					<tr>
						<td><strong>Physiotherapy & Rehabilitation at Home</strong><br/><span style="color:#64748b; font-size:8.5px;">Bedside therapeutic exercises, mobility assistance & rehabilitation</span></td>
						<td class="num">₹${physioHomeRate.toFixed(2)}</td>
						<td class="num"><strong>₹${physioHomeRate.toFixed(2)}</strong></td>
					</tr>` : ''}

					${equipmentRentalRate > 0 ? `
					<tr>
						<td><strong>Home Medical Equipment Rental</strong><br/><span style="color:#64748b; font-size:8.5px;">Rental of medical devices (oxygen, hospital bed, suction, wheelchair)</span></td>
						<td class="num">₹${equipmentRentalRate.toFixed(2)}</td>
						<td class="num"><strong>₹${equipmentRentalRate.toFixed(2)}</strong></td>
					</tr>` : ''}

					${homeConsumablesRate > 0 ? `
					<tr>
						<td><strong>Medical Consumables & Care Supplies</strong><br/><span style="color:#64748b; font-size:8.5px;">Dressings, gloves, hygiene supplies, adult diapers, clinical disposables</span></td>
						<td class="num">₹${homeConsumablesRate.toFixed(2)}</td>
						<td class="num"><strong>₹${homeConsumablesRate.toFixed(2)}</strong></td>
					</tr>` : ''}

					${conveyanceRate > 0 ? `
					<tr>
						<td><strong>Domiciliary Travel & Conveyance</strong><br/><span style="color:#64748b; font-size:8.5px;">Staff commute transit allowance to client residence</span></td>
						<td class="num">₹${conveyanceRate.toFixed(2)}</td>
						<td class="num"><strong>₹${conveyanceRate.toFixed(2)}</strong></td>
					</tr>` : ''}
				` : `
					${boardingRate > 0 ? `
					<tr>
						<td><strong>Room Boarding & Stay</strong><br/><span style="color:#64748b; font-size:8.5px;">Standard boarding accommodation & room maintenance</span></td>
						<td class="num">₹${boardingRate.toFixed(2)}</td>
						<td class="num" style="color:#ea580c;">- ₹${boardingSubsidy.toFixed(2)}</td>
						<td class="num"><strong>₹${(boardingRate - boardingSubsidy).toFixed(2)}</strong></td>
					</tr>` : ''}

					${careStaffRate > 0 ? `
					<tr>
						<td><strong>Care Staffing & Nursing</strong><br/><span style="color:#64748b; font-size:8.5px;">24x7 Nurse / Caregiver assistance & clinical oversight</span></td>
						<td class="num">₹${careStaffRate.toFixed(2)}</td>
						<td class="num" style="color:#ea580c;">- ₹${careStaffSubsidy.toFixed(2)}</td>
						<td class="num"><strong>₹${(careStaffRate - careStaffSubsidy).toFixed(2)}</strong></td>
					</tr>` : ''}

					${therapyRate > 0 ? `
					<tr>
						<td><strong>Physiotherapy & Rehabilitation</strong><br/><span style="color:#64748b; font-size:8.5px;">Specialized therapy & physical rehabilitation sessions</span></td>
						<td class="num">₹${therapyRate.toFixed(2)}</td>
						<td class="num" style="color:#ea580c;">- ₹${therapySubsidy.toFixed(2)}</td>
						<td class="num"><strong>₹${(therapyRate - therapySubsidy).toFixed(2)}</strong></td>
					</tr>` : ''}

					${foodRate > 0 ? `
					<tr>
						<td><strong>Dietary & Nutrition Services</strong><br/><span style="color:#64748b; font-size:8.5px;">Nutritional elder meals, diet management & herbal beverages</span></td>
						<td class="num">₹${foodRate.toFixed(2)}</td>
						<td class="num" style="color:#ea580c;">- ₹${foodSubsidy.toFixed(2)}</td>
						<td class="num"><strong>₹${(foodRate - foodSubsidy).toFixed(2)}</strong></td>
					</tr>` : ''}

					${utilityRate > 0 ? `
					<tr>
						<td><strong>Laundry & Room Utilities</strong><br/><span style="color:#64748b; font-size:8.5px;">Electricity, linen sanitization, hygiene utilities</span></td>
						<td class="num">₹${utilityRate.toFixed(2)}</td>
						<td class="num">- ₹0.00</td>
						<td class="num"><strong>₹${utilityRate.toFixed(2)}</strong></td>
					</tr>` : ''}

					${medicalConsumablesRate > 0 ? `
					<tr>
						<td><strong>Medical Consumables</strong><br/><span style="color:#64748b; font-size:8.5px;">Hygiene supplies, dressing, gloves, daily consumables</span></td>
						<td class="num">₹${medicalConsumablesRate.toFixed(2)}</td>
						<td class="num">- ₹0.00</td>
						<td class="num"><strong>₹${medicalConsumablesRate.toFixed(2)}</strong></td>
					</tr>` : ''}
				`}
			</tbody>
		</table>

		<!-- Totals Box -->
		<div class="totals-area">
			<div class="totals-box">
				<div class="total-row"><span class="meta-label">Gross Tariff:</span><span>₹${grossTotal.toFixed(2)}</span></div>
				${!isHomeCare ? `<div class="total-row" style="color:#ea580c;"><span class="meta-label">UNCF Subsidy:</span><span>- ₹${subsidyTotal.toFixed(2)}</span></div>` : ''}
				<div class="total-row grand-total"><span>Total Payable:</span><span>₹${netPayable.toFixed(2)}</span></div>
			</div>
		</div>

		<!-- Payment & QR Code Section -->
		<div class="payment-qr-section">
			<div class="pay-info">
				<h4>Official Payment & Bank Transfer Details</h4>
				<p><strong>Account Name:</strong> ${UNCF_BRANDING.bankDetails.accountName}</p>
				<p><strong>Bank:</strong> ${UNCF_BRANDING.bankDetails.bankName} | <strong>A/C:</strong> <span style="font-family:monospace; font-weight:700;">${UNCF_BRANDING.bankDetails.accountNumber}</span></p>
				<p><strong>IFSC:</strong> <span style="font-family:monospace; font-weight:700;">${UNCF_BRANDING.bankDetails.ifscCode}</span> | <strong>Branch:</strong> ${UNCF_BRANDING.bankDetails.branch}</p>
				<p><strong>UPI ID:</strong> <span style="font-family:monospace; font-weight:700; color:#0F969C;">${upiId}</span></p>
				<p style="font-size:9px; color:#475569; margin-top:4px;">* Kindly quote statement reference <strong>${refNo}</strong> when transferring funds.</p>
			</div>

			<div class="qr-wrapper">
				<img src="${qrCodeUrl}" alt="Scan & Pay UPI QR" />
				<div class="qr-caption">Scan to Pay ₹${netPayable.toFixed(2)}</div>
				<div style="font-size:7.5px; color:#64748b;">GPay / PhonePe / Paytm / BHIM</div>
			</div>
		</div>

		<!-- Bhagavad Gita Wisdom on Selfless Service, Love & Humanity -->
		<div class="gita-box">
			<div class="gita-title">🌸 BHAGAVAD GITA — SELFLESS SERVICE & HUMANITY 🌸</div>
			<div class="gita-verse">
				${UNCF_BRANDING.gitaQuotes[0].quote} — <strong>${UNCF_BRANDING.gitaQuotes[0].verse}</strong>
			</div>
			<div class="gita-meta">
				Dedicated with humility to the welfare, health, and dignified sustenance of our respected patients.
			</div>
		</div>

		<!-- System generated notice -->
		<div class="bill-footer">
			This is an authoritative computer-generated bill by Universal Nature Care & Cure Foundation (UNCF Trust). No physical signature required.
		</div>
	</div>
</body>
</html>`
	}

	// Function to download Bill PDF
	const downloadBillPdf = async (customRef?: string): Promise<boolean> => {
		setIsGeneratingPdf(true)
		setPdfSuccessNotice(null)
		try {
			const isHomeCare = billType === 'HOME_CARE'
			const refNo = customRef || generatedInvoice?.refNo || (isHomeCare ? 'UHC-HOME' : 'UEC-MANUAL')
			const safeName = (patientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_')
			const htmlContent = generatePrintableBillHtml(refNo)

			const tempContainer = document.createElement('div')
			tempContainer.innerHTML = htmlContent
			document.body.appendChild(tempContainer)

			const opt = {
				margin: [8, 8, 8, 8] as [number, number, number, number],
				filename: `Bill_${safeName}_${refNo}.pdf`,
				image: { type: 'jpeg' as const, quality: 0.98 },
				html2canvas: { scale: 2, useCORS: true, logging: false },
				jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
			}

			await html2pdf().set(opt).from(tempContainer).save()
			document.body.removeChild(tempContainer)

			setPdfSuccessNotice(`Official Bill PDF downloaded: Bill_${safeName}_${refNo}.pdf`)
			return true
		} catch (err) {
			console.error('Failed to generate PDF', err)
			alert('Failed to generate PDF automatically. You can use the Print / View Statement button to print to PDF.')
			return false
		} finally {
			setIsGeneratingPdf(false)
		}
	}

	const formatManualBillWhatsAppMessage = (invoice: InvoiceRecord) => {
		const isHomeCare = billType === 'HOME_CARE'
		const billTypeLabel = isHomeCare ? 'Home Care Service' : 'Elder Care Boarding'
		const period =
			contractStartDate && contractEndDate
				? `${contractStartDate} to ${contractEndDate}`
				: billingMonthYear
		const netAmount = Number(invoice.amount || totals.netPayable).toFixed(2)
		const recipient = guardianName || (isHomeCare ? 'Family / Client' : 'Family / Guardian')
		const ref = invoice.refNo || 'N/A'

		return (
			`*Universal Nature Care & Cure Foundation (UNCF Trust)*\n` +
			`*${isHomeCare ? 'Home Care Domiciliary Service Statement & Payment Advice' : 'Elder Care Resident Statement & Payment Advice'}*\n\n` +
			`Dear ${recipient},\n\n` +
			`Please find the official *${billTypeLabel}* statement details for *${patientName}* (Ref: *${ref}*):\n\n` +
			`📋 *Service & Care Details:*\n` +
			`• *Patient / Client:* ${patientName}${!isHomeCare && elderId ? ` (${elderId})` : ''}\n` +
			`• *Service Domain:* ${billTypeLabel}\n` +
			(isHomeCare ? `• *Care Shift & Duty:* ${homeCareShift}\n` : '') +
			(isHomeCare && homeCarePackage ? `• *Service Package:* ${homeCarePackage}\n` : '') +
			(isHomeCare && homeServiceAddress ? `• *Care Delivery Address:* ${homeServiceAddress}\n` : '') +
			(isHomeCare && assignedStaffName ? `• *Assigned Care Staff:* ${assignedStaffName}\n` : '') +
			`• *Contract / Billing Period:* ${period}\n` +
			`• *Total Due:* *₹${netAmount}*\n\n` +
			`💳 *Payment Details / UPI:*\n` +
			`• *UPI ID:* ${UNCF_BRANDING.bankDetails.upiId}\n` +
			`• *Bank:* ${UNCF_BRANDING.bankDetails.bankName} | A/C: ${UNCF_BRANDING.bankDetails.accountNumber} | IFSC: ${UNCF_BRANDING.bankDetails.ifscCode}\n` +
			`_(Please quote Ref ${ref} when transferring funds)_\n\n` +
			`📄 *Official Bill PDF Attached:*\n` +
			`The itemized statement with the scannable UPI QR code has been generated. You can scan the QR code directly to complete the transfer.\n\n` +
			`🙏 _"${UNCF_BRANDING.gitaQuotes[0].quote} — ${UNCF_BRANDING.gitaQuotes[0].verse}"_\n\n` +
			`Kindly share the payment transfer ID / screenshot once transferred for verified ledger receipt.\n\n` +
			`Thank you for entrusting Universal Health Care with your care.`
		)
	}

	const handleSendWhatsApp = async () => {
		if (!generatedInvoice) return
		let rawContact = guardianContact.trim()
		if (!rawContact) {
			const promptPhone = window.prompt(
				'Enter WhatsApp Mobile Number for Family / Guardian (10 digits):',
				guardianContact || '',
			)
			if (!promptPhone) return
			rawContact = promptPhone.trim()
			setGuardianContact(rawContact)
		}

		let cleanPhone = rawContact.replace(/[^0-9]/g, '')
		if (cleanPhone.length === 10) {
			cleanPhone = `91${cleanPhone}`
		}

		if (cleanPhone.length < 10) {
			alert('Please enter a valid 10-digit mobile number.')
			return
		}

		// 1. Download the Bill PDF automatically to the user's computer ready to attach
		await downloadBillPdf(generatedInvoice.refNo || undefined)

		// 2. Open WhatsApp Web with the pre-filled message
		const message = formatManualBillWhatsAppMessage(generatedInvoice)
		const targetUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

		// Reliable anchor click ensures browser popup blocker never blocks WhatsApp Web
		const a = document.createElement('a')
		a.href = targetUrl
		a.target = '_blank'
		a.rel = 'noopener noreferrer'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)

		setIsDispatching(true)
		try {
			await financeService.markPatientReceiptSent({
				invoiceId: generatedInvoice.id,
				sentVia: 'WhatsApp',
				familyContact: cleanPhone,
			})
			setIsSent(true)
			setSentContact(cleanPhone)
		} catch (err) {
			console.error('Failed to record statement dispatch', err)
		} finally {
			setIsDispatching(false)
		}
	}

	const handleMarkSentManually = async () => {
		if (!generatedInvoice) return
		setIsDispatching(true)
		try {
			await financeService.markPatientReceiptSent({
				invoiceId: generatedInvoice.id,
				sentVia: 'WhatsApp',
				familyContact: guardianContact.trim() || undefined,
			})
			setIsSent(true)
			setSentContact(guardianContact.trim())
		} catch (err) {
			const error = err as Error
			alert(error?.message || 'Failed to update statement dispatch.')
		} finally {
			setIsDispatching(false)
		}
	}

	const handleCreateNewBill = () => {
		setGeneratedInvoice(null)
		setIsSent(false)
		setSentContact('')
		setPatientName('')
		setPatientId('')
		setElderId('')
		setSelectedResidentId('')
		setSelectedHomeCareAdmissionId('')
		setGuardianName('')
		setGuardianContact('')
		setGuardianCity('')
		setHomeServiceAddress('')
		setAssignedStaffName('')
	}

	// Calculate totals based on billType and subsidy rules
	const totals = useMemo(() => {
		if (billType === 'HOME_CARE') {
			const gross =
				homeNursingRate +
				doctorVisitRate +
				physioHomeRate +
				equipmentRentalRate +
				homeConsumablesRate +
				conveyanceRate
			return {
				gross,
				totalSubsidies: 0,
				netPayable: gross,
			}
		}

		// ELDER_CARE calculations
		const gross =
			boardingRate +
			careStaffRate +
			therapyRate +
			foodRate +
			utilityRate +
			medicalConsumablesRate

		const totalSubsidies =
			boardingSubsidy + careStaffSubsidy + therapySubsidy + foodSubsidy

		const netPayable = Math.max(0, gross - totalSubsidies)

		return { gross, totalSubsidies, netPayable }
	}, [
		billType,
		boardingRate,
		boardingSubsidy,
		careStaffRate,
		careStaffSubsidy,
		therapyRate,
		therapySubsidy,
		foodRate,
		foodSubsidy,
		utilityRate,
		medicalConsumablesRate,
		homeNursingRate,
		doctorVisitRate,
		physioHomeRate,
		equipmentRentalRate,
		homeConsumablesRate,
		conveyanceRate,
	])

	const invoiceAsAccountTransaction = useMemo<AccountTransaction | null>(() => {
		if (!generatedInvoice) return null
		const isHomeCare = billType === 'HOME_CARE'
		const billTypeLabel =
			isHomeCare ? 'Home Care Service' : 'Elder Care Boarding'
		const netAmount = Number(generatedInvoice.amount || totals.netPayable)
		return {
			id: generatedInvoice.id,
			refNo: generatedInvoice.refNo || (isHomeCare ? 'UHC-HOME-INV' : 'INV-MANUAL'),
			type: 'INVOICE',
			amount: netAmount,
			status: 'FINALIZED',
			clientName: patientName,
			date: new Date().toISOString(),
			tenantId: generatedInvoice.tenantId || 'DEFAULT',
			unitId: generatedInvoice.unitId || 'UNIVERSAL_HEALTH_CARE',
			createdAt: generatedInvoice.createdAt || new Date().toISOString(),
			updatedAt: generatedInvoice.updatedAt || new Date().toISOString(),
			metadata: {
				serviceType: billTypeLabel,
				patientName,
				guardianName,
				familyContact: sentContact || guardianContact,
				billingPeriodFrom: contractStartDate || `${billingMonthYear}-01`,
				billingPeriodTo: contractEndDate || `${billingMonthYear}-30`,
				paidAmount: 0,
				balanceAmount: netAmount,
				upiId: UNCF_BRANDING.bankDetails.upiId,
				invoiceWorkflowStatus: isSent ? 'SENT' : 'CREATED',
				sentVia: 'WhatsApp',
				chargeSummary: isHomeCare
					? [
							...(homeNursingRate > 0
								? [
										{
											category: 'Home Nursing / Attendant',
											description: `Dedicated Caregiver (${homeCareShift})`,
											rate: homeNursingRate,
											amount: homeNursingRate,
										},
								  ]
								: []),
							...(doctorVisitRate > 0
								? [
										{
											category: 'Doctor Visits',
											description: 'Doctor Home Visits & Clinical Review',
											rate: doctorVisitRate,
											amount: doctorVisitRate,
										},
								  ]
								: []),
							...(physioHomeRate > 0
								? [
										{
											category: 'Physiotherapy',
											description: 'Physiotherapy & Rehabilitation at Home',
											rate: physioHomeRate,
											amount: physioHomeRate,
										},
								  ]
								: []),
							...(equipmentRentalRate > 0
								? [
										{
											category: 'Equipment Rental',
											description: 'Home Medical Equipment Rental',
											rate: equipmentRentalRate,
											amount: equipmentRentalRate,
										},
								  ]
								: []),
							...(homeConsumablesRate > 0
								? [
										{
											category: 'Consumables & Supplies',
											description: 'Medical Consumables & Care Supplies',
											rate: homeConsumablesRate,
											amount: homeConsumablesRate,
										},
								  ]
								: []),
							...(conveyanceRate > 0
								? [
										{
											category: 'Travel & Conveyance',
											description: 'Domiciliary Transit Allowance',
											rate: conveyanceRate,
											amount: conveyanceRate,
										},
								  ]
								: []),
					  ]
					: [
							...(boardingRate > 0
								? [
										{
											category: 'Accommodation & Boarding',
											description: 'Boarding tariff',
											rate: boardingRate,
											amount: boardingRate - boardingSubsidy,
										},
								  ]
								: []),
							...(careStaffRate > 0
								? [
										{
											category: 'Care Staffing',
											description: 'Nursing / Caregiver tariff',
											rate: careStaffRate,
											amount: careStaffRate - careStaffSubsidy,
										},
								  ]
								: []),
							...(therapyRate > 0
								? [
										{
											category: 'Physiotherapy',
											description: 'Therapy sessions',
											rate: therapyRate,
											amount: therapyRate - therapySubsidy,
										},
								  ]
								: []),
							...(foodRate > 0
								? [
										{
											category: 'Nutrition & Meals',
											description: 'Catering tariff',
											rate: foodRate,
											amount: foodRate - foodSubsidy,
										},
								  ]
								: []),
							...(utilityRate > 0
								? [
										{
											category: 'Utilities',
											description: 'Utility charges',
											rate: utilityRate,
											amount: utilityRate,
										},
								  ]
								: []),
							...(medicalConsumablesRate > 0
								? [
										{
											category: 'Consumables',
											description: 'Medical supplies',
											rate: medicalConsumablesRate,
											amount: medicalConsumablesRate,
										},
								  ]
								: []),
					  ],
			},
		}
	}, [
		generatedInvoice,
		billType,
		totals.netPayable,
		patientName,
		guardianName,
		sentContact,
		guardianContact,
		contractStartDate,
		contractEndDate,
		billingMonthYear,
		isSent,
		homeNursingRate,
		homeCareShift,
		doctorVisitRate,
		physioHomeRate,
		equipmentRentalRate,
		homeConsumablesRate,
		conveyanceRate,
		boardingRate,
		boardingSubsidy,
		careStaffRate,
		careStaffSubsidy,
		therapyRate,
		therapySubsidy,
		foodRate,
		foodSubsidy,
		utilityRate,
		medicalConsumablesRate,
	])

	const handleSearchPatient = async () => {
		if (!patientName.trim() || patientName.length < 3) return
		setIsSearching(true)
		try {
			const res = await financeService.lookupPatient(patientName)
			setSearchResults(res)
		} catch {
			setSearchResults([])
		} finally {
			setIsSearching(false)
		}
	}

	const handleSelectPatient = (p: PatientLookupResult) => {
		setPatientId(p.id)
		setPatientName(p.name)
		if (p.age) setPatientAge(String(p.age))
		if (p.gender) setPatientSex(p.gender)
		if (p.dob) setPatientDob(p.dob)
		setSearchResults([])
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!patientName.trim()) {
			setError(
				billType === 'HOME_CARE'
					? 'Please enter Home Care client / patient name.'
					: 'Please enter resident / patient name.',
			)
			return
		}
		if (totals.netPayable <= 0) {
			setError('Net payable amount must be greater than zero.')
			return
		}

		setIsSubmitting(true)
		setError(null)
		setGeneratedInvoice(null)

		const payload: ManualBillingPayload =
			billType === 'HOME_CARE'
				? {
						patientId: patientId || undefined,
						patientName: patientName.trim(),
						contractStartDate: contractStartDate || undefined,
						contractEndDate: contractEndDate || undefined,
						totalAmount: totals.netPayable,
						billingMonthYear,
						billType: 'HOME_CARE',
						patientAge,
						patientSex,
						patientDob,
						membershipPlan: homeCarePackage,
						membershipCategory: 'Home Care',
						guardianName,
						guardianContact,
						guardianAddress:
							guardianCity || homeServiceAddress
								? {
										city: guardianCity,
										street: homeServiceAddress,
								  }
								: undefined,
						billingFrequency,
						billingDays,
						careStaff: { rate: homeNursingRate },
						therapy: { rate: physioHomeRate },
						medicalSupport: { rate: doctorVisitRate },
						medicalConsumables: { rate: homeConsumablesRate },
						transportation: { rate: conveyanceRate },
						homeFields: {
							careShift: homeCareShift,
							serviceAddress: homeServiceAddress,
							assignedStaff: assignedStaffName,
							package: homeCarePackage,
							equipmentRental: equipmentRentalRate,
						},
				  }
				: {
						patientId: patientId || undefined,
						patientName: patientName.trim(),
						contractStartDate: contractStartDate || undefined,
						contractEndDate: contractEndDate || undefined,
						totalAmount: totals.netPayable,
						billingMonthYear,
						billType: 'ELDER_CARE',
						patientAge,
						patientSex,
						patientDob,
						membershipPlan,
						membershipCategory,
						bedSharing,
						guardianName,
						guardianContact,
						guardianAddress: guardianCity ? { city: guardianCity } : undefined,
						billingFrequency,
						billingDays,
						accommodation: {
							rate: boardingRate,
							subsidy: boardingSubsidy,
						},
						careStaff: {
							rate: careStaffRate,
							subsidy: careStaffSubsidy,
						},
						therapy: {
							rate: therapyRate,
							subsidy: therapySubsidy,
						},
						food: {
							rate: foodRate,
							subsidy: foodSubsidy,
						},
						utility: { rate: utilityRate },
						medicalConsumables: { rate: medicalConsumablesRate },
				  }

		try {
			const res = await financeService.generateManualBill(payload)
			setGeneratedInvoice(res)
			onInvoiceGenerated()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to generate manual billing invoice.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
			{/* Bill Type Selector Banner */}
			<div
				style={{
					backgroundColor: '#ffffff',
					padding: '1.25rem',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: '1rem',
				}}
			>
				<div>
					<span className="section-kicker">FINANCIAL ENGINE</span>
					<h3 style={{ margin: '0.15rem 0 0', fontSize: '1.1rem', fontWeight: 800 }}>
						Universal Manual Billing Generator
					</h3>
					<p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
						Select domain model. Subsidy calculations are strictly isolated per ERP business rules.
					</p>
				</div>

				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<button
						type="button"
						className={`button ${billType === 'ELDER_CARE' ? 'primary' : 'secondary'}`}
						onClick={() => setBillType('ELDER_CARE')}
					>
						Elder Care Boarding (Subsidy Allowed)
					</button>
					<button
						type="button"
						className={`button ${billType === 'HOME_CARE' ? 'primary' : 'secondary'}`}
						onClick={() => setBillType('HOME_CARE')}
					>
						Home Care Service (Zero Subsidy Strict)
					</button>
				</div>
			</div>

			{billType === 'HOME_CARE' && (
				<div
					style={{
						backgroundColor: '#fffbeb',
						border: '1px solid #fde68a',
						borderRadius: '8px',
						padding: '0.75rem 1rem',
						display: 'flex',
						alignItems: 'center',
						gap: '0.75rem',
						fontSize: '0.825rem',
						color: '#92400e',
					}}
				>
					<ShieldAlert size={18} color="#d97706" />
					<span>
						<strong>Home Care Subsidy Protection Active:</strong> Subsidies are disabled for Home Care contracts.
						All service tariffs are evaluated at standard charge rates.
					</span>
				</div>
			)}

			{error && <div className="error-banner">{error}</div>}

			{generatedInvoice && (
				<div
					style={{
						backgroundColor: '#f0fdfa',
						border: '2px solid #0F969C',
						borderRadius: '12px',
						padding: '1.25rem',
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							justifyContent: 'space-between',
							alignItems: 'center',
							gap: '0.75rem',
						}}
					>
						<div>
							<strong
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.4rem',
									color: '#0f766e',
									fontSize: '1.05rem',
								}}
							>
								<CheckCircle2 size={18} color="#0F969C" /> Bill Finalized Successfully!
							</strong>
							<p style={{ margin: '0.25rem 0 0', color: '#334155', fontSize: '0.9rem' }}>
								Invoice Ref: <strong>{generatedInvoice.refNo}</strong> | Domain:{' '}
								<strong>
									{billType === 'ELDER_CARE'
										? 'Elder Care Boarding'
										: 'Home Care Service'}
								</strong>{' '}
								| Net Amount:{' '}
								<strong style={{ color: '#0F969C' }}>
									₹{Number(generatedInvoice.amount || totals.netPayable).toFixed(2)}
								</strong>
							</p>
						</div>

						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							{isSent ? (
								<span
									className="status-badge status-badge--active"
									style={{
										fontSize: '0.8rem',
										padding: '0.35rem 0.65rem',
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.3rem',
									}}
								>
									<CheckCircle2 size={13} />
									Dispatched to Family ({sentContact || guardianContact || 'WhatsApp'})
								</span>
							) : (
								<span
									className="status-badge status-badge--active"
									style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
								>
									FINALIZED & POSTED
								</span>
							)}
						</div>
					</div>

					{pdfSuccessNotice && (
						<div
							style={{
								backgroundColor: '#eff6ff',
								border: '1px solid #bfdbfe',
								borderRadius: '8px',
								padding: '0.65rem 0.9rem',
								fontSize: '0.8rem',
								color: '#1e40af',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<CheckCircle2 size={16} color="#2563eb" />
							<span>
								<strong>Bill PDF Ready:</strong> {pdfSuccessNotice}. You can attach this file into the opened WhatsApp conversation.
							</span>
						</div>
					)}

					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: '0.75rem',
							borderTop: '1px solid #ccfbf1',
							paddingTop: '0.85rem',
						}}
					>
						{isSent ? (
							<button
								type="button"
								className="button"
								disabled
								style={{
									backgroundColor: '#f1f5f9',
									borderColor: '#cbd5e1',
									color: '#0f766e',
									fontWeight: 700,
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.4rem',
									cursor: 'not-allowed',
									opacity: 0.9,
								}}
								title="Statement has already been dispatched to family via WhatsApp"
							>
								<CheckCircle2 size={16} color="#0F969C" />
								Dispatched via WhatsApp
							</button>
						) : (
							<button
								type="button"
								className="button primary"
								style={{
									backgroundColor: '#25D366',
									borderColor: '#22bf5b',
									color: '#ffffff',
									fontWeight: 700,
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.4rem',
								}}
								onClick={handleSendWhatsApp}
								disabled={isDispatching || isGeneratingPdf}
							>
								<MessageSquare size={16} />
								Send via WhatsApp (with PDF)
							</button>
						)}

						<button
							type="button"
							className="button secondary"
							onClick={() => downloadBillPdf()}
							disabled={isGeneratingPdf}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.4rem',
							}}
						>
							<Download size={15} />
							{isGeneratingPdf ? 'Generating PDF...' : 'Download Bill PDF'}
						</button>

						<button
							type="button"
							className="button secondary"
							onClick={() => setShowStatementDrawer(true)}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.4rem',
							}}
						>
							<Printer size={15} />
							Print / View Statement
						</button>

						{!isSent && (
							<button
								type="button"
								className="button secondary"
								onClick={handleMarkSentManually}
								disabled={isDispatching}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.4rem',
								}}
							>
								<CheckCircle2 size={15} />
								Mark as Sent
							</button>
						)}

						<button
							type="button"
							className="button secondary"
							onClick={handleCreateNewBill}
							style={{
								marginLeft: 'auto',
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.4rem',
							}}
						>
							<Plus size={15} />
							Create Another Bill
						</button>
					</div>

					{/* Prefilled WhatsApp Message Preview */}
					<div
						style={{
							backgroundColor: '#ffffff',
							border: '1px solid #99f6e4',
							borderRadius: '8px',
							padding: '0.85rem 1rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '0.45rem',
							}}
						>
							<span
								style={{
									fontSize: '0.8rem',
									fontWeight: 700,
									color: '#0f766e',
									display: 'flex',
									alignItems: 'center',
									gap: '0.4rem',
								}}
							>
								<MessageSquare size={15} color="#25D366" />
								Prefilled WhatsApp Advice Message ({billType === 'HOME_CARE' ? 'Home Care Service' : 'Elder Care Boarding'}):
							</span>
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(formatManualBillWhatsAppMessage(generatedInvoice))
									alert('Prefilled WhatsApp message copied to clipboard!')
								}}
								style={{
									background: 'none',
									border: 'none',
									color: '#0F969C',
									fontSize: '0.75rem',
									fontWeight: 700,
									cursor: 'pointer',
									textDecoration: 'underline',
								}}
							>
								Copy Message Text
							</button>
						</div>
						<pre
							style={{
								margin: 0,
								padding: '0.75rem 1rem',
								backgroundColor: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '6px',
								fontSize: '0.78rem',
								fontFamily: 'inherit',
								whiteSpace: 'pre-wrap',
								color: '#334155',
								maxHeight: '160px',
								overflowY: 'auto',
								lineHeight: 1.5,
							}}
						>
							{formatManualBillWhatsAppMessage(generatedInvoice)}
						</pre>
					</div>
				</div>
			)}

			<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
				{/* Section 1: Patient / Client Information Grid */}
				<div
					style={{
						backgroundColor: '#ffffff',
						padding: '1.25rem',
						borderRadius: '12px',
						border: '1px solid #e2e8f0',
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
						<h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
							{billType === 'HOME_CARE' ? (
								<>
									<Home size={16} color="#0F969C" /> 1. HOME CARE CLIENT & PATIENT INFORMATION
								</>
							) : (
								<>
									<Users size={16} color="#0F969C" /> 1. RESIDENT / BENEFICIARY INFORMATION
								</>
							)}
						</h4>
						<button
							type="button"
							onClick={() => setShowManualPatientEntry(!showManualPatientEntry)}
							style={{
								background: 'none',
								border: 'none',
								color: '#0F969C',
								fontSize: '0.75rem',
								fontWeight: 600,
								cursor: 'pointer',
								textDecoration: 'underline',
							}}
						>
							{showManualPatientEntry
								? billType === 'HOME_CARE'
									? 'Select from Active Home Care Clients'
									: 'Select from Active Residents'
								: 'Custom / Walk-in Entry'}
						</button>
					</div>

					{/* Dropdown for Active Patient Selection */}
					{!showManualPatientEntry && (
						<div
							style={{
								marginBottom: '1.25rem',
								backgroundColor: '#f8fafc',
								border: '1px solid #cbd5e1',
								borderRadius: '8px',
								padding: '0.85rem 1rem',
							}}
						>
							{billType === 'HOME_CARE' ? (
								<>
									<label
										className="field-label"
										style={{
											marginBottom: '0.35rem',
											display: 'flex',
											alignItems: 'center',
											gap: '0.4rem',
										}}
									>
										<Home size={14} color="#0F969C" />
										Choose Active Home Care Client ({activeHomeCareClients.length} Home Care Clients Available)
									</label>
									<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
										<select
											className="filter-select"
											value={selectedHomeCareAdmissionId}
											onChange={(e) => handleSelectHomeCareClient(e.target.value)}
											disabled={isLoadingHomeCareClients}
											style={{
												flex: 1,
												height: '42px',
												fontWeight: 600,
												backgroundColor: '#ffffff',
												borderColor: '#cbd5e1',
											}}
										>
											<option value="">
												{isLoadingHomeCareClients
													? 'Loading active home care clients...'
													: '-- Select Active Home Care Client to Auto-Fill Bill Details --'}
											</option>
											{activeHomeCareClients.map((a) => {
												const cName = a.patient?.name || a.enquiry?.client?.name || 'Unnamed Client'
												const serviceName = a.enquiry?.service?.name || 'Home Care'
												const area = a.enquiry?.client?.address || ''
												return (
													<option key={a.id} value={a.id}>
														{cName} • {serviceName} {area ? `(${area.slice(0, 30)}...)` : ''}
													</option>
												)
											})}
										</select>

										{selectedHomeCareAdmissionId && (
											<button
												type="button"
												className="button secondary button--small"
												onClick={handleClearHomeCareSelection}
												style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
											>
												<X size={14} /> Clear
											</button>
										)}
									</div>
									{selectedHomeCareAdmissionId && (
										<p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#0f766e', fontWeight: 600 }}>
											✓ Home Care client & residence data auto-filled into form. You can review and adjust any field below.
										</p>
									)}
								</>
							) : (
								<>
									<label
										className="field-label"
										style={{
											marginBottom: '0.35rem',
											display: 'flex',
											alignItems: 'center',
											gap: '0.4rem',
										}}
									>
										<Users size={14} color="#0F969C" />
										Choose Active Resident Patient ({activeResidents.length} Inpatients Available)
									</label>
									<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
										<select
											className="filter-select"
											value={selectedResidentId}
											onChange={(e) => handleSelectResident(e.target.value)}
											disabled={isLoadingResidents}
											style={{
												flex: 1,
												height: '42px',
												fontWeight: 600,
												backgroundColor: '#ffffff',
												borderColor: '#cbd5e1',
											}}
										>
											<option value="">
												{isLoadingResidents
													? 'Loading active residents...'
													: '-- Select Inpatient Resident to Auto-Fill Bill Details --'}
											</option>
											{activeResidents.map((r) => (
												<option key={r.id} value={r.id}>
													{r.name} {r.elderId ? `(${r.elderId})` : ''} {r.room ? `• Room ${r.room}` : ''}{' '}
													{r.bed ? `• Bed ${r.bed}` : ''}
												</option>
											))}
										</select>

										{selectedResidentId && (
											<button
												type="button"
												className="button secondary button--small"
												onClick={handleClearResidentSelection}
												style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
											>
												<X size={14} /> Clear
											</button>
										)}
									</div>
									{selectedResidentId && (
										<p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#0f766e', fontWeight: 600 }}>
											✓ Resident data auto-filled into form. You can review and adjust any field below.
										</p>
									)}
								</>
							)}
						</div>
					)}

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								{billType === 'HOME_CARE' ? 'Patient / Client Name *' : 'Patient / Resident Name *'}
							</label>
							<div style={{ display: 'flex', gap: '0.4rem' }}>
								<input
									type="text"
									required
									value={patientName}
									onChange={(e) => setPatientName(e.target.value)}
									placeholder={billType === 'HOME_CARE' ? 'e.g. Mrs. Kamala Devi' : 'e.g. Harish Kumar'}
								/>
								<button
									type="button"
									className="button secondary button--small"
									onClick={handleSearchPatient}
									disabled={isSearching}
								>
									{isSearching ? '...' : 'Lookup'}
								</button>
							</div>

							{searchResults.length > 0 && (
								<div
									style={{
										marginTop: '0.4rem',
										border: '1px solid #cbd5e1',
										borderRadius: '4px',
										backgroundColor: '#f8fafc',
										maxHeight: '120px',
										overflowY: 'auto',
									}}
								>
									{searchResults.map((p) => (
										<div
											key={p.id}
											onClick={() => handleSelectPatient(p)}
											style={{
												padding: '0.4rem 0.6rem',
												fontSize: '0.75rem',
												borderBottom: '1px solid #e2e8f0',
												cursor: 'pointer',
											}}
										>
											<strong>{p.name}</strong> ({p.gender || 'M'}, {p.age || '-'} yrs)
										</div>
									))}
								</div>
							)}
						</div>

						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								Age & Gender
							</label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<input
									type="number"
									value={patientAge}
									onChange={(e) => setPatientAge(e.target.value)}
									placeholder="Age"
									style={{ width: '80px' }}
								/>
								<select
									className="filter-select"
									value={patientSex}
									onChange={(e) => setPatientSex(e.target.value)}
									style={{ flex: 1, height: '42px' }}
								>
									<option value="Male">Male</option>
									<option value="Female">Female</option>
									<option value="Other">Other</option>
								</select>
							</div>
						</div>

						{/* DOMAIN CONDITIONAL FIELDS */}
						{billType === 'HOME_CARE' ? (
							<>
								<div>
									<label className="field-label" style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
										<Clock size={14} color="#0F969C" /> Care Shift & Duty Duration *
									</label>
									<select
										className="filter-select"
										value={homeCareShift}
										onChange={(e) => setHomeCareShift(e.target.value)}
										style={{ width: '100%', height: '42px' }}
									>
										<option value="12 Hours Day Duty (8:00 AM - 8:00 PM)">12 Hours Day Duty (8:00 AM - 8:00 PM)</option>
										<option value="12 Hours Night Duty (8:00 PM - 8:00 AM)">12 Hours Night Duty (8:00 PM - 8:00 AM)</option>
										<option value="24 Hours Full-Time Live-In Care">24 Hours Full-Time Live-In Care</option>
										<option value="Daily Scheduled Visit (2 - 4 Hours)">Daily Scheduled Visit (2 - 4 Hours)</option>
										<option value="On-Demand Nursing Procedure Visit">On-Demand Nursing Procedure Visit</option>
									</select>
								</div>

								<div>
									<label className="field-label" style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
										<Package size={14} color="#0F969C" /> Home Care Service Package
									</label>
									<select
										className="filter-select"
										value={homeCarePackage}
										onChange={(e) => setHomeCarePackage(e.target.value)}
										style={{ width: '100%', height: '42px' }}
									>
										<option value="General Elder Attendant Support">General Elder Attendant Support</option>
										<option value="Post-Operative Skilled Nursing">Post-Operative Skilled Nursing</option>
										<option value="Dementia & Alzheimer Home Care">Dementia & Alzheimer Home Care</option>
										<option value="Palliative & Bedridden Home Care">Palliative & Bedridden Home Care</option>
										<option value="Physiotherapy & Mobility Care">Physiotherapy & Mobility Care</option>
										<option value="Specialized Clinical Home Care">Specialized Clinical Home Care</option>
									</select>
								</div>

								<div style={{ gridColumn: 'span 2' }}>
									<label className="field-label" style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
										<MapPin size={14} color="#0F969C" /> Home Service Address (Care Delivery Residence) *
									</label>
									<input
										type="text"
										value={homeServiceAddress}
										onChange={(e) => setHomeServiceAddress(e.target.value)}
										placeholder="e.g. Flat 402, Green Valley Apartments, JP Nagar 6th Phase, Bangalore"
										style={{ width: '100%' }}
									/>
								</div>

								<div>
									<label className="field-label" style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
										<UserCheck size={14} color="#0F969C" /> Assigned Care Staff / Nurse
									</label>
									<input
										type="text"
										value={assignedStaffName}
										onChange={(e) => setAssignedStaffName(e.target.value)}
										placeholder="e.g. Nurse Radha S / Attendant Mohan"
									/>
								</div>
							</>
						) : (
							<>
								<div>
									<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
										Membership Care Plan
									</label>
									<select
										className="filter-select"
										value={membershipPlan}
										onChange={(e) => setMembershipPlan(e.target.value)}
										style={{ width: '100%', height: '42px' }}
									>
										<option value="Assisted Care">Assisted Living Care</option>
										<option value="Independent Stay">Independent Senior Living</option>
										<option value="Palliative & Nursing">Palliative & Nursing Support</option>
									</select>
								</div>

								<div>
									<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
										Room Sharing / Bed
									</label>
									<select
										className="filter-select"
										value={bedSharing}
										onChange={(e) => setBedSharing(e.target.value)}
										style={{ width: '100%', height: '42px' }}
									>
										<option value="Single Room">Single Private Room</option>
										<option value="Twin Sharing">Twin Sharing Room</option>
										<option value="General Ward">General Ward Bed</option>
									</select>
								</div>

								<div>
									<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
										Membership Category
									</label>
									<select
										className="filter-select"
										value={membershipCategory}
										onChange={(e) => setMembershipCategory(e.target.value)}
										style={{ width: '100%', height: '42px' }}
									>
										<option value="Standard">Standard Boarding</option>
										<option value="Premium">Premium Healthcare</option>
										<option value="Subsidized">Foundation Subsidized</option>
									</select>
								</div>
							</>
						)}

						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								Billing Month
							</label>
							<input
								type="month"
								value={billingMonthYear}
								onChange={(e) => setBillingMonthYear(e.target.value)}
							/>
						</div>

						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								{billType === 'HOME_CARE' ? 'Service Start Date' : 'Contract Start Date'}
							</label>
							<input
								type="date"
								value={contractStartDate}
								onChange={(e) => setContractStartDate(e.target.value)}
							/>
						</div>

						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								{billType === 'HOME_CARE' ? 'Service End Date' : 'Contract End Date'}
							</label>
							<input
								type="date"
								value={contractEndDate}
								onChange={(e) => setContractEndDate(e.target.value)}
							/>
						</div>

						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								Billing Frequency & Days
							</label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<select
									className="filter-select"
									value={billingFrequency}
									onChange={(e) => setBillingFrequency(e.target.value)}
									style={{ flex: 1, height: '42px' }}
								>
									<option value="Monthly">Monthly</option>
									<option value="Bi-Weekly">Bi-Weekly</option>
									<option value="Weekly">Weekly</option>
									<option value="Daily">Daily</option>
									<option value="Per-Visit">Per-Visit</option>
								</select>
								<input
									type="number"
									value={billingDays}
									onChange={(e) => setBillingDays(e.target.value)}
									placeholder="Days"
									style={{ width: '70px' }}
								/>
							</div>
						</div>

						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								{billType === 'HOME_CARE' ? 'Client / Family Sponsor Name' : 'Guardian / Sponsor Name'}
							</label>
							<input
								type="text"
								value={guardianName}
								onChange={(e) => setGuardianName(e.target.value)}
								placeholder="e.g. Ramesh Kumar (Son)"
							/>
						</div>

						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								Contact Phone & City
							</label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<input
									type="text"
									value={guardianContact}
									onChange={(e) => setGuardianContact(e.target.value)}
									placeholder="Phone # / Mobile"
									style={{ flex: 1 }}
								/>
								<input
									type="text"
									value={guardianCity}
									onChange={(e) => setGuardianCity(e.target.value)}
									placeholder="City"
									style={{ width: '100px' }}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Section 2: Itemized Charges Grid */}
				<div
					style={{
						backgroundColor: '#ffffff',
						padding: '1.25rem',
						borderRadius: '12px',
						border: '1px solid #e2e8f0',
					}}
				>
					<div style={{ marginBottom: '1rem' }}>
						<h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#334155' }}>
							{billType === 'HOME_CARE'
								? '2. HOME CARE SERVICE TARIFFS & CHARGES (₹)'
								: '2. RESIDENTIAL CHARGES & SUBSIDY DEDUCTIONS (₹)'}
						</h4>
						<p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
							{billType === 'HOME_CARE'
								? 'Mandatory domiciliary care service items. Subsidies are disabled for Home Care contracts per trust policy.'
								: 'Inpatient accommodation, clinical care, and dietary breakdown with eligible UNCF foundation subsidies.'}
						</p>
					</div>

					<div style={{ overflowX: 'auto' }}>
						<table className="data-table" style={{ width: '100%' }}>
							<thead>
								<tr>
									<th>
										{billType === 'HOME_CARE'
											? 'Service / Domiciliary Care Component'
											: 'Service / Facility Item'}
									</th>
									<th style={{ width: '160px' }}>Charge Rate (₹)</th>
									{billType === 'ELDER_CARE' && (
										<th style={{ width: '160px', color: '#ea580c' }}>Elder Subsidy (₹)</th>
									)}
									<th style={{ textAlign: 'right', width: '140px' }}>Net Item (₹)</th>
								</tr>
							</thead>
							<tbody>
								{billType === 'HOME_CARE' ? (
									<>
										<tr>
											<td>
												<strong>Home Nursing & Caregiver Attendant Fee</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Dedicated bedside attendant / nurse for specified shift duration ({homeCareShift})
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={homeNursingRate}
													onChange={(e) => setHomeNursingRate(Number(e.target.value))}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{homeNursingRate.toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Doctor Home Visits & Clinical Assessment</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Periodic physician domiciliary review, vitals check & prescription audit
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={doctorVisitRate}
													onChange={(e) => setDoctorVisitRate(Number(e.target.value))}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{doctorVisitRate.toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Physiotherapy & Rehabilitation at Home</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Bedside mobility, stroke recovery & therapeutic exercises
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={physioHomeRate}
													onChange={(e) => setPhysioHomeRate(Number(e.target.value))}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{physioHomeRate.toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Home Medical Equipment Rental</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Oxygen concentrator, motorized hospital bed, suction machine, air mattress
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={equipmentRentalRate}
													onChange={(e) => setEquipmentRentalRate(Number(e.target.value))}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{equipmentRentalRate.toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Medical Consumables & Care Supplies</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Hygiene supplies, dressing packs, gloves, adult diapers, catheter kits
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={homeConsumablesRate}
													onChange={(e) => setHomeConsumablesRate(Number(e.target.value))}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{homeConsumablesRate.toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Domiciliary Travel & Conveyance</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Staff transit allowance & travel conveyance to client residence
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={conveyanceRate}
													onChange={(e) => setConveyanceRate(Number(e.target.value))}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{conveyanceRate.toFixed(2)}
											</td>
										</tr>
									</>
								) : (
									<>
										<tr>
											<td>
												<strong>Room Boarding / Accommodation</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Standard monthly boarding stay
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={boardingRate}
													onChange={(e) => setBoardingRate(Number(e.target.value))}
												/>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={boardingSubsidy}
													onChange={(e) => setBoardingSubsidy(Number(e.target.value))}
													style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74' }}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{(boardingRate - boardingSubsidy).toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Care Staff & Nursing Support</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Daily attendant & care monitoring
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={careStaffRate}
													onChange={(e) => setCareStaffRate(Number(e.target.value))}
												/>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={careStaffSubsidy}
													onChange={(e) => setCareStaffSubsidy(Number(e.target.value))}
													style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74' }}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{(careStaffRate - careStaffSubsidy).toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Physiotherapy & Rehabilitation</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Mobility and therapeutic exercises
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={therapyRate}
													onChange={(e) => setTherapyRate(Number(e.target.value))}
												/>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={therapySubsidy}
													onChange={(e) => setTherapySubsidy(Number(e.target.value))}
													style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74' }}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{(therapyRate - therapySubsidy).toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Food, Nutrition & Dietetics</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													3-course nutritious meals and tea
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={foodRate}
													onChange={(e) => setFoodRate(Number(e.target.value))}
												/>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={foodSubsidy}
													onChange={(e) => setFoodSubsidy(Number(e.target.value))}
													style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74' }}
												/>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{(foodRate - foodSubsidy).toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Utilities, Power & Water</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Air conditioning, hot water, generator backup
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={utilityRate}
													onChange={(e) => setUtilityRate(Number(e.target.value))}
												/>
											</td>
											<td>-</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{utilityRate.toFixed(2)}
											</td>
										</tr>

										<tr>
											<td>
												<strong>Medical Consumables & Hygiene</strong>
												<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
													Gloves, sanitizers, adult diapers, cotton
												</p>
											</td>
											<td>
												<input
													type="number"
													min="0"
													value={medicalConsumablesRate}
													onChange={(e) => setMedicalConsumablesRate(Number(e.target.value))}
												/>
											</td>
											<td>-</td>
											<td style={{ textAlign: 'right', fontWeight: 700 }}>
												₹{medicalConsumablesRate.toFixed(2)}
											</td>
										</tr>
									</>
								)}
							</tbody>
						</table>
					</div>

					{/* Totals Summary */}
					<div
						style={{
							marginTop: '1.25rem',
							display: 'flex',
							justifyContent: 'flex-end',
							borderTop: '2px solid #e2e8f0',
							paddingTop: '1rem',
						}}
					>
						<div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
								<span style={{ color: '#64748b' }}>Gross Total:</span>
								<strong>₹{totals.gross.toFixed(2)}</strong>
							</div>
							{billType === 'ELDER_CARE' && (
								<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ea580c' }}>
									<span>Approved Subsidy:</span>
									<strong>- ₹{totals.totalSubsidies.toFixed(2)}</strong>
								</div>
							)}
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									fontSize: '1.15rem',
									fontWeight: 800,
									color: '#0F969C',
									borderTop: '1px solid #cbd5e1',
									paddingTop: '0.4rem',
								}}
							>
								<span>Net Payable:</span>
								<span>₹{totals.netPayable.toFixed(2)}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Final Submission Card */}
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
					<button
						type="submit"
						className="button primary"
						disabled={isSubmitting}
						style={{ minWidth: '220px' }}
					>
						<Save size={16} />
						{isSubmitting ? 'Finalizing...' : 'Finalize & Post Universal Bill'}
					</button>
				</div>
			</form>

			{showStatementDrawer && invoiceAsAccountTransaction && (
				<PatientBillReceiptDrawer
					invoice={invoiceAsAccountTransaction}
					onClose={() => setShowStatementDrawer(false)}
					onMarkSent={(contact) => {
						setIsSent(true)
						if (contact) setSentContact(contact)
					}}
				/>
			)}
		</div>
	)
}
