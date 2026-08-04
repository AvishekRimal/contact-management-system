'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Briefcase, Mail, Sparkles, UserCheck, UserX, Edit2, FileText, ExternalLink, X
} from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getCookie } from '@/lib/cookies';
import GeneralInfoTab from '@/components/employees/GeneralInfoTab';
import QualificationsTab from '@/components/employees/QualificationsTab';
import SkillTab from '@/components/employees/SkillTab';
import ExperienceTab from '@/components/employees/ExperienceTab';
import ReferenceTab from '@/components/employees/ReferenceTab';
import DocumentManagementTab from '@/components/employees/DocumentManagementTab';
import ContractTab from '@/components/employees/ContractTab';
import ResignationTab from '@/components/employees/ResignationTab';
import DisciplinaryCaseTab from '@/components/employees/DisciplinaryCaseTab';
import { DeleteModalState } from '@/components/employees/types';
import EmployeeForm from '@/components/employees/EmployeeForm';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [employee, setEmployee] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<'profile' | 'activities'>('profile');
  const [activeTab, setActiveTab] = useState<string>('General Info');
  const [loading, setLoading] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
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

  const fetchEmployee = async () => {
    try {
      const token = getCookie('token');
      const res = await fetch(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve record');
      const data = await res.json();
      setEmployee(data);
    } catch (e: any) {
      console.error(e);
      toast.error('Could not load personnel profile');
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getCookie('token');
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
      const token = getCookie('token');
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

  // Confirm delete item handler
  const handleConfirmItemDelete = async () => {
    const idx = deleteModal.index;
    if (idx === null) return;

    if (deleteModal.type === 'qual') {
      if (!hasPermission('delete_qualification')) {
        toast.error('Permission Denied: Cannot delete qualification.');
        return;
      }
      const qualifications = employee.qualifications.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, qualifications }, 'Qualification removed');
    } else if (deleteModal.type === 'skill') {
      if (!hasPermission('delete_skill')) {
        toast.error('Permission Denied: Cannot delete skill.');
        return;
      }
      const skills = employee.skills.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, skills }, 'Skill removed');
    } else if (deleteModal.type === 'exp') {
      if (!hasPermission('delete_experience')) {
        toast.error('Permission Denied: Cannot delete experience.');
        return;
      }
      const experience = employee.experience.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, experience }, 'Experience entry removed');
    } else if (deleteModal.type === 'ref') {
      if (!hasPermission('delete_reference')) {
        toast.error('Permission Denied: Cannot delete reference.');
        return;
      }
      const references = employee.references.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, references }, 'Reference removed');
    } else if (deleteModal.type === 'contract') {
      if (!hasPermission('delete_contracts')) {
        toast.error('Permission Denied: Cannot delete contract.');
        return;
      }
      const contracts = employee.officeActivities.contracts.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({
        ...employee,
        officeActivities: { ...(employee.officeActivities || {}), contracts }
      }, 'Contract deleted');
    } else if (deleteModal.type === 'disc') {
      if (!hasPermission('delete_disciplinary')) {
        toast.error('Permission Denied: Cannot delete disciplinary case.');
        return;
      }
      const disciplinaryCases = employee.officeActivities.disciplinaryCases.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({
        ...employee,
        officeActivities: { ...(employee.officeActivities || {}), disciplinaryCases }
      }, 'Disciplinary record deleted');
    } else if (deleteModal.type === 'resignation') {
      if (!hasPermission('delete_resignation') && !hasPermission('manage_resignation')) {
        toast.error('Permission Denied: Cannot delete resignation.');
        return;
      }
      const resignations = employee.officeActivities.resignations.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({
        ...employee,
        officeActivities: { ...(employee.officeActivities || {}), resignations }
      }, 'Resignation record deleted');
    } else if (deleteModal.type === 'doc') {
      if (!hasPermission('delete_documents')) {
        toast.error('Permission Denied: Cannot delete document.');
        return;
      }
      const documents = employee.documents.filter((_: any, i: number) => i !== idx);
      await updateEmployeeAPI({ ...employee, documents }, 'Document deleted');
    }
  };

  if (loading) return <div className="py-28 text-center text-xs font-semibold text-slate-400 animate-pulse">Loading personnel profile structure...</div>;
  if (!employee) return <div className="py-28 text-center text-rose-400 font-semibold text-xs">Personnel record not found.</div>;

  if (isEditing) {
    return (
      <EmployeeForm
        mode="edit"
        initialData={employee}
        employeeId={id}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => {
          setIsEditing(false);
          fetchEmployee();
        }}
      />
    );
  }

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
                {employee?.fullName || 'No Name Registered'}
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
            <button
              onClick={() => setIsEditing(true)}
              className="bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-600/80 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Edit Profile
            </button>
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
        <div className="lg:col-span-4 xl:col-span-3.5 space-y-6">

          {/* Personal Info Card */}
          <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Personal Summary
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Birth Date & Age Side-by-Side Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/50 rounded-xl p-3 space-y-2 shadow-2xs">
                <div className="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Birth Date</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      {employee?.personalInfo?.birthDate || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Age</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {employee?.personalInfo?.birthDate ? calculateDateDifference(employee.personalInfo.birthDate) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Religion & Marital Status Side by Side */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/50 rounded-xl p-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Religion</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">{employee?.personalInfo?.religion || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/50 rounded-xl p-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Marital Status</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">{employee?.personalInfo?.maritalStatus || 'N/A'}</span>
                </div>
              </div>

              {/* Gender & Blood Group Side by Side */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/50 rounded-xl p-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Gender</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">{employee?.personalInfo?.gender || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/50 rounded-xl p-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Blood Group</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {employee?.personalInfo?.bloodGroup || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Join Date & Service Period */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Join Date:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{employee?.personalInfo?.joinDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Service Period:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                    {employee?.personalInfo?.joinDate ? calculateDateDifference(employee.personalInfo.joinDate) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Menu Selector Buttons */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
            <button
              onClick={() => {
                setActiveMenu('profile');
                if (profileTabs.length > 0) setActiveTab(profileTabs[0]);
              }}
              className={`w-full text-left px-5 py-4 text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeMenu === 'profile' ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Employee Profile
            </button>
            <button
              onClick={() => {
                setActiveMenu('activities');
                if (activityTabs.length > 0) setActiveTab(activityTabs[0]);
              }}
              className={`w-full text-left px-5 py-4 text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeMenu === 'activities' ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Office Activities
            </button>
          </div>
        </div>

        {/* Right column: Dynamic Tabs Workspace Container */}
        <div className="lg:col-span-8 xl:col-span-8.5 space-y-6">
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
              <GeneralInfoTab employee={employee} />
            )}

            {activeTab === 'Qualifications' && (
              <QualificationsTab
                employee={employee}
                hasPermission={hasPermission}
                updateEmployeeAPI={updateEmployeeAPI}
                setPdfPreviewUrl={setPdfPreviewUrl}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'Skill' && (
              <SkillTab
                employee={employee}
                hasPermission={hasPermission}
                updateEmployeeAPI={updateEmployeeAPI}
                setPdfPreviewUrl={setPdfPreviewUrl}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'Experience' && (
              <ExperienceTab
                employee={employee}
                hasPermission={hasPermission}
                updateEmployeeAPI={updateEmployeeAPI}
                setPdfPreviewUrl={setPdfPreviewUrl}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'Reference' && (
              <ReferenceTab
                employee={employee}
                hasPermission={hasPermission}
                updateEmployeeAPI={updateEmployeeAPI}
                setPdfPreviewUrl={setPdfPreviewUrl}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'Document Management' && (
              <DocumentManagementTab
                employee={employee}
                hasPermission={hasPermission}
                updateEmployeeAPI={updateEmployeeAPI}
                pdfPreviewUrl={pdfPreviewUrl}
                setPdfPreviewUrl={setPdfPreviewUrl}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'Contract' && (
              <ContractTab
                employee={employee}
                hasPermission={hasPermission}
                updateEmployeeAPI={updateEmployeeAPI}
                setPdfPreviewUrl={setPdfPreviewUrl}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'Resignation' && (
              <ResignationTab
                employee={employee}
                hasPermission={hasPermission}
                updateEmployeeAPI={updateEmployeeAPI}
                setPdfPreviewUrl={setPdfPreviewUrl}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'Disciplinary Case' && (
              <DisciplinaryCaseTab
                employee={employee}
                hasPermission={hasPermission}
                updateEmployeeAPI={updateEmployeeAPI}
                setPdfPreviewUrl={setPdfPreviewUrl}
                setDeleteModal={setDeleteModal}
              />
            )}
          </div>

        </div>
      </div>

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
