'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Briefcase, Mail, Phone, ExternalLink, Plus, Sparkles, UserCheck, Eye, Trash2, Edit2, X, UserX, ShieldAlert, FileText, AlertCircle, Upload, CheckCircle2
} from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { qualificationSchema, skillSchema, experienceSchema, contractSchema, referenceSchema, disciplinarySchema, resignationSchema } from '@/lib/validations';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [employee, setEmployee] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<'profile' | 'activities'>('profile');
  const [activeTab, setActiveTab] = useState<string>('General Info');
  const [loading, setLoading] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Dynamic Emails and Mobiles for Edit Form
  const [emailsList, setEmailsList] = useState<string[]>(['']);
  const [mobilesList, setMobilesList] = useState<string[]>(['']);

  // Form Inputs states
  const [uploading, setUploading] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  
  // Qualification list inputs & edit modal
  const [newQual, setNewQual] = useState({ level: '', institute: '', year: '', url: '' });
  const [qualUploading, setQualUploading] = useState(false);
  const [editingQualIdx, setEditingQualIdx] = useState<number | null>(null);
  const [editQualData, setEditQualData] = useState({ level: '', institute: '', year: '', url: '' });
  const [editQualModalOpen, setEditQualModalOpen] = useState(false);
  const [editQualUploading, setEditQualUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Skills list inputs
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: '' });

  // Experience list inputs
  const [newExp, setNewExp] = useState({ company: '', role: '', duration: '', url: '' });
  const [expUploading, setExpUploading] = useState(false);

  // Contract list inputs
  const [newContract, setNewContract] = useState({ title: '', startDate: '', endDate: '', url: '' });
  const [contractUploading, setContractUploading] = useState(false);

  // Resignation list inputs & edit modal
  const [newResignation, setNewResignation] = useState({ date: new Date().toISOString().split('T')[0], reason: '', status: 'Completed', url: '' });
  const [resignationUploading, setResignationUploading] = useState(false);
  const [editingResignationIdx, setEditingResignationIdx] = useState<number | null>(null);
  const [editResignationData, setEditResignationData] = useState({ date: '', reason: '', status: 'Completed', url: '' });
  const [editResignationModalOpen, setEditResignationModalOpen] = useState(false);

  // Reference list inputs
  const [newRef, setNewRef] = useState({ name: '', designation: '', contact: '', email: '', company: '' });

  // Disciplinary Case list inputs
  const [newDisc, setNewDisc] = useState({ date: '', issue: '', actionTaken: '', severity: 'Low', url: '' });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'qual' | 'skill' | 'exp' | 'ref' | 'disc' | 'contract' | 'resignation' | null;
    index: number | null;
    itemName?: string;
  }>({
    isOpen: false,
    type: null,
    index: null,
    itemName: '',
  });

  // Dynamic Date Difference Calculator
  const calculateDateDifference = (dateString: string) => {
    if (!dateString) return 'N/A';
    const start = new Date(dateString);
    const end = new Date();
    if (isNaN(start.getTime())) return 'N/A';

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += previousMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : '0 days';
  };

  const populateEmailsAndMobiles = (data: any) => {
    const ems = data?.contactInfo?.emails?.length 
      ? data.contactInfo.emails 
      : (data?.contactInfo?.email ? [data.contactInfo.email] : ['']);
    const mbs = data?.contactInfo?.mobiles?.length 
      ? data.contactInfo.mobiles 
      : (data?.contactInfo?.mobile ? [data.contactInfo.mobile] : ['']);
    setEmailsList(ems);
    setMobilesList(mbs);
  };

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`/api/employees/${id}`);
      if (!res.ok) throw new Error('Failed to retrieve record');
      const data = await res.json();
      setEmployee(data);
      setEditForm(JSON.parse(JSON.stringify(data)));
      populateEmailsAndMobiles(data);
    } catch (e: any) {
      console.error(e);
      toast.error('Could not load personnel profile');
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUser(d.user); })
        .catch(() => {});
    }
    if (id && id !== 'create') {
      fetchEmployee();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [searchParams]);

  // Helpers for editing email list
  const handleEmailChange = (index: number, val: string) => {
    const updated = [...emailsList];
    updated[index] = val;
    setEmailsList(updated);
  };
  const addEmailField = () => setEmailsList(prev => [...prev, '']);
  const removeEmailField = (index: number) => {
    if (emailsList.length <= 1) return;
    setEmailsList(prev => prev.filter((_, i) => i !== index));
  };

  // Helpers for editing mobile list
  const handleMobileChange = (index: number, val: string) => {
    const updated = [...mobilesList];
    updated[index] = val;
    setMobilesList(updated);
  };
  const addMobileField = () => setMobilesList(prev => [...prev, '']);
  const removeMobileField = (index: number) => {
    if (mobilesList.length <= 1) return;
    setMobilesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async () => {
    if (!editForm) return;

    const validEmails = emailsList.map(e => e.trim()).filter(Boolean);
    const validMobiles = mobilesList.map(m => m.trim()).filter(Boolean);

    const payload = {
      ...editForm,
      contactInfo: {
        ...(editForm.contactInfo || {}),
        email: validEmails[0] || '',
        mobile: validMobiles[0] || '',
        emails: validEmails,
        mobiles: validMobiles,
      }
    };

    await updateEmployeeAPI(payload, 'Personnel profile modifications saved successfully');
    setIsEditing(false);
  };

  const hasPermission = (permission: string) => {
    if (!currentUser) return false;
    if (currentUser.role && typeof currentUser.role === 'object') {
      const roleName = currentUser.role.name || '';
      if (roleName.toLowerCase() === 'admin') return true;
      const perms = currentUser.role.permissions || [];
      return Array.isArray(perms) && perms.includes(permission);
    }
    return false;
  };

  const updateEmployeeAPI = async (updatedData: any, successMessage = 'Record updated successfully') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Failed to update record');
      setIsEditing(false);
      toast.success(successMessage);
      fetchEmployee();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error saving modifications.');
    }
  };

  const handleNestedFieldChange = (section: string, field: string, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value }
    }));
  };

  const handleRootFieldChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleGeneralFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'doc' | 'qual' | 'edit_qual' | 'exp' | 'disc' | 'contract' | 'resignation' | 'edit_resignation' | 'profile_avatar'
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    if (target === 'qual') setQualUploading(true);
    else if (target === 'edit_qual') setEditQualUploading(true);
    else if (target === 'profile_avatar') setAvatarUploading(true);
    else if (target === 'exp') setExpUploading(true);
    else if (target === 'contract') setContractUploading(true);
    else if (target === 'resignation' || target === 'edit_resignation') setResignationUploading(true);
    else setUploading(true);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        if (target === 'qual') {
          setNewQual(prev => ({ ...prev, url: data.url }));
          toast.success('Qualification document attached');
        } else if (target === 'edit_qual') {
          setEditQualData(prev => ({ ...prev, url: data.url }));
          toast.success('Qualification document attached');
        } else if (target === 'profile_avatar') {
          const docObj = {
            name: 'Profile Picture',
            url: data.url,
            publicId: data.publicId,
            fileType: file.type
          };
          const existingDocs = editForm?.documents || employee?.documents || [];
          const otherDocs = existingDocs.filter((d: any) => d.name !== 'Profile Picture');
          const updatedDocs = [...otherDocs, docObj];
          setEditForm((prev: any) => ({ ...prev, documents: updatedDocs }));
          toast.success('Profile photo uploaded!');
        } else if (target === 'exp') {
          setNewExp(prev => ({ ...prev, url: data.url }));
          toast.success('Experience document attached');
        } else if (target === 'disc') {
          setNewDisc(prev => ({ ...prev, url: data.url }));
          toast.success('Disciplinary document attached');
        } else if (target === 'contract') {
          setNewContract(prev => ({ ...prev, url: data.url }));
          toast.success('Contract document attached');
        } else if (target === 'resignation') {
          setNewResignation(prev => ({ ...prev, url: data.url }));
          toast.success('Resignation document attached');
        } else if (target === 'edit_resignation') {
          setEditResignationData(prev => ({ ...prev, url: data.url }));
          toast.success('Resignation document attached');
        } else {
          const docObj = {
            name: newDocName || file.name,
            url: data.url,
            publicId: data.publicId,
            fileType: file.type
          };
          const updatedDocs = [...(employee?.documents || []), docObj];
          await updateEmployeeAPI({ ...employee, documents: updatedDocs }, 'Document uploaded successfully');
          setNewDocName('');
        }
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('File upload failed');
    } finally {
      setQualUploading(false);
      setEditQualUploading(false);
      setAvatarUploading(false);
      setExpUploading(false);
      setContractUploading(false);
      setResignationUploading(false);
      setUploading(false);
    }
  };

  // --- Direct Status Handlers (No Popups) ---
  const handleInactivateStatus = async () => {
    const updatedEmployee = {
      ...employee,
      officeInfo: {
        ...(employee.officeInfo || {}),
        status: 'Inactive',
      }
    };
    await updateEmployeeAPI(updatedEmployee, 'Personnel marked as Inactive');
  };

  const handleActivateStatus = async () => {
    const updatedEmployee = {
      ...employee,
      officeInfo: {
        ...(employee.officeInfo || {}),
        status: 'Active',
      }
    };
    await updateEmployeeAPI(updatedEmployee, 'Personnel marked as Active');
  };

  // --- Resignation Handling ---
  const handleAddResignation = async () => {
    if ((employee?.officeActivities?.resignations?.length || 0) >= 1) {
      toast.error('Only one resignation record can be added.');
      return;
    }
    const val = resignationSchema.safeParse(newResignation);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const resignations = [...(employee?.officeActivities?.resignations || []), newResignation];
    await updateEmployeeAPI({
      ...employee,
      officeInfo: {
        ...(employee.officeInfo || {}),
        status: 'Inactive',
      },
      officeActivities: { ...(employee?.officeActivities || {}), resignations }
    }, 'Resignation record added and personnel marked as Inactive');
    setNewResignation({ date: new Date().toISOString().split('T')[0], reason: '', status: 'Completed', url: '' });
  };

  const handleOpenEditResignation = (idx: number, r: any) => {
    setEditingResignationIdx(idx);
    setEditResignationData({
      date: r.date || new Date().toISOString().split('T')[0],
      reason: r.reason || '',
      status: r.status || 'Completed',
      url: r.url || '',
    });
    setEditResignationModalOpen(true);
  };

  const handleSaveEditResignation = async () => {
    if (editingResignationIdx === null) return;
    const val = resignationSchema.safeParse(editResignationData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const resignations = [...(employee?.officeActivities?.resignations || [])];
    resignations[editingResignationIdx] = editResignationData;

    await updateEmployeeAPI({
      ...employee,
      officeActivities: { ...(employee?.officeActivities || {}), resignations }
    }, 'Resignation record updated');

    setEditResignationModalOpen(false);
    setEditingResignationIdx(null);
  };

  // --- Qualifications Handling ---
  const handleOpenEditQual = (idx: number, q: any) => {
    setEditingQualIdx(idx);
    setEditQualData({
      level: q.level || '',
      institute: q.institute || '',
      year: q.year || '',
      url: q.url || '',
    });
    setEditQualModalOpen(true);
  };

  const handleSaveEditQual = async () => {
    if (editingQualIdx === null) return;
    const val = qualificationSchema.safeParse(editQualData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const qualifications = [...(employee?.qualifications || [])];
    qualifications[editingQualIdx] = editQualData;

    await updateEmployeeAPI({
      ...employee,
      qualifications
    }, 'Qualification record updated');

    setEditQualModalOpen(false);
    setEditingQualIdx(null);
  };
  const handleAddQual = async () => {
    const val = qualificationSchema.safeParse(newQual);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const qualifications = [...(employee?.qualifications || []), newQual];
    await updateEmployeeAPI({ ...employee, qualifications }, 'Qualification added');
    setNewQual({ level: '', institute: '', year: '', url: '' });
  };

  // --- Skills Handling ---
  const handleAddSkill = async () => {
    const val = skillSchema.safeParse(newSkill);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const skills = [...(employee?.skills || []), newSkill];
    await updateEmployeeAPI({ ...employee, skills }, 'Skill added');
    setNewSkill({ name: '', proficiency: '' });
  };

  // --- Experience Handling ---
  const handleAddExp = async () => {
    const val = experienceSchema.safeParse(newExp);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const experience = [...(employee?.experience || []), newExp];
    await updateEmployeeAPI({ ...employee, experience }, 'Experience added');
    setNewExp({ company: '', role: '', duration: '', url: '' });
  };

  // --- Reference Handling ---
  const handleAddRef = async () => {
    const val = referenceSchema.safeParse(newRef);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const references = [...(employee?.references || []), newRef];
    await updateEmployeeAPI({ ...employee, references }, 'Reference added');
    setNewRef({ name: '', designation: '', contact: '', email: '', company: '' });
  };

  // --- Contract Handling ---
  const handleAddContract = async () => {
    const val = contractSchema.safeParse(newContract);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const contracts = [...(employee?.officeActivities?.contracts || []), newContract];
    await updateEmployeeAPI({
      ...employee,
      officeActivities: { ...(employee?.officeActivities || {}), contracts }
    }, 'Contract recorded');
    setNewContract({ title: '', startDate: '', endDate: '', url: '' });
  };

  // --- Disciplinary Handling ---
  const handleAddDisc = async () => {
    const val = disciplinarySchema.safeParse(newDisc);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const disciplinaryCases = [...(employee?.officeActivities?.disciplinaryCases || []), newDisc];
    await updateEmployeeAPI({
      ...employee,
      officeActivities: { ...(employee?.officeActivities || {}), disciplinaryCases }
    }, 'Disciplinary case recorded');
    setNewDisc({ date: '', issue: '', actionTaken: '', severity: 'Low', url: '' });
  };

  // Confirm delete item handler
  const handleConfirmItemDelete = async () => {
    const idx = deleteModal.index;
    if (idx === null) return;

    if (deleteModal.type === 'qual') {
      const qualifications = employee.qualifications.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, qualifications }, 'Qualification removed');
    } else if (deleteModal.type === 'skill') {
      const skills = employee.skills.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, skills }, 'Skill removed');
    } else if (deleteModal.type === 'exp') {
      const experience = employee.experience.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, experience }, 'Experience entry removed');
    } else if (deleteModal.type === 'ref') {
      const references = employee.references.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, references }, 'Reference removed');
    } else if (deleteModal.type === 'contract') {
      const contracts = employee.officeActivities.contracts.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({
        ...employee,
        officeActivities: { ...(employee.officeActivities || {}), contracts }
      }, 'Contract deleted');
    } else if (deleteModal.type === 'disc') {
      const disciplinaryCases = employee.officeActivities.disciplinaryCases.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({
        ...employee,
        officeActivities: { ...(employee.officeActivities || {}), disciplinaryCases }
      }, 'Disciplinary record deleted');
    } else if (deleteModal.type === 'resignation') {
      const resignations = employee.officeActivities.resignations.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({
        ...employee,
        officeActivities: { ...(employee.officeActivities || {}), resignations }
      }, 'Resignation record deleted');
    }
  };

  if (loading) return <div className="py-28 text-center text-xs font-semibold text-slate-400 animate-pulse">Loading personnel profile structure...</div>;
  if (!employee) return <div className="py-28 text-center text-rose-400 font-semibold text-xs">Personnel record not found.</div>;

  const profileTabs = ['General Info', 'Qualifications', 'Skill', 'Experience', 'Reference', 'Document Management'].filter(tab => {
    if (tab === 'Qualifications') return hasPermission('view_qualification');
    if (tab === 'Skill') return hasPermission('view_skill');
    if (tab === 'Experience') return hasPermission('view_experience');
    if (tab === 'Reference') return hasPermission('view_reference');
    if (tab === 'Document Management') return hasPermission('view_documents');
    return true;
  });

  const activityTabs = ['Contract', 'Resignation', 'Disciplinary Case'].filter(tab => {
    if (tab === 'Contract') return hasPermission('view_contracts');
    if (tab === 'Resignation') return hasPermission('view_resignation');
    if (tab === 'Disciplinary Case') return hasPermission('view_disciplinary');
    return true;
  });
  const isActiveStatus = employee?.officeInfo?.status === 'Active';

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* Header Profile Banner Card */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-18 h-18 rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden relative border-2 border-slate-200 dark:border-slate-700 shadow-md">
            <img 
              src={employee?.documents?.find((d: any) => d.name === 'Profile Picture')?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
              className="w-full h-full object-cover" 
              alt="avatar" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isEditing ? (
                  <input
                    type="text"
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    value={editForm?.fullName || ''}
                    onChange={(e) => handleRootFieldChange('fullName', e.target.value)}
                  />
                ) : (
                  employee?.fullName || 'No Name Registered'
                )}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                isActiveStatus 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isActiveStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {employee?.officeInfo?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Department: {employee?.officeInfo?.department || 'General'}{employee?.officeInfo?.courseTaught ? ` | ${employee.officeInfo.courseTaught}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls Header Panel */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Direct Status Toggle Buttons (No Popups!) */}
          {(hasPermission('manage_resignation') || hasPermission('edit_employee')) && (
            isActiveStatus ? (
              <button
                onClick={handleInactivateStatus}
                className="bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Mark Profile as Inactive"
              >
                <UserX className="w-3.5 h-3.5" /> Make Inactive
              </button>
            ) : (
              <button
                onClick={handleActivateStatus}
                className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Mark Profile as Active"
              >
                <UserCheck className="w-3.5 h-3.5" /> Make Active
              </button>
            )
          )}

          {/* HIDE EDIT BUTTON COMPLETELY IF NO PERMISSION */}
          {hasPermission('edit_employee') && (
            isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditForm(JSON.parse(JSON.stringify(employee)));
                    populateEmailsAndMobiles(employee);
                    setIsEditing(false);
                  }}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditForm(JSON.parse(JSON.stringify(employee)));
                  populateEmailsAndMobiles(employee);
                  setIsEditing(true);
                }}
                className="bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-600/80 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Edit Profile
              </button>
            )
          )}

          <a 
            href={`mailto:${employee?.contactInfo?.email || ''}`}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2"
          >
            <Mail className="w-3.5 h-3.5" /> Send Email
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Sidebar Information */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Personal Info Card */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase border-b border-slate-200 dark:border-slate-700/60 pb-2">Personal Summary</h3>
            
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex flex-col justify-center min-h-[40px]">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Birth Date (Age):</span>
                {isEditing ? (
                  <input
                    type="date"
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl focus:outline-none w-full text-xs text-slate-900 dark:text-white"
                    value={editForm?.personalInfo?.birthDate || ''}
                    onChange={(e) => handleNestedFieldChange('personalInfo', 'birthDate', e.target.value)}
                  />
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {employee?.personalInfo?.birthDate || 'N/A'}{' '}
                    {employee?.personalInfo?.birthDate && `(${calculateDateDifference(employee.personalInfo.birthDate)})`}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center min-h-[32px]">
                <span className="text-slate-500 dark:text-slate-400">Religion:</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1 rounded-lg focus:outline-none w-32 text-xs text-slate-900 dark:text-white"
                    value={editForm?.personalInfo?.religion || ''}
                    onChange={(e) => handleNestedFieldChange('personalInfo', 'religion', e.target.value)}
                  />
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">{employee?.personalInfo?.religion || 'N/A'}</span>
                )}
              </div>

              <div className="flex justify-between items-center min-h-[32px]">
                <span className="text-slate-500 dark:text-slate-400">Marital Status:</span>
                {isEditing ? (
                  <select
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1 rounded-lg focus:outline-none w-32 text-xs text-slate-900 dark:text-white"
                    value={editForm?.personalInfo?.maritalStatus || ''}
                    onChange={(e) => handleNestedFieldChange('personalInfo', 'maritalStatus', e.target.value)}
                  >
                    <option value="">Unspecified</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">{employee?.personalInfo?.maritalStatus || 'N/A'}</span>
                )}
              </div>

              <div className="flex justify-between items-center min-h-[32px]">
                <span className="text-slate-500 dark:text-slate-400">Gender:</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1 rounded-lg focus:outline-none w-32 text-xs text-slate-900 dark:text-white"
                    value={editForm?.personalInfo?.gender || ''}
                    onChange={(e) => handleNestedFieldChange('personalInfo', 'gender', e.target.value)}
                  />
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">{employee?.personalInfo?.gender || 'N/A'}</span>
                )}
              </div>

              <div className="flex flex-col justify-center min-h-[40px]">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Join Date:</span>
                {isEditing ? (
                  <input
                    type="date"
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl focus:outline-none w-full text-xs text-slate-900 dark:text-white"
                    value={editForm?.personalInfo?.joinDate || ''}
                    onChange={(e) => handleNestedFieldChange('personalInfo', 'joinDate', e.target.value)}
                  />
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">{employee?.personalInfo?.joinDate || 'N/A'}</span>
                )}
              </div>

              <div className="flex flex-col justify-center min-h-[40px]">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Service Period (Dynamic):</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {employee?.personalInfo?.joinDate ? calculateDateDifference(employee.personalInfo.joinDate) : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center min-h-[32px]">
                <span className="text-slate-500 dark:text-slate-400">Blood Group:</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1 rounded-lg focus:outline-none w-32 text-rose-500 dark:text-rose-400 font-bold text-xs"
                    value={editForm?.personalInfo?.bloodGroup || ''}
                    onChange={(e) => handleNestedFieldChange('personalInfo', 'bloodGroup', e.target.value)}
                  />
                ) : (
                  <span className="font-bold text-rose-500 dark:text-rose-400">{employee?.personalInfo?.bloodGroup || 'N/A'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Menu Selector Buttons */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
            <button
              onClick={() => { setActiveMenu('profile'); setActiveTab('General Info'); }}
              className={`w-full text-left px-5 py-4 text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeMenu === 'profile' ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Employee Profile
            </button>
            <button
              onClick={() => { setActiveMenu('activities'); setActiveTab('Contract'); }}
              className={`w-full text-left px-5 py-4 text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeMenu === 'activities' ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Office Activities
            </button>
          </div>
        </div>

        {/* Right column: Dynamic Tabs Workspace Container */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2 shadow-xl flex items-center gap-1 overflow-x-auto scrollbar-none">
            {(activeMenu === 'profile' ? profileTabs : activityTabs).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl min-h-[480px]">
            {activeTab === 'General Info' && (
              isEditing ? (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-300 text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      Personnel Profile Edit Form (Pre-populated)
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition cursor-pointer"
                    >
                      Save All Changes
                    </button>
                  </div>

                  {/* Avatar Upload in Edit Form */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative border border-slate-300 dark:border-slate-700 shrink-0 shadow-sm">
                      <img
                        src={editForm?.documents?.find((d: any) => d.name === 'Profile Picture')?.url || employee?.documents?.find((d: any) => d.name === 'Profile Picture')?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt="Profile Photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Profile Photo Avatar</label>
                      <label className="cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1.5 shadow-xs transition">
                        <Upload className="w-3.5 h-3.5" />
                        {avatarUploading ? 'Uploading Photo...' : 'Choose Profile Photo'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleGeneralFileUpload(e, 'profile_avatar')} disabled={avatarUploading} />
                      </label>
                    </div>
                  </div>

                  {/* Core Identification */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">Core Identification</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name *</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.fullName || ''}
                          onChange={(e) => handleRootFieldChange('fullName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Department *</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.officeInfo?.department || ''}
                          onChange={(e) => handleNestedFieldChange('officeInfo', 'department', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Contact Details (Emails & Phone Numbers) */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">Contact Information (Multiple Emails & Mobiles)</h4>
                    <div className="space-y-4 text-xs">
                      {/* Email Addresses */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Email Addresses (Primary first)
                          </label>
                          <button
                            type="button"
                            onClick={addEmailField}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Email
                          </button>
                        </div>
                        {emailsList.map((emailVal, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="email"
                              placeholder={idx === 0 ? "Primary email address..." : "Secondary email address..."}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                              value={emailVal}
                              onChange={e => handleEmailChange(idx, e.target.value)}
                            />
                            {idx === 0 && <span className="text-[10px] bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-2 py-1 rounded font-semibold">Primary</span>}
                            {emailsList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEmailField(idx)}
                                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                                title="Remove Email"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Mobile Phone Numbers */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Mobile Phone Numbers (Primary first)
                          </label>
                          <button
                            type="button"
                            onClick={addMobileField}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Phone
                          </button>
                        </div>
                        {mobilesList.map((mobVal, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={idx === 0 ? "Primary mobile number..." : "Secondary mobile number..."}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                              value={mobVal}
                              onChange={e => handleMobileChange(idx, e.target.value)}
                            />
                            {idx === 0 && <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 rounded font-semibold">Primary</span>}
                            {mobilesList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMobileField(idx)}
                                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                                title="Remove Phone"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Permanent and Temporary Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Permanent Address</label>
                          <input
                            type="text"
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editForm?.contactInfo?.permanentAddress || ''}
                            onChange={(e) => handleNestedFieldChange('contactInfo', 'permanentAddress', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Temporary Address</label>
                          <input
                            type="text"
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editForm?.contactInfo?.temporaryAddress || ''}
                            onChange={(e) => handleNestedFieldChange('contactInfo', 'temporaryAddress', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">Financial Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bank Name</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.officeInfo?.bank || ''}
                          onChange={(e) => handleNestedFieldChange('officeInfo', 'bank', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bank Account Number</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.officeInfo?.bankAccount || ''}
                          onChange={(e) => handleNestedFieldChange('officeInfo', 'bankAccount', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">PAN Number</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.officeInfo?.panNumber || ''}
                          onChange={(e) => handleNestedFieldChange('officeInfo', 'panNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">SSF Number</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.officeInfo?.ssfNumber || ''}
                          onChange={(e) => handleNestedFieldChange('officeInfo', 'ssfNumber', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Person</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.emergencyContact?.contactPerson || ''}
                          onChange={(e) => handleNestedFieldChange('emergencyContact', 'contactPerson', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Relation</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.emergencyContact?.relation || ''}
                          onChange={(e) => handleNestedFieldChange('emergencyContact', 'relation', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Phone Number</label>
                        <input
                          type="text"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm?.emergencyContact?.phone || ''}
                          onChange={(e) => handleNestedFieldChange('emergencyContact', 'phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button Footer */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm(JSON.parse(JSON.stringify(employee)));
                        populateEmailsAndMobiles(employee);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md transition cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Office Info */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">Office Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">DEPARTMENT</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.officeInfo?.department || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">BANK NAME</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.officeInfo?.bank || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">BANK ACCOUNT</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.officeInfo?.bankAccount || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">PAN NUMBER</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.officeInfo?.panNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">SSF NUMBER</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.officeInfo?.ssfNumber || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info (Multiple Emails & Mobiles Display) */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">EMAIL ADDRESSES</p>
                        {employee?.contactInfo?.emails?.length ? (
                          <div className="space-y-1">
                            {employee.contactInfo.emails.map((em: string, idx: number) => (
                              <p key={idx} className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> {em}
                                {idx === 0 && <span className="text-[10px] bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-1.5 rounded">Primary</span>}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="font-semibold text-slate-900 dark:text-white">{employee?.contactInfo?.email || '-'}</p>
                        )}
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">MOBILE PHONE NUMBERS</p>
                        {employee?.contactInfo?.mobiles?.length ? (
                          <div className="space-y-1">
                            {employee.contactInfo.mobiles.map((mb: string, idx: number) => (
                              <p key={idx} className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> {mb}
                                {idx === 0 && <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-1.5 rounded">Primary</span>}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="font-semibold text-slate-900 dark:text-white">{employee?.contactInfo?.mobile || '-'}</p>
                        )}
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">PERMANENT ADDRESS</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.contactInfo?.permanentAddress || '-'}</p>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">TEMPORARY ADDRESS</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.contactInfo?.temporaryAddress || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">CONTACT PERSON</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.emergencyContact?.contactPerson || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">RELATION</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.emergencyContact?.relation || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">PHONE NUMBER</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee?.emergencyContact?.phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Interactive Qualifications Tab */}
            {activeTab === 'Qualifications' && (
              <div className="space-y-6 text-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Academic Qualifications</h4>

                {/* HIDE ADD QUALIFICATION IF NO PERMISSION */}
                {(hasPermission('add_qualification') || hasPermission('edit_employee')) && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Add Academic Credential</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Degree Level</label>
                        <input
                          type="text"
                          placeholder="e.g. Masters"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newQual.level}
                          onChange={e => setNewQual({ ...newQual, level: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Institute</label>
                        <input
                          type="text"
                          placeholder="e.g. TU University"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newQual.institute}
                          onChange={e => setNewQual({ ...newQual, institute: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Year</label>
                        <input
                          type="text"
                          placeholder="e.g. 2024"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newQual.year}
                          onChange={e => setNewQual({ ...newQual, year: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Certificate</label>
                        <input
                          type="file"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300"
                          onChange={e => handleGeneralFileUpload(e, 'qual')}
                          disabled={qualUploading}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleAddQual} 
                      disabled={qualUploading}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> {qualUploading ? 'Uploading...' : 'Append Qualification'}
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        <th className="p-3">Level</th>
                        <th className="p-3">Institute</th>
                        <th className="p-3">Year</th>
                        <th className="p-3">Attachment</th>
                        {(hasPermission('delete_qualification') || hasPermission('edit_employee')) && <th className="p-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {employee?.qualifications?.length ? (
                        employee.qualifications.map((q: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">{q?.level}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{q?.institute}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{q?.year}</td>
                            <td className="p-3">
                              {q?.url ? (
                                <button onClick={() => setPdfPreviewUrl(q.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium">
                                  View Cert <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : <span className="text-slate-400 dark:text-slate-500">No Attachment</span>}
                            </td>
                            {(hasPermission('edit_qualification') || hasPermission('delete_qualification') || hasPermission('edit_employee')) && (
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                {(hasPermission('edit_qualification') || hasPermission('edit_employee')) && (
                                  <button onClick={() => handleOpenEditQual(i, q)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition" title="Edit Qualification">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {(hasPermission('delete_qualification') || hasPermission('edit_employee')) && (
                                  <button onClick={() => setDeleteModal({ isOpen: true, type: 'qual', index: i, itemName: q.level })} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Delete Qualification">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No academic qualifications registered.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Interactive Skills Tab */}
            {activeTab === 'Skill' && (
              <div className="space-y-6 text-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Professional Skills</h4>
                
                {(hasPermission('add_skill') || hasPermission('edit_employee')) && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Add Skill Specification</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Skill name (e.g. Node.js)"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newSkill.name}
                        onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Proficiency (e.g. Expert)"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newSkill.proficiency}
                        onChange={e => setNewSkill({ ...newSkill, proficiency: e.target.value })}
                      />
                    </div>
                    <button onClick={handleAddSkill} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md">
                      <Plus className="w-3.5 h-3.5" /> Append Skill
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        <th className="p-3">Skill Name</th>
                        <th className="p-3">Proficiency</th>
                        {(hasPermission('delete_skill') || hasPermission('edit_employee')) && <th className="p-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {employee?.skills?.length ? (
                        employee.skills.map((s: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">{s?.name}</td>
                            <td className="p-3">
                              <span className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                {s?.proficiency}
                              </span>
                            </td>
                            {(hasPermission('delete_skill') || hasPermission('edit_employee')) && (
                              <td className="p-3 text-right">
                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'skill', index: idx, itemName: s.name })} className="text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="p-4 text-center text-slate-400 dark:text-slate-500">No skills registered.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Interactive Job Experience Tab */}
            {activeTab === 'Experience' && (
              <div className="space-y-6 text-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Job Experience</h4>
                
                {(hasPermission('add_experience') || hasPermission('edit_employee')) && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Add Experience Record</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Company</label>
                        <input
                          type="text"
                          placeholder="Company Name"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newExp.company}
                          onChange={e => setNewExp({ ...newExp, company: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Role</label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Lead"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newExp.role}
                          onChange={e => setNewExp({ ...newExp, role: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Duration</label>
                        <input
                          type="text"
                          placeholder="e.g. 2 Years"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newExp.duration}
                          onChange={e => setNewExp({ ...newExp, duration: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Letter</label>
                        <input
                          type="file"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300"
                          onChange={e => handleGeneralFileUpload(e, 'exp')}
                          disabled={expUploading}
                        />
                      </div>
                    </div>
                    <button onClick={handleAddExp} disabled={expUploading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> {expUploading ? 'Uploading...' : 'Append Experience'}
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        <th className="p-3">Company</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Attachment</th>
                        {(hasPermission('delete_experience') || hasPermission('edit_employee')) && <th className="p-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {employee?.experience?.length ? (
                        employee.experience.map((ex: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">{ex?.company}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{ex?.role}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{ex?.duration}</td>
                            <td className="p-3">
                              {ex?.url ? (
                                <button onClick={() => setPdfPreviewUrl(ex.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium">
                                  View Doc <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : <span className="text-slate-400 dark:text-slate-500">No Attachment</span>}
                            </td>
                            {(hasPermission('delete_experience') || hasPermission('edit_employee')) && (
                              <td className="p-3 text-right">
                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'exp', index: idx, itemName: ex.company })} className="text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No experience records registered.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Interactive References Tab */}
            {activeTab === 'Reference' && (
              <div className="space-y-6 text-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">References</h4>

                {(hasPermission('add_reference') || hasPermission('edit_employee')) && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Add Professional Reference</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Reference Name *"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newRef.name}
                        onChange={e => setNewRef({ ...newRef, name: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Designation *"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newRef.designation}
                        onChange={e => setNewRef({ ...newRef, designation: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Contact Phone *"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newRef.contact}
                        onChange={e => setNewRef({ ...newRef, contact: e.target.value })}
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newRef.email}
                        onChange={e => setNewRef({ ...newRef, email: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Company / Organization"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newRef.company}
                        onChange={e => setNewRef({ ...newRef, company: e.target.value })}
                      />
                    </div>
                    <button onClick={handleAddRef} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md">
                      <Plus className="w-3.5 h-3.5" /> Append Reference
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        <th className="p-3">Name</th>
                        <th className="p-3">Designation</th>
                        <th className="p-3">Company</th>
                        <th className="p-3">Contact</th>
                        {(hasPermission('delete_reference') || hasPermission('edit_employee')) && <th className="p-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {employee?.references?.length ? (
                        employee.references.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">{r?.name || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{r?.designation || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{r?.company || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{r?.contact || r?.email || '-'}</td>
                            {(hasPermission('delete_reference') || hasPermission('edit_employee')) && (
                              <td className="p-3 text-right">
                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'ref', index: i, itemName: r.name })} className="text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No references listed.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Document Management' && (
              <div className="space-y-6 text-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Document Upload & Media Management</h4>

                {(hasPermission('add_documents') || hasPermission('edit_employee')) && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Label Name</label>
                        <input
                          type="text"
                          placeholder="e.g. CV, Citizenship Doc"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 text-xs w-full rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newDocName}
                          onChange={e => setNewDocName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select File (PDF / Image)</label>
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 w-full text-xs text-slate-700 dark:text-slate-300 rounded-xl"
                          onChange={e => handleGeneralFileUpload(e, 'doc')}
                          disabled={uploading}
                        />
                      </div>
                    </div>
                    {uploading && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">Uploading file to Cloudinary bucket...</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Stored Documents</h5>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {employee?.documents?.map((doc: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl shadow-xs">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{doc?.name || 'Document'}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{doc?.fileType ? doc.fileType.split('/')[1] : 'PDF'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPdfPreviewUrl(doc?.url || null)}
                              className="text-xs text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 flex items-center gap-1 transition"
                            >
                              <Eye className="w-3 h-3" /> Preview
                            </button>
                            <a
                              href={doc?.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-700 dark:text-slate-300 font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PDF Viewer Frame Panel */}
                  <div className="border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center min-h-[300px]">
                    {pdfPreviewUrl ? (
                      <div className="w-full h-full flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-900 dark:text-white">Document Frame View</span>
                          <button onClick={() => setPdfPreviewUrl(null)} className="text-rose-500 font-bold hover:underline">Close</button>
                        </div>
                        {pdfPreviewUrl.endsWith('.pdf') || pdfPreviewUrl.includes('raw') ? (
                          <iframe src={pdfPreviewUrl} className="w-full h-[300px] rounded-xl border border-slate-300 dark:border-slate-700" />
                        ) : (
                          <img src={pdfPreviewUrl} alt="preview" className="max-h-[300px] w-full object-contain rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 dark:text-slate-500 text-center">Click preview to render selected document here.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Office Activities: Contracts */}
            {activeTab === 'Contract' && (
              <div className="space-y-6 text-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Employment Contracts</h4>
                
                {(hasPermission('add_contracts') || hasPermission('edit_employee')) && (
                  <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/60 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Create New Contract Record</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Contract Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Full-time Employment Contract"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full text-xs rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newContract.title}
                          onChange={e => setNewContract({ ...newContract, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Contract Document (PDF / Image)</label>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                            <Upload className="w-3.5 h-3.5" />
                            {contractUploading ? 'Uploading...' : 'Choose File'}
                            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleGeneralFileUpload(e, 'contract')} disabled={contractUploading} />
                          </label>
                          {newContract.url && <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">Attached</span>}
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Start Date *</label>
                        <input
                          type="date"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full text-xs rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newContract.startDate}
                          onChange={e => setNewContract({ ...newContract, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">End Date (Optional)</label>
                        <input
                          type="date"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full text-xs rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newContract.endDate}
                          onChange={e => setNewContract({ ...newContract, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <button onClick={handleAddContract} disabled={contractUploading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md cursor-pointer">
                      {contractUploading ? 'Uploading...' : 'Record Contract'}
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        <th className="p-3">Title</th>
                        <th className="p-3">Start Date</th>
                        <th className="p-3">End Date</th>
                        <th className="p-3">Attachment</th>
                        {(hasPermission('delete_contracts') || hasPermission('edit_employee')) && <th className="p-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {employee?.officeActivities?.contracts?.length ? (
                        employee.officeActivities.contracts.map((c: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">{c?.title || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{c?.startDate || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{c?.endDate || 'Ongoing'}</td>
                            <td className="p-3">
                              {c?.url ? (
                                <button onClick={() => setPdfPreviewUrl(c.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                                  <Eye className="w-3.5 h-3.5" /> View Contract
                                </button>
                              ) : <span className="text-slate-400 dark:text-slate-500">No Attachment</span>}
                            </td>
                            {(hasPermission('delete_contracts') || hasPermission('edit_employee')) && (
                              <td className="p-3 text-right">
                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'contract', index: idx, itemName: c.title })} className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No active contracts recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Office Activities: Resignation Records */}
            {activeTab === 'Resignation' && (
              <div className="space-y-6 text-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Resignation & Departure History</h4>
                
                {(hasPermission('add_resignation') || hasPermission('manage_resignation')) && (
                  (employee?.officeActivities?.resignations?.length || 0) >= 1 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>A resignation entry has already been recorded for this employee. Only one resignation record can be added per employee.</span>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/60 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Record Resignation Entry</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Effective Date *</label>
                        <input
                          type="date"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newResignation.date}
                          onChange={e => setNewResignation({ ...newResignation, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Status</label>
                        <select
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newResignation.status}
                          onChange={e => setNewResignation({ ...newResignation, status: e.target.value })}
                        >
                          <option value="Completed">Completed</option>
                          <option value="Approved">Approved</option>
                          <option value="Pending">Pending</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Document Notice (PDF / Image)</label>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                            <Upload className="w-3.5 h-3.5" /> Attach File
                            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleGeneralFileUpload(e, 'resignation')} disabled={resignationUploading} />
                          </label>
                        </div>
                        {newResignation.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Document attached</p>}
                      </div>
                      <div className="md:col-span-3">
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Reason / Notes *</label>
                        <textarea
                          rows={2}
                          placeholder="Details regarding departure reason or resignation notice..."
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newResignation.reason}
                          onChange={e => setNewResignation({ ...newResignation, reason: e.target.value })}
                        />
                      </div>
                    </div>
                    <button onClick={handleAddResignation} disabled={resignationUploading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> {resignationUploading ? 'Uploading...' : 'Save Resignation Record'}
                    </button>
                  </div>
                  )
                )}

                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        <th className="p-3">Effective Date</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Document Notice</th>
                        {(hasPermission('edit_resignation') || hasPermission('delete_resignation') || hasPermission('manage_resignation')) && (
                          <th className="p-3 text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {employee?.officeActivities?.resignations?.length ? (
                        employee.officeActivities.resignations.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">{r?.date || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{r?.reason || '-'}</td>
                            <td className="p-3">
                              <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                {r?.status || 'Completed'}
                              </span>
                            </td>
                            <td className="p-3">
                              {r?.url ? (
                                <button onClick={() => setPdfPreviewUrl(r.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                                  View Document <Eye className="w-3 h-3" />
                                </button>
                              ) : <span className="text-slate-400 dark:text-slate-500">No Attachment</span>}
                            </td>
                            {(hasPermission('edit_resignation') || hasPermission('delete_resignation') || hasPermission('manage_resignation')) && (
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                {(hasPermission('edit_resignation') || hasPermission('manage_resignation')) && (
                                  <button onClick={() => handleOpenEditResignation(idx, r)} className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {(hasPermission('delete_resignation') || hasPermission('manage_resignation')) && (
                                  <button onClick={() => setDeleteModal({ isOpen: true, type: 'resignation', index: idx, itemName: `Resignation on ${r.date}` })} className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No resignation records registered.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Office Activities: Disciplinary Cases */}
            {activeTab === 'Disciplinary Case' && (
              <div className="space-y-6 text-xs">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Disciplinary Cases</h4>

                {(hasPermission('add_disciplinary') || hasPermission('edit_employee')) && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Record Disciplinary Case</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Date *</label>
                        <input
                          type="date"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newDisc.date}
                          onChange={e => setNewDisc({ ...newDisc, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Issue / Incident *</label>
                        <input
                          type="text"
                          placeholder="e.g. Unauthorized absence"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newDisc.issue}
                          onChange={e => setNewDisc({ ...newDisc, issue: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Action Taken *</label>
                        <input
                          type="text"
                          placeholder="e.g. Warning letter issued"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newDisc.actionTaken}
                          onChange={e => setNewDisc({ ...newDisc, actionTaken: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Attachment</label>
                        <input
                          type="file"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 w-full text-xs text-slate-700 dark:text-slate-300 rounded-xl"
                          onChange={e => handleGeneralFileUpload(e, 'disc')}
                        />
                      </div>
                    </div>
                    <button onClick={handleAddDisc} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md">
                      <Plus className="w-3.5 h-3.5" /> Record Disciplinary Case
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        <th className="p-3">Date</th>
                        <th className="p-3">Case / Issue</th>
                        <th className="p-3">Action Taken</th>
                        <th className="p-3">Attachment</th>
                        {(hasPermission('delete_disciplinary') || hasPermission('edit_employee')) && <th className="p-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {employee?.officeActivities?.disciplinaryCases?.length ? (
                        employee.officeActivities.disciplinaryCases.map((d: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{d?.date || '-'}</td>
                            <td className="p-3 text-slate-900 dark:text-white font-medium">{d?.issue || '-'}</td>
                            <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">{d?.actionTaken || '-'}</td>
                            <td className="p-3">
                              {d?.url ? (
                                <button onClick={() => setPdfPreviewUrl(d.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                                  View Notice <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : <span className="text-slate-400 dark:text-slate-500">No File</span>}
                            </td>
                            {(hasPermission('delete_disciplinary') || hasPermission('edit_employee')) && (
                              <td className="p-3 text-right">
                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'disc', index: idx, itemName: d.issue })} className="text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No recorded disciplinary occurrences.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Edit Resignation Modal */}
      {editResignationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditResignationModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Resignation Entry</h3>
              <button onClick={() => setEditResignationModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Effective Date</label>
                <input
                  type="date"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editResignationData.date}
                  onChange={e => setEditResignationData({ ...editResignationData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status</label>
                <select
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editResignationData.status}
                  onChange={e => setEditResignationData({ ...editResignationData, status: e.target.value })}
                >
                  <option value="Completed">Completed</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Reason / Details</label>
                <textarea
                  rows={3}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editResignationData.reason}
                  onChange={e => setEditResignationData({ ...editResignationData, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Update Document Notice (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {resignationUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleGeneralFileUpload(e, 'edit_resignation')} disabled={resignationUploading} />
                  </label>
                </div>
                {editResignationData.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Document attached</p>}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditResignationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditResignation}
                  disabled={resignationUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  Save Resignation Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}




      {/* Edit Qualification Modal */}
      {editQualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditQualModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Qualification Record</h3>
              <button onClick={() => setEditQualModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Degree Level *</label>
                <input
                  type="text"
                  placeholder="e.g. Masters"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editQualData.level}
                  onChange={e => setEditQualData({ ...editQualData, level: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Institute / University *</label>
                <input
                  type="text"
                  placeholder="e.g. TU University"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editQualData.institute}
                  onChange={e => setEditQualData({ ...editQualData, institute: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Graduation Year *</label>
                <input
                  type="text"
                  placeholder="e.g. 2024"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editQualData.year}
                  onChange={e => setEditQualData({ ...editQualData, year: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Certificate Attachment (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {editQualUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleGeneralFileUpload(e, 'edit_qual')} disabled={editQualUploading} />
                  </label>
                </div>
                {editQualData.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Certificate attached</p>}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditQualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditQual}
                  disabled={editQualUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  Save Qualification Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Document Viewer Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setPdfPreviewUrl(null)} />
          <div className="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-10 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Attached Document Viewer
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={pdfPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20"
                >
                  Open in New Window <ExternalLink className="w-3 h-3" />
                </a>
                <button onClick={() => setPdfPreviewUrl(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 mt-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {pdfPreviewUrl.endsWith('.pdf') || pdfPreviewUrl.includes('raw') ? (
                <iframe src={pdfPreviewUrl} className="w-full h-full border-0" />
              ) : (
                <img src={pdfPreviewUrl} alt="Document Attachment Preview" className="max-h-full max-w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}

            {/* Delete Item Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, index: null })}
        onConfirm={handleConfirmItemDelete}
        title="Delete Item Record"
        description="Are you sure you want to permanently delete this item from the personnel profile?"
        itemName={deleteModal.itemName}
      />
    </div>
  );
}