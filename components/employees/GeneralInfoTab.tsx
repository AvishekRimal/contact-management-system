'use client';

import { Mail, Phone } from 'lucide-react';

interface GeneralInfoTabProps {
  employee: any;
}

export default function GeneralInfoTab({ employee }: GeneralInfoTabProps) {
  return (
    <div className="space-y-8">
      {/* Office Info */}
      <div>
        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">
          Office Information
        </h4>
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
        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">
          Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 dark:text-slate-300">
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">EMAIL ADDRESSES</p>
            {employee?.contactInfo?.emails?.length ? (
              <div className="space-y-1">
                {employee.contactInfo.emails.map((em: string, idx: number) => (
                  <p key={idx} className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> {em}
                    {idx === 0 && (
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-1.5 rounded">
                        Primary
                      </span>
                    )}
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
                    {idx === 0 && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-1.5 rounded">
                        Primary
                      </span>
                    )}
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
        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-4">
          Emergency Contact
        </h4>
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
