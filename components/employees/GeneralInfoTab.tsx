'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, Plus, Sparkles, Trash2, Upload } from 'lucide-react';
import { uploadFile } from '@/lib/uploadFile';
import RoleVisibilitySelector from '@/components/employees/RoleVisibilitySelector';

interface GeneralInfoTabProps {
  employee: any;
  editForm: any;
  isEditing: boolean;
  emailsList: string[];
  mobilesList: string[];
  setEditForm: (updater: any) => void;
  setIsEditing: (val: boolean) => void;
  handleRootFieldChange: (field: string, value: any) => void;
  handleNestedFieldChange: (section: string, field: string, value: any) => void;
  handleEmailChange: (index: number, val: string) => void;
  addEmailField: () => void;
  removeEmailField: (index: number) => void;
  handleMobileChange: (index: number, val: string) => void;
  addMobileField: () => void;
  removeMobileField: (index: number) => void;
  handleSaveProfile: () => Promise<void>;
  populateEmailsAndMobiles: (data: any) => void;
  roles: Array<{ _id: string; name: string }>;
  rolesLoading: boolean;
  selectedRoleIds: string[];
  setSelectedRoleIds: (ids: string[]) => void;
}

export default function GeneralInfoTab({
  employee,
  editForm,
  isEditing,
  emailsList,
  mobilesList,
  setEditForm,
  setIsEditing,
  handleRootFieldChange,
  handleNestedFieldChange,
  handleEmailChange,
  addEmailField,
  removeEmailField,
  handleMobileChange,
  addMobileField,
  removeMobileField,
  handleSaveProfile,
  populateEmailsAndMobiles,
  roles,
  rolesLoading,
  selectedRoleIds,
  setSelectedRoleIds,
}: GeneralInfoTabProps) {
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setAvatarUploading(true);
    try {
      const data = await uploadFile(file);
      const docObj = {
        name: 'Profile Picture',
        url: data.url,
        publicId: data.publicId,
        fileType: file.type,
      };
      const existingDocs = editForm?.documents || employee?.documents || [];
      const otherDocs = existingDocs.filter((d: any) => d.name !== 'Profile Picture');
      const updatedDocs = [...otherDocs, docObj];
      setEditForm((prev: any) => ({ ...prev, documents: updatedDocs }));
      toast.success('Profile photo uploaded!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'File upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm(JSON.parse(JSON.stringify(employee)));
    populateEmailsAndMobiles(employee);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
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
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
            </label>
          </div>
        </div>

        {/* Core Identification + Visibility & Access split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
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

          <div className="lg:col-span-4">
            <RoleVisibilitySelector
              roles={roles}
              selectedRoleIds={selectedRoleIds}
              onChange={setSelectedRoleIds}
              loading={rolesLoading}
            />
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
            onClick={handleCancelEdit}
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
    );
  }

  return (
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
  );
}
