import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Edit2, Eye, Trash2, Upload, X, Key } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { UserSelector } from '../../../components/UserSelector'
import { FormActions, FormGrid, FormSection } from '../../../components/FormLayout'
import { ProvisionAccountModal } from '../components/ProvisionAccountModal'
import { ResetStaffPasswordModal } from '../components/ResetStaffPasswordModal'
import { staffSchema, type StaffFormInput, type StaffFormValues } from '../schema'
import type { Staff } from '../types'
import { useStaff, useAddStaff, useUpdateStaff, useUpdateStaffSalary, useDeleteStaff, useRoles, useUploadStaffDocument, useDocumentTracker, useVerifyStaffDocument } from '../hooks/useHR'
import { useAuthorizedUnits } from '../../master/hooks/useUnit'
import { useAuthStore } from '../../../store/authStore'

const getStaffMetadata = (staff?: Staff | null) => (
    staff?.metadata && typeof staff.metadata === 'object' ? staff.metadata : {}
)

const getStaffDocument = (staff: Staff, key: 'aadhaarDocument' | 'resumeDocument', allDocs: any[] = []) => {
    const relationalDoc = allDocs.find(d => d.empId === staff.empId && d.documentType === key)
    if (relationalDoc) {
        return {
            fileName: relationalDoc.fileName,
            fileUrl: relationalDoc.fileUrl,
            status: relationalDoc.status
        }
    }
    const metadata = getStaffMetadata(staff)
    return metadata.documents?.[key]
}

const isExStaffRecord = (staff: Staff) => {
    const status = String(staff.status || 'Working').toLowerCase()
    return Boolean(staff.isDeleted) || status.includes('resign') || status.includes('term')
}

const isDemoStaff = (staff: Staff) => {
    const id = String(staff.id || '').toLowerCase()
    const empId = String(staff.empId || '').toLowerCase()
    const email = String(staff.email || '').toLowerCase()
    return id.startsWith('demo-') || empId.startsWith('demo-') || empId.startsWith('seed-') || email.endsWith('.demo') || email.endsWith('@demo.erp')
}

const money = (value: unknown) => {
    const amount = Number(value || 0)
    return amount > 0 ? `Rs ${amount.toLocaleString('en-IN')}` : '-'
}

