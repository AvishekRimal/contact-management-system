'use client';

import { useEffect, useState, use } from 'react';
import { getCookie } from '@/lib/cookies';
import { toast } from 'sonner';
import EmployeeForm from '@/components/employees/EmployeeForm';

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmp = async () => {
      try {
        const token = getCookie('token');
        const res = await fetch(`/api/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setEmployee(data);
      } catch (err: any) {
        toast.error(err.message || 'Could not fetch record');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEmp();
  }, [id]);

  if (loading) {
    return <div className="py-28 text-center text-xs font-semibold text-slate-400 animate-pulse">Loading personnel data...</div>;
  }

  if (!employee) {
    return <div className="py-28 text-center text-rose-400 font-semibold text-xs">Personnel record not found.</div>;
  }

  return <EmployeeForm mode="edit" initialData={employee} employeeId={id} />;
}
