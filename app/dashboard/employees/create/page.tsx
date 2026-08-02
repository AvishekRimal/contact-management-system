'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, ShieldAlert, Sparkles, Plus, Trash2, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { employeeSchema } from '@/lib/validations';
import RoleVisibilitySelector from '@/components/employees/RoleVisibilitySelector';

export default function CreateEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Array<{ _id: string; name: string }>>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Multiple Emails & Mobiles states
  const [emailsList, setEmailsList] = useState<string[]>(['']);
  const [mobilesList, setMobilesList] = useState<string[]>(['']);

  const [form, setForm] = useState({
    fullName: '',
    contactInfo: {
      email: '',
      mobile: '',
      emails: [] as string[],
      mobiles: [] as string[],
      permanentAddress: '',
      temporaryAddress: '',
    },
    personalInfo: {
      birthDate: '',
      religion: '',
      maritalStatus: '',
      gender: '',
      joinDate: '',
      bloodGroup: '',
    },
    officeInfo: {
      department: '',
      courseTaught: '',
      bank: '',
      bankAccount: '',
      panNumber: '',
      ssfNumber: '',
      status: 'Active' as 'Active' | 'Inactive',
    },
    emergencyContact: {
      contactPerson: '',
      relation: '',
      phone: '',
    },
    documents: [] as Array<{ name: string; url: string; publicId: string; fileType: string }>,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUser(d.user); })
        .catch(() => {});

      fetch('/api/roles', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setRoles(d); })
        .catch(() => {})
        .finally(() => setRolesLoading(false));
    } else {
      setRolesLoading(false);
    }
  }, []);

  // Pre-select the logged-in user's own role once both currentUser and roles are loaded.
  // Admins aren't a selectable option (they already see everything internally), so there's
  // nothing to pre-select for an admin creator — it defaults to unrestricted (visible to all).
  useEffect(() => {
    const roleName = (currentUser?.role?.name || '').toLowerCase();
    if (currentUser?.role?._id && roleName !== 'admin' && roles.length > 0 && selectedRoleIds.length === 0) {
      setSelectedRoleIds([currentUser.role._id]);
    }
  }, [currentUser, roles]);

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

  // Helper functions for dynamic email list
  const handleEmailChange = (index: number, val: string) => {
    const updated = [...emailsList];
    updated[index] = val;
    setEmailsList(updated);
  };
  const addEmailField = () => setEmailsList([...emailsList, '']);
  const removeEmailField = (index: number) => {
    if (emailsList.length === 1) return;
    setEmailsList(emailsList.filter((_, i) => i !== index));
  };

  // Helper functions for dynamic mobile list
  const handleMobileChange = (index: number, val: string) => {
    const updated = [...mobilesList];
    updated[index] = val;
    setMobilesList(updated);
  };
  const addMobileField = () => setMobilesList([...mobilesList, '']);
  const removeMobileField = (index: number) => {
    if (mobilesList.length === 1) return;
    setMobilesList(mobilesList.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');
      
      const imageDoc = {
        name: 'Profile Picture',
        url: data.url,
        publicId: data.publicId,
        fileType: file.type
      };

      setForm(prev => ({
        ...prev,
        documents: [imageDoc, ...prev.documents.filter(d => d.name !== 'Profile Picture')]
      }));
      toast.success('Profile photo uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getProfileImageUrl = () => {
    const pic = form.documents.find(d => d.name === 'Profile Picture');
    return pic ? pic.url : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!hasPermission('add_employee')) {
      toast.error('Permission Denied: You do not have permission to add personnel records.');
      return;
    }

    const primaryEmail = emailsList[0]?.trim() || '';
    const primaryMobile = mobilesList[0]?.trim() || '';
    const validEmails = emailsList.map(e => e.trim()).filter(Boolean);
    const validMobiles = mobilesList.map(m => m.trim()).filter(Boolean);

    const payload = {
      ...form,
      contactInfo: {
        ...form.contactInfo,
        email: primaryEmail,
        mobile: primaryMobile,
        emails: validEmails,
        mobiles: validMobiles,
      },
      visibleToRoles: selectedRoleIds,
    };

    // Zod Schema Validation
    const validation = employeeSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const pathStr = issue.path.join('.');
        errors[pathStr] = issue.message;
      });
      setFieldErrors(errors);
      toast.error('Please check form validation errors.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save profile.');

      toast.success(`Personnel profile for "${form.fullName}" registered successfully!`);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser && !hasPermission('add_employee')) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          You do not have the required (<code className="bg-slate-800 px-1 py-0.5 rounded text-amber-400">add_employee</code>) permission to register new personnel.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 shadow-xs">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Personnel Registration</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Register employee profiles with complete background data.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Identification + Visibility & Access split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Core Identification Profile</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 overflow-hidden relative flex items-center justify-center shadow-md">
                {getProfileImageUrl() ? (
                  <img src={getProfileImageUrl()!} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl transition border border-slate-300 dark:border-slate-600">
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Avishek Rimal"
                  className={`w-full bg-white dark:bg-slate-900 border ${fieldErrors['fullName'] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                />
                {fieldErrors['fullName'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['fullName']}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Department *</label>
                <input
                  type="text"
                  placeholder="e.g. Software Development"
                  className={`w-full bg-white dark:bg-slate-900 border ${fieldErrors['officeInfo.department'] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                  value={form.officeInfo.department}
                  onChange={e => setForm({ ...form, officeInfo: { ...form.officeInfo, department: e.target.value } })}
                />
                {fieldErrors['officeInfo.department'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['officeInfo.department']}</p>}
              </div>

              {/* Dynamic Multiple Emails Section */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Email Addresses * (Primary first)
                  </label>
                  <button
                    type="button"
                    onClick={addEmailField}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Email
                  </button>
                </div>
                {emailsList.map((emailVal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder={idx === 0 ? "Primary email address..." : "Secondary email address..."}
                      className={`flex-1 bg-white dark:bg-slate-900 border ${fieldErrors['contactInfo.email'] && idx === 0 ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                      value={emailVal}
                      onChange={e => handleEmailChange(idx, e.target.value)}
                    />
                    {emailsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(idx)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {fieldErrors['contactInfo.email'] && <p className="text-[11px] text-red-500">{fieldErrors['contactInfo.email']}</p>}
              </div>

              {/* Dynamic Multiple Mobile Numbers Section */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Mobile Phone Numbers * (Primary first)
                  </label>
                  <button
                    type="button"
                    onClick={addMobileField}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Phone
                  </button>
                </div>
                {mobilesList.map((mobVal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={idx === 0 ? "Primary mobile number..." : "Secondary mobile number..."}
                      className={`flex-1 bg-white dark:bg-slate-900 border ${fieldErrors['contactInfo.mobile'] && idx === 0 ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                      value={mobVal}
                      onChange={e => handleMobileChange(idx, e.target.value)}
                    />
                    {mobilesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMobileField(idx)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {fieldErrors['contactInfo.mobile'] && <p className="text-[11px] text-red-500">{fieldErrors['contactInfo.mobile']}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <RoleVisibilitySelector
            roles={roles}
            selectedRoleIds={selectedRoleIds}
            onChange={setSelectedRoleIds}
            loading={rolesLoading}
          />
        </div>
        </div>

        {/* Address and Financial Card */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60 pb-2">Addresses & Financial Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Permanent Address</label>
              <input
                type="text"
                placeholder="e.g. Kathmandu"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.contactInfo.permanentAddress}
                onChange={e => setForm({ ...form, contactInfo: { ...form.contactInfo, permanentAddress: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Temporary Address</label>
              <input
                type="text"
                placeholder="e.g. Lalitpur"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.contactInfo.temporaryAddress}
                onChange={e => setForm({ ...form, contactInfo: { ...form.contactInfo, temporaryAddress: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. Global IME Bank"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.officeInfo.bank}
                onChange={e => setForm({ ...form, officeInfo: { ...form.officeInfo, bank: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bank Account Number</label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.officeInfo.bankAccount}
                onChange={e => setForm({ ...form, officeInfo: { ...form.officeInfo, bankAccount: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">PAN Number</label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.officeInfo.panNumber}
                onChange={e => setForm({ ...form, officeInfo: { ...form.officeInfo, panNumber: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">SSF Number</label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.officeInfo.ssfNumber}
                onChange={e => setForm({ ...form, officeInfo: { ...form.officeInfo, ssfNumber: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Card */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60 pb-2">Emergency Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Person</label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.emergencyContact.contactPerson}
                onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, contactPerson: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Relation</label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.emergencyContact.relation}
                onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relation: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.emergencyContact.phone}
                onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* Optional Secondary Information card */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60 pb-2">Optional Personal Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date of Birth (DOB)</label>
              <input
                type="date"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.personalInfo.birthDate}
                onChange={e => setForm({ ...form, personalInfo: { ...form.personalInfo, birthDate: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Joined Date</label>
              <input
                type="date"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.personalInfo.joinDate}
                onChange={e => setForm({ ...form, personalInfo: { ...form.personalInfo, joinDate: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Blood Group</label>
              <input
                type="text"
                placeholder="e.g. B+"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.personalInfo.bloodGroup}
                onChange={e => setForm({ ...form, personalInfo: { ...form.personalInfo, bloodGroup: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Religion</label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.personalInfo.religion}
                onChange={e => setForm({ ...form, personalInfo: { ...form.personalInfo, religion: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Marital Status</label>
              <select
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.personalInfo.maritalStatus}
                onChange={e => setForm({ ...form, personalInfo: { ...form.personalInfo, maritalStatus: e.target.value } })}
              >
                <option value="">Unspecified</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gender</label>
              <input
                type="text"
                placeholder="e.g. Male / Female"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.personalInfo.gender}
                onChange={e => setForm({ ...form, personalInfo: { ...form.personalInfo, gender: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* HIDE SUBMIT BUTTON IF NO PERMISSION */}
        {hasPermission('add_employee') && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Processing Registration...' : 'Commit Personnel Record'}
          </button>
        )}
      </form>
    </div>
  );
}