const departmentOptions = [
    { value: '', label: '-- Select the Department --' },
    { value: 'Housekeeping', label: 'Housekeeping' },
    { value: 'Patient Care', label: 'Patient Care' },
    { value: 'Nursing', label: 'Nursing' },
    { value: 'Kitchen', label: 'Kitchen' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Inventory', label: 'Inventory' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Security', label: 'Security' },
    { value: 'Medical', label: 'Medical' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Logistics', label: 'Logistics' },
    { value: 'IT Services', label: 'IT Services' }
]

const designationOptions = [
    { value: '', label: '-- Select the Designation --' },
    { value: 'Caregiver', label: 'Caregiver' },
    { value: 'Nurse', label: 'Nurse' },
    { value: 'Doctor', label: 'Doctor' },
    { value: 'Housekeeper', label: 'Housekeeper' },
    { value: 'Cook', label: 'Cook' },
    { value: 'Kitchen Assistant', label: 'Kitchen Assistant' },
    { value: 'Maintenance Worker', label: 'Maintenance Worker' },
    { value: 'Inventory Staff', label: 'Inventory Staff' },
    { value: 'Admin Staff', label: 'Admin Staff' },
    { value: 'Watchman', label: 'Watchman' },
    { value: 'Security Guard', label: 'Security Guard' },
    { value: 'Driver', label: 'Driver' },
    { value: 'Coordinator', label: 'Coordinator' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Operations Manager', label: 'Operations Manager' },
    { value: 'Medical Director', label: 'Medical Director' },
    { value: 'IT Support', label: 'IT Support' }
]

export function StaffManagement() {
    const { data: staffData = [] } = useStaff({ includeFormer: true })
    const { data: units = [] } = useAuthorizedUnits()
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || '')
    const setActiveUnitId = useAuthStore((state) => state.setActiveUnitId)
    const addStaff = useAddStaff()
    const updateStaff = useUpdateStaff()
    const updateStaffSalary = useUpdateStaffSalary()
    const deleteStaff = useDeleteStaff()
    const uploadStaffDocument = useUploadStaffDocument()
    const { data: allDocs = [] } = useDocumentTracker()
    const verifyDoc = useVerifyStaffDocument()
    const { data: roleList = [] } = useRoles()

    const unitOptions = useMemo(() => {
        const options = units.map((unit) => ({
            value: unit.id,
            label: unit.location?.label ? `${unit.name} - ${unit.location.label}` : unit.name
        }))

        return [
            { value: '', label: '-- Select Viewing Unit --' },
            ...options
        ]
    }, [units])
    const unitLabelById = useMemo(
        () => new Map(units.map((unit) => [unit.id, unit.location?.label ? `${unit.name}\n${unit.location.label}` : unit.name])),
        [units]
    )
    const activeUnitLabel = (unitLabelById.get(activeUnitId) as string || '').replace('\n', ' - ') || 'Selected Unit'
    const bloodGroupOptions = useMemo(() => ([
        { value: '', label: '-- Select the Blood Group --' },
        { value: 'A+', label: 'A+' },
        { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' },
        { value: 'B-', label: 'B-' },
        { value: 'AB+', label: 'AB+' },
        { value: 'AB-', label: 'AB-' },
        { value: 'O+', label: 'O+' },
        { value: 'O-', label: 'O-' }
    ]), [])
    const loginRoleOptions = useMemo(() => {
        const fallbackRoles = [
            { id: 'Admin', name: 'Admin' },
            { id: 'Employee', name: 'Employee' }
        ]

        const normalizedRoleNames = new Set(
            roleList
                .map((role) => String(role.name || '').trim().toLowerCase())
                .filter(Boolean)
        )

        const mergedRoles = [
            ...roleList,
            ...fallbackRoles.filter((role) => !normalizedRoleNames.has(role.name.toLowerCase()))
        ]

        return [
            { value: '', label: '-- Select Role --' },
            ...mergedRoles.map((role) => ({
                value: String(role.id || role.name),
                label: role.name
            }))
        ]
    }, [roleList])

    const [viewType, setViewType] = useState<'Active' | 'ExStaff'>('Active')
    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
    const [provisionStaff, setProvisionStaff] = useState<Staff | null>(null)
    const [resetPasswordStaff, setResetPasswordStaff] = useState<Staff | null>(null)
    const [profilePreview, setProfilePreview] = useState('')
    const [cameraOpen, setCameraOpen] = useState(false)
    const [cameraError, setCameraError] = useState('')
    const [aadhaarDocumentName, setAadhaarDocumentName] = useState('')
    const [resumeDocumentName, setResumeDocumentName] = useState('')
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const { register, control, watch, setValue, getValues, handleSubmit, reset, setError, clearErrors, formState: { errors } } = useForm<StaffFormInput, any, StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            empId: '', photoUrl: '', name: '', role: '', department: '', unitId: '',
            phone: '', email: '', officialPhone: '', officialEmail: '',
            monthlySalary: '', fixedAllowance: '', fixedDeduction: '', salaryType: 'Monthly',
            exitDate: '', exitReason: '', exitRemarks: '',
            settlementStatus: 'Pending', settlementLastSalary: '', settlementAllowance: '', settlementDeduction: '', settlementPayable: '',
            joiningDate: '', gender: '', address: '', bloodGroup: '',
            languageKnown: '', dateOfBirth: '', maritalStatus: '', aadhaarNo: '',
            aadhaarDate: '', aadhaarPerson: '', addressDate: '', addressPerson: '',
            pvrStation: '', pvrNo: '', pvrDate: '',
            status: 'Working',
            userId: ''
        }
    })

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null
        }

        setCameraOpen(false)
    }

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    useEffect(() => {
        if (!isDrawerOpen) {
            stopCamera()
            setCameraError('')
        }
    }, [isDrawerOpen])

    const resizeImageToDataUrl = (source: string): Promise<string> => new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => {
            const maxSize = 720
            const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
            const width = Math.max(1, Math.round(image.width * scale))
            const height = Math.max(1, Math.round(image.height * scale))
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const context = canvas.getContext('2d')

            if (!context) {
                reject(new Error('Canvas not available'))
                return
            }

            context.drawImage(image, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        image.onerror = () => reject(new Error('Image load failed'))
        image.src = source
    })

    const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('File read failed'))
        reader.readAsDataURL(file)
    })

    const setProfilePhoto = (photoUrl: string) => {
        setProfilePreview(photoUrl)
        setValue('photoUrl', photoUrl, { shouldDirty: true })
    }

    const handleProfileFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            window.alert('Please choose an image file only.')
            event.target.value = ''
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            window.alert('Profile photo must be 2MB or smaller.')
            event.target.value = ''
            return
        }

        try {
            const rawDataUrl = await readFileAsDataUrl(file)
            const optimizedDataUrl = await resizeImageToDataUrl(rawDataUrl)
            setProfilePhoto(optimizedDataUrl)
        } catch (error) {
            console.error('Failed to process profile photo', error)
            window.alert('Could not process the selected image.')
        } finally {
            event.target.value = ''
        }
    }

    const openCamera = async () => {
        try {
            setCameraError('')
            stopCamera()
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            streamRef.current = stream
            setCameraOpen(true)

            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
            })
        } catch (error) {
            console.error('Webcam unavailable', error)
            setCameraError('Could not access the webcam. Please allow camera permission and try again.')
        }
    }

    const capturePhoto = async () => {
        const video = videoRef.current
        if (!video || !video.videoWidth || !video.videoHeight) return

        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const context = canvas.getContext('2d')
        if (!context) return

        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
            const optimizedDataUrl = await resizeImageToDataUrl(canvas.toDataURL('image/jpeg', 0.9))
            setProfilePhoto(optimizedDataUrl)
            stopCamera()
        } catch (error) {
            console.error('Failed to capture webcam image', error)
            window.alert('Could not capture photo from webcam.')
        }
    }

    const clearProfilePhoto = () => {
        setProfilePreview('')
        setValue('photoUrl', '', { shouldDirty: true })
        stopCamera()
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleDocumentSelection = (
        event: React.ChangeEvent<HTMLInputElement>,
        field: 'aadhaarDocument' | 'resumeDocument',
        setName: (name: string) => void,
        allowedTypes: string[],
        maxSizeMb = 5
    ) => {
        const file = event.target.files?.[0]
        if (!file) {
            setValue(field, undefined, { shouldDirty: true })
            clearErrors(field)
            setName('')
            return
        }

        if (!allowedTypes.includes(file.type)) {
            window.alert('Invalid document type selected.')
            event.target.value = ''
            return
        }

        if (file.size > maxSizeMb * 1024 * 1024) {
            window.alert(`Document must be ${maxSizeMb}MB or smaller.`)
            event.target.value = ''
            return
        }

        setValue(field, file, { shouldDirty: true })
        clearErrors(field)
        setName(file.name)
    }

    const filteredData = staffData.filter(s => {
        const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.empId || '').toLowerCase().includes(searchQuery.toLowerCase())

        const isExStaff = isExStaffRecord(s);
        const matchesView = viewType === 'ExStaff' ? isExStaff : !isExStaff;

        return matchesSearch && matchesView;
    })

    const activeStaffCount = staffData.filter((staff) => !isExStaffRecord(staff)).length
    const exStaffCount = staffData.filter(isExStaffRecord).length
    const loginEnabledCount = staffData.filter((staff) => Boolean(staff.user?.isActive)).length
    const pendingDocumentCount = staffData.filter((staff) => !getStaffDocument(staff, 'aadhaarDocument', allDocs) || !getStaffDocument(staff, 'resumeDocument', allDocs)).length

    const handleAdd = () => {
        setEditingStaffId(null)
        reset({
            empId: '', photoUrl: '', name: '', role: '', department: '', unitId: activeUnitId,
            phone: '', email: '', officialPhone: '', officialEmail: '',
            monthlySalary: '', fixedAllowance: '', fixedDeduction: '', salaryType: 'Monthly',
            exitDate: '', exitReason: '', exitRemarks: '',
            settlementStatus: 'Pending', settlementLastSalary: '', settlementAllowance: '', settlementDeduction: '', settlementPayable: '',
            joiningDate: '', gender: '', address: '', bloodGroup: '',
            languageKnown: '', dateOfBirth: '', maritalStatus: '', aadhaarNo: '',
            aadhaarDate: '', aadhaarPerson: '', addressDate: '', addressPerson: '',
            pvrStation: '', pvrNo: '', pvrDate: '',
            aadhaarDocument: undefined,
            resumeDocument: undefined,
            status: 'Working',
            userId: ''
        })
        setProfilePreview('')
        setAadhaarDocumentName('')
        setResumeDocumentName('')
        setCameraError('')
        clearErrors()
        stopCamera()
        setIsDrawerOpen(true)
    }

    const handleEdit = (s: Staff) => {
        setEditingStaffId(s.id)
        // map existing data
        reset({
            empId: s.empId || '',
            photoUrl: s.photoUrl || '',
            name: s.name,
            role: s.role,
            department: s.department,
            unitId: s.unitId || '',
            phone: s.phone,
            email: s.email || '',
            officialPhone: (s as any).metadata?.officialPhone || '',
            officialEmail: (s as any).metadata?.officialEmail || '',
            monthlySalary: String((s as any).salary?.monthlySalary ?? (s as any).metadata?.payroll?.monthlySalary ?? (s as any).metadata?.monthlySalary ?? ''),
            fixedAllowance: String((s as any).salary?.fixedAllowance ?? (s as any).metadata?.payroll?.fixedAllowance ?? (s as any).metadata?.fixedAllowance ?? ''),
            fixedDeduction: String((s as any).salary?.fixedDeduction ?? (s as any).metadata?.payroll?.fixedDeduction ?? (s as any).metadata?.fixedDeduction ?? ''),
            salaryType: (s as any).metadata?.payroll?.salaryType || 'Monthly',
            exitDate: (s as any).metadata?.exit?.date || '',
            exitReason: (s as any).metadata?.exit?.reason || '',
            exitRemarks: (s as any).metadata?.exit?.remarks || '',
            settlementStatus: (s as any).metadata?.finalSettlement?.status || 'Pending',
            settlementLastSalary: String((s as any).metadata?.finalSettlement?.lastSalary || ''),
            settlementAllowance: String((s as any).metadata?.finalSettlement?.allowance || ''),
            settlementDeduction: String((s as any).metadata?.finalSettlement?.deduction || ''),
            settlementPayable: String((s as any).metadata?.finalSettlement?.payable || ''),
            joiningDate: s.joiningDate,
            gender: (s as any).metadata?.gender || '',
            address: (s as any).metadata?.address || '',
            bloodGroup: (s as any).metadata?.bloodGroup || '',
            languageKnown: (s as any).metadata?.languageKnown || '',
            dateOfBirth: (s as any).metadata?.dateOfBirth || '',
            maritalStatus: (s as any).metadata?.maritalStatus || '',
            aadhaarNo: (s as any).metadata?.aadhaarNo || '',
            aadhaarDate: (s as any).metadata?.aadhaarDate || '',
            aadhaarPerson: (s as any).metadata?.aadhaarPerson || '',
            addressDate: (s as any).metadata?.addressDate || '',
            addressPerson: (s as any).metadata?.addressPerson || '',
            pvrStation: (s as any).metadata?.pvrStation || '',
            pvrNo: (s as any).metadata?.pvrNo || '',
            pvrDate: (s as any).metadata?.pvrDate || '',
            aadhaarDocument: undefined,
            resumeDocument: undefined,
            status: (s.status === 'Resigned' || s.status === 'Terminated' ? s.status : 'Working') as any,
            userId: s.user?.id || ''
        })
        setProfilePreview(s.photoUrl || '')
        setAadhaarDocumentName((s as any).metadata?.documents?.aadhaarDocument?.fileName || '')
        setResumeDocumentName((s as any).metadata?.documents?.resumeDocument?.fileName || '')
        setCameraError('')
        clearErrors()
        stopCamera()
        setIsDrawerOpen(true)
    }

    const handleView = (s: Staff) => {
        setSelectedStaff(s)
        setIsViewOpen(true)
    }

    const getServerFieldName = (pathValue: unknown): keyof StaffFormValues | null => {
        const path = Array.isArray(pathValue) ? pathValue[pathValue.length - 1] : pathValue
        const normalizedPath = typeof path === 'string' ? path : ''

        if (!normalizedPath) return null

        const fieldMap: Record<string, keyof StaffFormValues> = {
            empId: 'empId',
            firstName: 'name',
            lastName: 'name',
            designation: 'role',
            department: 'department',
            unitId: 'unitId',
            phone: 'phone',
            email: 'email',
            joiningDate: 'joiningDate',
            gender: 'gender',
            address: 'address',
            bloodGroup: 'bloodGroup',
            languageKnown: 'languageKnown',
            dateOfBirth: 'dateOfBirth',
            maritalStatus: 'maritalStatus',
            aadhaarNo: 'aadhaarNo',
            aadhaarDocument: 'aadhaarDocument',
            resumeDocument: 'resumeDocument',
            userId: 'userId',
            exitDate: 'exitDate',
            exitReason: 'exitReason',
            exitRemarks: 'exitRemarks',
            settlementStatus: 'settlementStatus',
            settlementLastSalary: 'settlementLastSalary',
            settlementAllowance: 'settlementAllowance',
            settlementDeduction: 'settlementDeduction',
            settlementPayable: 'settlementPayable'
        }

        return fieldMap[normalizedPath] || null
    }

    const focusField = (fieldName: keyof StaffFormValues) => {
        const element = document.querySelector<HTMLElement>(`[name="${fieldName}"]`)
        if (!element) return

        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
    }

    const applyServerErrors = (error: any) => {
        clearErrors()

        const responseData = error?.response?.data
        const issues = Array.isArray(responseData?.errors) ? responseData.errors : []
        let firstField: keyof StaffFormValues | null = null

        for (const issue of issues) {
            const fieldName = getServerFieldName(issue?.path)
            const message = issue?.message || responseData?.message || 'Please check this field.'

            if (!fieldName) continue

            setError(fieldName, { type: 'server', message })
            if (!firstField) firstField = fieldName
        }

        if (!firstField) {
            const fallbackMessage = String(responseData?.message || error?.message || 'Failed to save staff details.')
            const lowerMessage = fallbackMessage.toLowerCase()

            if (lowerMessage.includes('aadhaar document')) {
                firstField = 'aadhaarDocument'
                setError('aadhaarDocument', { type: 'server', message: fallbackMessage })
            } else if (lowerMessage.includes('resume')) {
                firstField = 'resumeDocument'
                setError('resumeDocument', { type: 'server', message: fallbackMessage })
            } else if (lowerMessage.includes('aadhaar')) {
                firstField = 'aadhaarNo'
                setError('aadhaarNo', { type: 'server', message: fallbackMessage })
            } else {
                setError('root.server' as any, { type: 'server', message: fallbackMessage })
            }
        }

        if (firstField) {
            window.setTimeout(() => focusField(firstField), 0)
        }
    }

    const onSubmit = (formData: StaffFormValues) => {
        clearErrors()
        const existingMetadata = getStaffMetadata(staffData.find((staff) => staff.id === editingStaffId))
        const isLeavingStaff = formData.status === 'Resigned' || formData.status === 'Terminated'
        const exitMetadata = isLeavingStaff ? {
            ...(existingMetadata.exit && typeof existingMetadata.exit === 'object' ? existingMetadata.exit : {}),
            date: formData.exitDate || new Date().toISOString().split('T')[0],
            reason: formData.exitReason || '',
            remarks: formData.exitRemarks || '',
            recordedAt: new Date().toISOString()
        } : existingMetadata.exit
        const settlementMetadata = isLeavingStaff ? {
            ...(existingMetadata.finalSettlement && typeof existingMetadata.finalSettlement === 'object' ? existingMetadata.finalSettlement : {}),
            status: formData.settlementStatus || 'Pending',
            lastSalary: Number(formData.settlementLastSalary || 0),
            allowance: Number(formData.settlementAllowance || 0),
            deduction: Number(formData.settlementDeduction || 0),
            payable: Number(formData.settlementPayable || 0),
            recordedAt: new Date().toISOString()
        } : existingMetadata.finalSettlement

        const payload = {
            ...formData,
            photoUrl: formData.photoUrl || profilePreview || undefined,
            // Pack new optional fields into metadata for compatibility with the generic backend endpoint context
            metadata: {
                ...existingMetadata,
                officialPhone: formData.officialPhone,
                officialEmail: formData.officialEmail,
                payroll: {
                    ...(existingMetadata.payroll && typeof existingMetadata.payroll === 'object' ? existingMetadata.payroll : {}),

                    salaryType: formData.salaryType || 'Monthly'
                },
                ...(exitMetadata ? { exit: exitMetadata } : {}),
                ...(settlementMetadata ? { finalSettlement: settlementMetadata } : {}),
                gender: formData.gender,
                address: formData.address,
                bloodGroup: formData.bloodGroup,
                languageKnown: formData.languageKnown,
                dateOfBirth: formData.dateOfBirth,
                maritalStatus: formData.maritalStatus,
                aadhaarNo: formData.aadhaarNo,
                aadhaarDate: (formData as any).aadhaarDate,
                aadhaarPerson: (formData as any).aadhaarPerson,
                addressDate: (formData as any).addressDate,
                addressPerson: (formData as any).addressPerson,
                pvrStation: (formData as any).pvrStation,
                pvrNo: (formData as any).pvrNo,
                pvrDate: (formData as any).pvrDate
            }
        }

        if (editingStaffId) {
            updateStaff.mutate({ staffId: editingStaffId, data: payload }, {
                onSuccess: () => {
                    const aadhaarDoc = getValues('aadhaarDocument');
                    if (aadhaarDoc instanceof File) {
                        uploadStaffDocument.mutate({ staffId: editingStaffId, documentType: 'aadhaarDocument', file: aadhaarDoc });
                    }
                    const resumeDoc = getValues('resumeDocument');
                    if (resumeDoc instanceof File) {
                        uploadStaffDocument.mutate({ staffId: editingStaffId, documentType: 'resumeDocument', file: resumeDoc });
                    }
                    updateStaffSalary.mutate({
                        staffId: editingStaffId,
                        data: {
                            monthlySalary: Number(formData.monthlySalary || 0),
                            fixedAllowance: Number(formData.fixedAllowance || 0),
                            fixedDeduction: Number(formData.fixedDeduction || 0)
                        }
                    });
                    setIsDrawerOpen(false);
                },
                onError: applyServerErrors
            })
        } else {
            addStaff.mutate(payload, {
                onSuccess: (createdStaff) => {
                    if (createdStaff.id) {
                        const aadhaarDoc = getValues('aadhaarDocument');
                        if (aadhaarDoc instanceof File) {
                            uploadStaffDocument.mutate({ staffId: createdStaff.id, documentType: 'aadhaarDocument', file: aadhaarDoc });
                        }
                        const resumeDoc = getValues('resumeDocument');
                        if (resumeDoc instanceof File) {
                            uploadStaffDocument.mutate({ staffId: createdStaff.id, documentType: 'resumeDocument', file: resumeDoc });
                        }
                        updateStaffSalary.mutate({
                            staffId: createdStaff.id,
                            data: {
                                monthlySalary: Number(formData.monthlySalary || 0),
                                fixedAllowance: Number(formData.fixedAllowance || 0),
                                fixedDeduction: Number(formData.fixedDeduction || 0)
                            }
                        });
                    }
                    if (createdStaff.unitId) {
                        setActiveUnitId(createdStaff.unitId)
                    }
                    setIsDrawerOpen(false)
                },
                onError: applyServerErrors
            })
        }
    }

    const columns: Column<Staff>[] = [
        { key: 'sno', header: 'S.No', cell: () => null, sortable: false },
        {
            key: 'unit', header: 'Unit Name', cell: (s) => (
                <div className="flex flex-col">
                    {(() => {
                        const label = String(unitLabelById.get(s.unitId) || 'Unknown Unit')
                        const [unitName, locationName] = label.split('\n')

                        return (
                            <>
                                <span className="text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">{unitName}</span>
                                {locationName && (
                                    <span className="text-xs text-gray-500">{locationName}</span>
                                )}
                            </>
                        )
                    })()}
                </div>
            )
        },
        {
            key: 'photo', header: 'Staff Photo', cell: (s) => (
                s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} className="h-8 w-8 rounded-full object-cover border border-gray-200 shrink-0" />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">IMG</div>
                )
            )
        },
        {
            key: 'name', header: 'Staff Name & Ref. ID', cell: (s) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{s.name}</span>
                    <span className="text-xs text-gray-500 font-medium">ID: {s.empId || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'designation', header: 'Staff Designation', cell: (s) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{s.role}</span>
                    <span className="text-xs text-gray-500">{s.department}</span>
                </div>
            )
        },
        {
            key: 'erpAccess', header: 'ERP Access', cell: (s) => (
                <div className="flex flex-col items-start gap-1">
                    <StatusHighlighter value={s.user?.isActive ? 'Login Active' : s.user ? 'Login Disabled' : 'No Login'} />
                    {s.user?.role?.name ? <span className="text-[10px] font-semibold text-gray-500">{s.user.role.name}</span> : null}
                </div>
            )
        },
        { key: 'joiningDate', header: 'Date of Joining', cell: (s) => <span className="text-sm font-medium">{s.joiningDate || '-'}</span> },
        {
            key: 'contact', header: 'Staff Contact No.', cell: (s) => (
                <div className="flex flex-col text-xs text-gray-500">
                    <span>Personal : <span className="text-blue-500 font-medium">{s.phone}</span></span>
                </div>
            )
        },
        {
            key: 'status', header: 'Status', cell: (s) => {
                const isEx = Boolean(s.isDeleted) || viewType === 'ExStaff' || s.status === 'Resigned' || s.status === 'Terminated';
                const exitDate = getStaffMetadata(s).exit?.date || s.deletedAt?.split?.('T')?.[0] || '-'
                return isEx ? (
                    <div className="flex flex-col items-start gap-1">
                        <StatusHighlighter value={s.isDeleted ? 'Archived' : (s.status || 'Ex-Staff')} />
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Exit: {exitDate}</span>
                    </div>
                ) : (
                    <StatusHighlighter value="Working" />
                )
            }
        },
        {
            key: 'action', header: 'Action', cell: (s) => (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {!isExStaffRecord(s) && (
                        s.user ? (
                            <button onClick={() => setResetPasswordStaff(s)} className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white text-[11px] font-semibold rounded hover:bg-amber-600 transition shadow-sm"><Key className="w-3 h-3" /> Reset Password</button>
                        ) : isDemoStaff(s) ? (
                            <span className="text-[10px] text-orange-600 font-semibold px-2 py-1 bg-orange-50 rounded border border-orange-100">Demo/Seed Staff</span>
                        ) : (
                            <button onClick={() => setProvisionStaff(s)} className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-[11px] font-semibold rounded hover:bg-green-600 transition shadow-sm">Provision Access</button>
                        )
                    )}
                    <button onClick={() => handleView(s)} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white text-[11px] font-semibold rounded hover:bg-blue-600 transition shadow-sm"><Eye className="w-3 h-3" /> View</button>
                    <button onClick={() => handleEdit(s)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 text-white text-[11px] font-semibold rounded hover:bg-gray-800 transition shadow-sm border border-gray-600"><Edit2 className="w-3 h-3" /> Edit</button>
                    <button onClick={() => { if (window.confirm('Are you sure you want to delete this staff member?')) deleteStaff.mutate(s.id) }} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-[11px] font-semibold rounded hover:bg-red-600 transition shadow-sm"><Trash2 className="w-3 h-3" /> Delete</button>
                </div>
            )
        }
    ]

    columns[0].cell = (item) => filteredData.findIndex((a: any) => a.id === item.id) + 1

    return (
        <div className="flex h-full min-w-0 flex-1 min-h-0 flex-col space-y-4 overflow-y-auto bg-transparent dark:bg-black sm:space-y-6">
            <PageHeader title="Staff Management" breadcrumbs={[{ label: 'Home' }, { label: 'Staff Management' }]} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-black p-4 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm gap-4 2xl:p-5">
                <div className="text-gray-900 font-medium tracking-wide text-sm">{viewType === 'ExStaff' ? "List of Ex-Staff's" : "List of Staff's"}</div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <label className="flex w-full flex-col gap-1 text-xs font-bold text-gray-500 sm:w-72">
                        Viewing Unit
                        <select
                            value={activeUnitId}
                            onChange={(event) => setActiveUnitId(event.target.value || null)}
                            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-black dark:text-gray-100"
                            title={`Currently showing staff from ${activeUnitLabel}`}
                        >
                            {unitOptions.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                    {option.value ? option.label : '-- Select Viewing Unit --'}
                                </option>
                            ))}
                        </select>
                    </label>
                    {viewType === 'Active' ? (
                        <button onClick={() => setViewType('ExStaff')} className="px-4 py-2 bg-red-500 text-white text-[13.5px] font-medium rounded-xl hover:bg-red-600 transition shadow-sm border border-transparent">
                            Ex-Staff List
                        </button>
                    ) : (
                        <button onClick={() => setViewType('Active')} className="px-4 py-2 bg-green-500 text-white text-[13.5px] font-medium rounded-xl hover:bg-green-600 transition shadow-sm border border-transparent">
                            Active Staff List
                        </button>
                    )}
                    <button onClick={handleAdd} className="inline-flex items-center px-4 py-2.5 shadow-sm text-[13.5px] font-medium rounded-xl text-white bg-gradient-to-r from-[#0F969C] to-[#294D61] hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(15,150,156,0.22)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F969C] transition-all active:scale-95 border border-transparent">
                        Add New Staff
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Active Staff', value: activeStaffCount, note: 'Available for assignment and duty flow' },
                    { label: 'ERP Login Active', value: loginEnabledCount, note: 'Staff with current login access' },
                    { label: 'Document Pending', value: pendingDocumentCount, note: 'Missing Aadhaar or resume upload' },
                    { label: 'Ex-Staff', value: exStaffCount, note: 'Archived or resigned staff records' }
                ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-2xl font-extrabold text-gray-950">{item.value}</p>
                        <p className="mt-1 text-sm font-extrabold text-gray-900">{item.label}</p>
                        <p className="mt-1 text-xs font-medium text-gray-500">{item.note}</p>
                    </div>
                ))}
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search..."
            />

            <DataTable
                data={filteredData}
                columns={columns}
                keyExtractor={(s) => s.id}
                showScrollbars
                minTableWidth="1400px"
                spreadColumns
                fullHeight={false}
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingStaffId ? "Edit - Staff" : "Add - New Staff"} size="xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                    <div className="mx-auto w-full max-w-none space-y-5">
                        {(errors as any).root?.server?.message ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {(errors as any).root.server.message}
                            </div>
                        ) : null}

                        <FormSection title="Profile Photo" description="Images only. Max 2MB." contentClassName="flex flex-col items-center gap-4">
                            <input type="hidden" {...register('photoUrl')} />

                            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#6DA5C0]/45 bg-[#F7FAFC] dark:border-white/20 dark:bg-white/5">
                                {profilePreview ? (
                                    <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="px-3 text-center text-xs font-semibold text-[#6DA5C0]">No photo selected</span>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#6DA5C0]/30 bg-white px-4 text-sm font-semibold text-[#294D61] shadow-sm transition hover:border-[#0F969C]/50 hover:text-[#0F969C] dark:border-white/10 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={cameraOpen ? stopCamera : openCamera}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F969C] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#294D61]"
                                >
                                    <Camera className="w-4 h-4" />
                                    {cameraOpen ? 'Close Camera' : 'Capture Live Photo'}
                                </button>
                                {(profilePreview || cameraOpen) && (
                                    <button
                                        type="button"
                                        onClick={clearProfilePhoto}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear
                                    </button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleProfileFileChange}
                                className="hidden"
                            />

                            {cameraError ? <p className="text-xs text-red-500">{cameraError}</p> : null}

                            {cameraOpen && (
                                <div className="w-full max-w-md space-y-3 rounded-2xl border border-[#6DA5C0]/20 bg-[#F7FAFC] p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black">
                                        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            className="rounded-xl bg-[#0C7075] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#294D61]"
                                        >
                                            Take Snapshot
                                        </button>
                                    </div>
                                </div>
                            )}
                        </FormSection>

                        <FormSection title="Staff & Contact Details" description="Basic staff identity, unit, and communication details.">
                            <FormGrid columns={3}>
                            <Select label="Unit Name" {...register('unitId')} error={errors.unitId?.message} options={unitOptions} />
                            <div className="hidden 2xl:block"></div>

                            <Input label="Staff Name *" placeholder="Enter Full Name" {...register('name')} error={errors.name?.message} />
                            <Input label="Date of Joining *" type="date" {...register('joiningDate')} error={errors.joiningDate?.message} />

                            <Input label="Personal Mobile No." placeholder="Enter Personal Mobile No." {...register('phone')} error={errors.phone?.message} />
                            <Input label="Personal Email" placeholder="Enter Personal Email Address" type="email" {...register('email')} error={errors.email?.message} />

                            <Input label="Official Mobile No." placeholder="Enter Official Mobile No." {...register('officialPhone')} error={errors.officialPhone?.message} />
                            <Input label="Official Email" placeholder="Enter Official Email Address" type="email" {...register('officialEmail')} error={errors.officialEmail?.message} />
                            </FormGrid>
                        </FormSection>

                        <FormSection title="Payroll Setup" description="These values feed the live payroll preview. Leave blank if salary is not finalized.">
                            <FormGrid columns={3}>
                            <Select label="Salary Type" {...register('salaryType')} options={[{ value: 'Monthly', label: 'Monthly' }, { value: 'Daily', label: 'Daily' }, { value: 'Hourly', label: 'Hourly' }]} />
                            <Input label="Monthly Salary" type="number" min="0" step="1" placeholder="Enter gross salary" {...register('monthlySalary')} error={errors.monthlySalary?.message} />
                            <Input label="Fixed Allowance" type="number" min="0" step="1" placeholder="Enter fixed allowance" {...register('fixedAllowance')} error={errors.fixedAllowance?.message} />
                            <Input label="Fixed Deduction" type="number" min="0" step="1" placeholder="Enter fixed deduction" {...register('fixedDeduction')} error={errors.fixedDeduction?.message} />
                            </FormGrid>
                        </FormSection>

                        <FormSection title="Exit & Final Settlement" description="Use this only when staff resigns or is terminated. Former staff will stay in HR history and stay blocked from assignment, attendance, and payroll queues.">
                            <FormGrid columns={3}>
                            <Select label="Staff Status" {...register('status')} options={[
                                { value: 'Working', label: 'Working' },
                                { value: 'On Leave', label: 'On Leave' },
                                { value: 'Resigned', label: 'Resigned' },
                                { value: 'Terminated', label: 'Terminated' }
                            ]} />
                            <Input label="Exit Date" type="date" {...register('exitDate')} error={errors.exitDate?.message} />
                            <Input label="Exit Reason" placeholder="Resignation, termination, personal reason..." {...register('exitReason')} error={errors.exitReason?.message} />
                            <Input label="Exit Remarks" placeholder="Final HR remarks" {...register('exitRemarks')} error={errors.exitRemarks?.message} />
                            <Select label="Settlement Status" {...register('settlementStatus')} options={[
                                { value: 'Pending', label: 'Pending' },
                                { value: 'In Progress', label: 'In Progress' },
                                { value: 'Paid', label: 'Paid' },
                                { value: 'Hold', label: 'Hold' }
                            ]} />
                            <Input label="Last Salary" type="number" min="0" step="1" placeholder="Final salary component" {...register('settlementLastSalary')} error={errors.settlementLastSalary?.message} />
                            <Input label="Settlement Allowance" type="number" min="0" step="1" placeholder="Pending allowance" {...register('settlementAllowance')} error={errors.settlementAllowance?.message} />
                            <Input label="Settlement Deduction" type="number" min="0" step="1" placeholder="Recoveries/deductions" {...register('settlementDeduction')} error={errors.settlementDeduction?.message} />
                            <Input label="Final Payable" type="number" min="0" step="1" placeholder="Net payable amount" {...register('settlementPayable')} error={errors.settlementPayable?.message} />
                            </FormGrid>
                        </FormSection>

                        <FormSection title="ERP Login Access" description="Link an existing user account to this staff member.">
                            <div className="space-y-4">
                                <Controller
                                    name="userId"
                                    control={control}
                                    render={({ field }) => (
                                        <UserSelector
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={errors.userId?.message}
                                        />
                                    )}
                                />
                                {editingStaffId && staffData.find(s => s.id === editingStaffId)?.user && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Note: This staff member is already linked to the User Account: <span className="font-semibold">{staffData.find(s => s.id === editingStaffId)?.user?.email}</span>. To change access, select a different user.
                                    </p>
                                )}
                            </div>
                        </FormSection>

                        <FormSection title="Employment & Personal Details" description="Role, department, identity, and contact background.">
                            <FormGrid columns={3}>
                            <Select label="Department *" {...register('department')} error={errors.department?.message} options={departmentOptions} />
                            <Select label="Designation *" {...register('role')} error={errors.role?.message} options={designationOptions} />

                            <Select label="Gender *" {...register('gender')} error={errors.gender?.message} options={[{ value: '', label: '-- Select the Gender --' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
                            <Input label="Address" placeholder="Enter Full Address" {...register('address')} error={errors.address?.message} />

                            <Select label="Blood Group" {...register('bloodGroup')} options={bloodGroupOptions} />
                            <Input label="Language Known" placeholder="Select the Documents Submitted" {...register('languageKnown')} error={errors.languageKnown?.message} />

                            <Input label="Date of Birth" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
                            <Select label="Marital Status" {...register('maritalStatus')} error={errors.maritalStatus?.message} options={[{ value: '', label: '-- Select the Marital Status --' }, { value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' }]} />

                            <Input label="Aadhaar No" placeholder="Enter the Aadhaar No." {...register('aadhaarNo')} error={errors.aadhaarNo?.message} />
                            </FormGrid>
                        </FormSection>

                        <FormSection title="Document Uploads" description="Upload the mandatory HR documents linked to this staff profile.">
                            <FormGrid columns={2}>
                            <div className="flex flex-col gap-1">
                                <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-gray-300">Aadhaar Document <span className="text-xs font-medium text-gray-500">(PDF/JPG/PNG. Max 5MB)</span></label>
                                <input
                                    name="aadhaarDocument"
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => handleDocumentSelection(e, 'aadhaarDocument', setAadhaarDocumentName, ['application/pdf', 'image/png', 'image/jpeg'])}
                                    className={`block h-10 w-full rounded-xl border bg-[#F7FAFC] text-sm font-medium text-gray-500 shadow-sm file:mr-4 file:h-full file:border-0 file:bg-[#D8EEF5] file:px-4 file:text-sm file:font-semibold file:text-[#294D61] hover:bg-white dark:bg-black dark:text-gray-300 dark:file:bg-white/10 dark:file:text-gray-300 ${errors.aadhaarDocument?.message ? 'border-red-400' : 'border-[#6DA5C0]/25 dark:border-white/10'}`}
                                />
                                {aadhaarDocumentName ? <span className="text-xs font-medium text-gray-500">Selected: {aadhaarDocumentName}</span> : null}
                                {errors.aadhaarDocument?.message ? <p className="text-xs font-semibold text-red-500">{String(errors.aadhaarDocument.message)}</p> : null}
                                {editingStaffId && (() => {
                                    const doc = getStaffDocument(staffData.find(s => s.id === editingStaffId) as any, 'aadhaarDocument', allDocs)
                                    if (doc && doc.status === 'PENDING_VERIFICATION') {
                                        return (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded">Pending Verification</span>
                                                <button type="button" onClick={() => verifyDoc.mutate({ staffId: editingStaffId, documentId: allDocs.find(d => d.empId === (staffData.find(s => s.id === editingStaffId) as any).empId && d.documentType === 'aadhaarDocument')?.id, status: 'VERIFIED' })} disabled={verifyDoc.isPending} className="px-3 py-1 bg-green-500 text-white rounded text-xs font-bold shadow-sm hover:bg-green-600 disabled:opacity-50 transition">
                                                    {verifyDoc.isPending ? 'Verifying...' : 'Verify Document'}
                                                </button>
                                            </div>
                                        )
                                    } else if (doc && doc.status === 'VERIFIED') {
                                        return <div className="mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-flex self-start">Verified ✓</div>
                                    }
                                    return null
                                })()}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-gray-300">Resume <span className="text-xs font-medium text-gray-500">(PDF/DOCX. Max 5MB)</span></label>
                                <input
                                    name="resumeDocument"
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={(e) => handleDocumentSelection(e, 'resumeDocument', setResumeDocumentName, ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])}
                                    className={`block h-10 w-full rounded-xl border bg-[#F7FAFC] text-sm font-medium text-gray-500 shadow-sm file:mr-4 file:h-full file:border-0 file:bg-[#D8EEF5] file:px-4 file:text-sm file:font-semibold file:text-[#294D61] hover:bg-white dark:bg-black dark:text-gray-300 dark:file:bg-white/10 dark:file:text-gray-300 ${errors.resumeDocument?.message ? 'border-red-400' : 'border-[#6DA5C0]/25 dark:border-white/10'}`}
                                />
                                {resumeDocumentName ? <span className="text-xs font-medium text-gray-500">Selected: {resumeDocumentName}</span> : null}
                                {errors.resumeDocument?.message ? <p className="text-xs font-semibold text-red-500">{String(errors.resumeDocument.message)}</p> : null}
                                {editingStaffId && (() => {
                                    const doc = getStaffDocument(staffData.find(s => s.id === editingStaffId) as any, 'resumeDocument', allDocs)
                                    if (doc && doc.status === 'PENDING_VERIFICATION') {
                                        return (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded">Pending Verification</span>
                                                <button type="button" onClick={() => verifyDoc.mutate({ staffId: editingStaffId, documentId: allDocs.find(d => d.empId === (staffData.find(s => s.id === editingStaffId) as any).empId && d.documentType === 'resumeDocument')?.id, status: 'VERIFIED' })} disabled={verifyDoc.isPending} className="px-3 py-1 bg-green-500 text-white rounded text-xs font-bold shadow-sm hover:bg-green-600 disabled:opacity-50 transition">
                                                    {verifyDoc.isPending ? 'Verifying...' : 'Verify Document'}
                                                </button>
                                            </div>
                                        )
                                    } else if (doc && doc.status === 'VERIFIED') {
                                        return <div className="mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-flex self-start">Verified ✓</div>
                                    }
                                    return null
                                })()}
                            </div>

                            <div className="rounded-2xl border border-[#6DA5C0]/20 bg-[#F7FAFC] p-4 text-sm text-gray-600 md:col-span-2">
                                <p className="font-extrabold text-[#05161A]">Original Documents Submitted</p>
                                <p className="mt-1 text-xs font-medium">
                                    Current live storage supports Aadhaar and resume uploads here. Other original document categories are maintained from Admin Files.
                                </p>
                            </div>
                            </FormGrid>
                        </FormSection>

                        <FormSection title="Verification & Preferences" description="Background verification details and preferences.">
                            <FormGrid columns={3}>
                                <div className="col-span-3 pb-2 mb-2 border-b border-[#6DA5C0]/20 font-bold text-[#0F969C]">Aadhaar Verification</div>
                                <Input label="Aadhaar No." placeholder="Enter the Aadhaar No." {...register('aadhaarNo')} error={errors.aadhaarNo?.message} />
                                <Input label="Verified Date" type="date" {...register('aadhaarDate')} />
                                <Input label="Verified Person Name" placeholder="Verified By" {...register('aadhaarPerson')} />

                                <div className="col-span-3 pb-2 mb-2 border-b border-[#6DA5C0]/20 font-bold text-[#0F969C] mt-4">Address Verification</div>
                                <div className="col-span-1">
                                    <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-gray-300">Address *</label>
                                    <textarea {...register('address')} rows={2} className="block w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] px-3 py-2 text-sm font-medium text-[#05161A] shadow-sm outline-none transition focus:border-[#0F969C] focus:bg-white focus:ring-1 focus:ring-[#0F969C] dark:border-white/10 dark:bg-black dark:text-gray-100" placeholder="Enter Full Address"></textarea>
                                </div>
                                <Input label="Verified Date" type="date" {...register('addressDate')} />
                                <Input label="Verified Person Name" placeholder="Verified By" {...register('addressPerson')} />

                                <div className="col-span-3 pb-2 mb-2 border-b border-[#6DA5C0]/20 font-bold text-[#0F969C] mt-4">Police Verification</div>
                                <Input label="Nearby Police Station" placeholder="Police Station Name" {...register('pvrStation')} />
                                <Input label="PVR No" placeholder="Police Verify Record No." {...register('pvrNo')} />
                                <Input label="Date of Issue" type="date" {...register('pvrDate')} />
                            </FormGrid>
                        </FormSection>

                        <FormActions>
                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                className="h-10 rounded-xl border border-[#6DA5C0]/30 bg-white px-4 text-sm font-semibold text-[#294D61] shadow-sm transition hover:border-[#0F969C]/50 hover:text-[#0F969C] dark:border-white/10 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={addStaff.isPending || updateStaff.isPending}
                                className="h-10 rounded-xl bg-[#0F969C] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#294D61] disabled:opacity-50"
                            >
                                {addStaff.isPending || updateStaff.isPending ? 'Saving...' : 'Save'}
                            </button>
                        </FormActions>
                    </div>
                </form>
            </Drawer>

            <Drawer isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="View - Staff Details" size="lg">

                {selectedStaff && (
                    <div className="space-y-5">
                        <FormSection className="bg-[#F7FAFC] dark:bg-white/5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                {selectedStaff.photoUrl ? (
                                    <img src={selectedStaff.photoUrl} alt={selectedStaff.name} className="h-24 w-24 rounded-2xl border border-white object-cover shadow-sm" />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[#6DA5C0]/25 bg-white text-sm font-extrabold text-[#0F969C]">IMG</div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-2xl font-extrabold text-[#05161A] dark:text-gray-100">{selectedStaff.name}</p>
                                    <p className="mt-1 text-sm font-bold text-[#294D61] dark:text-gray-300">{selectedStaff.role} - {selectedStaff.department}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <StatusHighlighter value={isExStaffRecord(selectedStaff) ? selectedStaff.status || 'Ex-Staff' : 'Working'} />
                                        <StatusHighlighter value={selectedStaff.user?.isActive ? 'Login Active' : selectedStaff.user ? 'Login Disabled' : 'No Login'} />
                                        <StatusHighlighter value={getStaffDocument(selectedStaff, 'aadhaarDocument', allDocs) && getStaffDocument(selectedStaff, 'resumeDocument', allDocs) ? 'Documents Uploaded' : 'Documents Pending'} />
                                    </div>
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Staff Details">
                            <FormGrid columns={2}>
                                {[
                                { label: 'Employee ID', value: selectedStaff.empId || 'N/A' },
                                { label: 'Unit', value: (unitLabelById.get(selectedStaff.unitId) as string || '').replace('\n', ' - ') || 'Unknown Unit' },
                                { label: 'Joining Date', value: selectedStaff.joiningDate || '-' },
                                { label: 'ERP Role', value: selectedStaff.user?.role?.name || '-' },
                                { label: 'Login Email', value: selectedStaff.user?.email || '-' },
                                { label: 'Personal Email', value: selectedStaff.email || '-' },
                                { label: 'Personal Mobile', value: selectedStaff.phone || '-' },
                                { label: 'Official Mobile', value: getStaffMetadata(selectedStaff).officialPhone || '-' },
                                { label: 'Official Email', value: getStaffMetadata(selectedStaff).officialEmail || '-' },
                                { label: 'Salary Type', value: getStaffMetadata(selectedStaff).payroll?.salaryType || '-' },
                                { label: 'Monthly Salary', value: (selectedStaff as any)?.salary?.monthlySalary || getStaffMetadata(selectedStaff).payroll?.monthlySalary ? `Rs ${Number((selectedStaff as any)?.salary?.monthlySalary ?? getStaffMetadata(selectedStaff).payroll?.monthlySalary).toLocaleString('en-IN')}` : '-' },
                                { label: 'Fixed Allowance', value: (selectedStaff as any)?.salary?.fixedAllowance || getStaffMetadata(selectedStaff).payroll?.fixedAllowance ? `Rs ${Number((selectedStaff as any)?.salary?.fixedAllowance ?? getStaffMetadata(selectedStaff).payroll?.fixedAllowance).toLocaleString('en-IN')}` : '-' },
                                { label: 'Fixed Deduction', value: (selectedStaff as any)?.salary?.fixedDeduction || getStaffMetadata(selectedStaff).payroll?.fixedDeduction ? `Rs ${Number((selectedStaff as any)?.salary?.fixedDeduction ?? getStaffMetadata(selectedStaff).payroll?.fixedDeduction).toLocaleString('en-IN')}` : '-' },
                                { label: 'Exit Date', value: getStaffMetadata(selectedStaff).exit?.date || '-' },
                                { label: 'Exit Reason', value: getStaffMetadata(selectedStaff).exit?.reason || '-' },
                                { label: 'Settlement Status', value: getStaffMetadata(selectedStaff).finalSettlement?.status || '-' },
                                { label: 'Last Salary', value: money(getStaffMetadata(selectedStaff).finalSettlement?.lastSalary) },
                                { label: 'Settlement Allowance', value: money(getStaffMetadata(selectedStaff).finalSettlement?.allowance) },
                                { label: 'Settlement Deduction', value: money(getStaffMetadata(selectedStaff).finalSettlement?.deduction) },
                                { label: 'Final Payable', value: money(getStaffMetadata(selectedStaff).finalSettlement?.payable) },
                                { label: 'Gender', value: getStaffMetadata(selectedStaff).gender || '-' },
                                { label: 'Blood Group', value: getStaffMetadata(selectedStaff).bloodGroup || '-' },
                                { label: 'Language Known', value: getStaffMetadata(selectedStaff).languageKnown || '-' },
                                { label: 'Date of Birth', value: getStaffMetadata(selectedStaff).dateOfBirth || '-' },
                                { label: 'Marital Status', value: getStaffMetadata(selectedStaff).maritalStatus || '-' },
                                { label: 'Aadhaar No.', value: getStaffMetadata(selectedStaff).aadhaarNo || '-' },
                                { label: 'Aadhaar Verification', value: getStaffMetadata(selectedStaff).aadhaarVerification?.status || 'Not verified' }
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-[#6DA5C0]/15 bg-[#F7FAFC] p-3 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-xs font-extrabold uppercase tracking-wide text-[#6DA5C0]">{item.label}</p>
                                    <p className="mt-1 break-words text-sm font-bold text-[#05161A] dark:text-gray-100">{item.value}</p>
                                </div>
                            ))}
                            </FormGrid>
                        </FormSection>

                        <FormSection title="Address">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{getStaffMetadata(selectedStaff).address || '-'}</p>
                        </FormSection>

                        {isExStaffRecord(selectedStaff) && (
                            <FormSection title="Exit Remarks" className="border-[#0C7075]/20 bg-[#0C7075]/5">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{getStaffMetadata(selectedStaff).exit?.remarks || '-'}</p>
                            </FormSection>
                        )}

                        <FormSection title="Documents">
                            <FormGrid columns={2}>
                                {[
                                { label: 'Aadhaar Document', document: getStaffDocument(selectedStaff, 'aadhaarDocument', allDocs) },
                                { label: 'Resume', document: getStaffDocument(selectedStaff, 'resumeDocument', allDocs) }
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-[#6DA5C0]/15 bg-[#F7FAFC] p-4 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-sm font-extrabold text-[#05161A] dark:text-gray-100">{item.label}</p>
                                    {item.document?.fileUrl ? (
                                        <a href={item.document.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-full bg-[#D8EEF5] px-3 py-1.5 text-xs font-extrabold text-[#294D61] hover:bg-[#6DA5C0]/30">
                                            View Uploaded File
                                        </a>
                                    ) : (
                                        <p className="mt-2 text-xs font-semibold text-gray-400">Not uploaded yet</p>
                                    )}
                                </div>
                            ))}
                            </FormGrid>
                        </FormSection>
                    </div>
                )}
            </Drawer>
            <ProvisionAccountModal
                isOpen={!!provisionStaff}
                onClose={() => setProvisionStaff(null)}
                staff={provisionStaff!}
                unitName={provisionStaff ? String(unitLabelById.get(provisionStaff.unitId) || '').split('\n')[0] : ''}
            />
            {resetPasswordStaff && (
                <ResetStaffPasswordModal
                    isOpen={!!resetPasswordStaff}
                    onClose={() => setResetPasswordStaff(null)}
                    staff={resetPasswordStaff}
                    unitName={String(unitLabelById.get(resetPasswordStaff.unitId) || '').split('\n')[0]}
                />
            )}
        </div >
    )
}
