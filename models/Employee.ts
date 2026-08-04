export interface IEmployee {
  _id?: string;
  id?: string;
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
  visibleToRoles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}