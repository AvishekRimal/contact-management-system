import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  fullName: string;
  personalInfo: {
    birthDate: string;
    religion: string;
    maritalStatus: string;
    gender: string;
    joinDate: string;
    endDate?: string;
    servicePeriod?: string;
    bloodGroup: string;
  };
  officeInfo: {
    department: string;
    section: string;
    gradeGroup: string;
    deviceCode: string;
    bank: string;
    bankAccount: string;
    panNumber: string;
    ssfNumber: string;
    courseTaught: string;
    status: 'Active' | 'Inactive';
  };
  contactInfo: {
    permanentAddress: string;
    temporaryAddress: string;
    email: string;
    mobile: string;
    emails?: string[];
    mobiles?: string[];
  };
  shiftAndPunch: {
    punchType: string;
    shift: string;
    weekOff: string;
  };
  emergencyContact: {
    contactPerson: string;
    relation: string;
    phone: string;
  };
  qualifications: Array<{
    _id?: string;
    level: string;
    institute: string;
    year: string;
    url?: string;
  }>;
  skills: Array<{
    _id?: string;
    name: string;
    proficiency: string;
  }>;
  experience: Array<{
    _id?: string;
    company: string;
    role: string;
    duration: string;
    url?: string;
  }>;
  references: Array<{
    _id?: string;
    name: string;
    designation: string;
    contact: string;
    email?: string;
    company?: string;
  }>;
  documents: Array<{
    _id?: string;
    name: string;
    url: string;
    publicId: string;
    fileType: string;
  }>;
  officeActivities: {
    contracts: Array<{
      _id?: string;
      title: string;
      startDate: string;
      endDate: string;
      url?: string;
    }>;
    resignations: Array<{
      _id?: string;
      date: string;
      reason: string;
      status: string;
      url?: string;
    }>;
    disciplinaryCases: Array<{
      _id?: string;
      date: string;
      issue: string;
      actionTaken: string;
      severity?: string;
      url?: string;
    }>;
  };
  visibleToRoles: mongoose.Types.ObjectId[];
}

const EmployeeSchema = new Schema<IEmployee>({
  fullName: { type: String, required: true, trim: true },
  personalInfo: {
    birthDate: { type: String, default: '' },
    religion: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    gender: { type: String, default: '' },
    joinDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    servicePeriod: { type: String, default: '' },
    bloodGroup: { type: String, default: '' }
  },
  officeInfo: {
    department: { type: String, required: true },
    section: { type: String, default: '' },
    gradeGroup: { type: String, default: '' },
    deviceCode: { type: String, default: '' },
    bank: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    ssfNumber: { type: String, default: '' },
    courseTaught: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  contactInfo: {
    permanentAddress: { type: String, default: '' },
    temporaryAddress: { type: String, default: '' },
    email: { type: String, required: true },
    mobile: { type: String, default: '' },
    emails: { type: [String], default: [] },
    mobiles: { type: [String], default: [] }
  },
  shiftAndPunch: {
    punchType: { type: String, default: '' },
    shift: { type: String, default: '' },
    weekOff: { type: String, default: '' }
  },
  emergencyContact: {
    contactPerson: { type: String, default: '' },
    relation: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  qualifications: [{
    level: { type: String, default: '' },
    institute: { type: String, default: '' },
    year: { type: String, default: '' },
    url: { type: String, default: '' }
  }],
  skills: [{
    name: { type: String, default: '' },
    proficiency: { type: String, default: '' }
  }],
  experience: [{
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    duration: { type: String, default: '' },
    url: { type: String, default: '' }
  }],
  references: [{
    name: { type: String, default: '' },
    designation: { type: String, default: '' },
    contact: { type: String, default: '' },
    email: { type: String, default: '' },
    company: { type: String, default: '' }
  }],
  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileType: { type: String, required: true }
  }],
  officeActivities: {
    contracts: [{
      title: { type: String, default: '' },
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
      url: { type: String, default: '' }
    }],
    resignations: [{
      date: { type: String, default: '' },
      reason: { type: String, default: '' },
      status: { type: String, default: 'Completed' },
      url: { type: String, default: '' }
    }],
    disciplinaryCases: [{
      date: { type: String, default: '' },
      issue: { type: String, default: '' },
      actionTaken: { type: String, default: '' },
      severity: { type: String, default: 'Low' },
      url: { type: String, default: '' }
    }]
  },
  visibleToRoles: { type: [Schema.Types.ObjectId], ref: 'Role', default: [] }
}, { timestamps: true });

const Employee: Model<IEmployee> = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
export default Employee;