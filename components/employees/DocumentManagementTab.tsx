'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, ExternalLink, FileText, Trash2, Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/uploadFile';
import { EmployeeTabProps } from './types';

interface DocumentManagementTabProps extends EmployeeTabProps {
  pdfPreviewUrl: string | null;
}

export default function DocumentManagementTab({ employee, hasPermission, updateEmployeeAPI, pdfPreviewUrl, setPdfPreviewUrl, setDeleteModal }: DocumentManagementTabProps) {
  const [uploading, setUploading] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);

  const handleUploadSelectedDoc = async () => {
    if (!hasPermission('add_documents')) {
      toast.error('Permission Denied: You do not have permission to upload documents.');
      return;
    }
    if (!selectedDocFile) {
      toast.error('Please select a file to upload first');
      return;
    }
    setUploading(true);
    try {
      const data = await uploadFile(selectedDocFile);
      const docObj = {
        name: newDocName.trim() || selectedDocFile.name,
        url: data.url,
        publicId: data.publicId,
        fileType: selectedDocFile.type,
      };
      const updatedDocs = [...(employee?.documents || []), docObj];
      await updateEmployeeAPI({ ...employee, documents: updatedDocs }, 'Document uploaded successfully');
      setNewDocName('');
      setSelectedDocFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Document Upload & Media Management</h4>

      {hasPermission('add_documents') && (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-4 shadow-sm">
          <h5 className="font-semibold text-slate-800 dark:text-slate-200">Upload New Personnel Document</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Label Name</label>
              <input
                type="text"
                placeholder="e.g. CV, Citizenship Doc, Educational Certificate"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 text-xs w-full rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newDocName}
                onChange={e => setNewDocName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Document File (PDF / Image)</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full text-xs text-slate-700 dark:text-slate-300 rounded-xl"
                onChange={e => {
                  if (e.target.files?.[0]) setSelectedDocFile(e.target.files[0]);
                }}
                disabled={uploading}
              />
            </div>
          </div>

          {selectedDocFile && (
            <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3.5 py-2 rounded-xl text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedDocFile.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">({(selectedDocFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                onClick={() => setSelectedDocFile(null)}
                className="text-slate-400 hover:text-rose-500 transition p-1 rounded-lg"
                title="Remove file selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleUploadSelectedDoc}
              disabled={uploading || !selectedDocFile}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs px-5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
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
                  {hasPermission('delete_documents') && (
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, type: 'doc', index: i, itemName: doc?.name || 'Document' })}
                      className="text-xs text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center gap-1 transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
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
  );
}
