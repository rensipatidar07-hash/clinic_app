export interface Patient {
  id: string; // generated format e.g. P-1001
  firstName: string;
  surname: string;
  parentName: string; // Father's or Mother's Name
  nativePlace: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  weight?: number; // weight in kg
  createdAt: string;
  updatedAt: string;
  creatorId: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  weight: number; // in kg
  height: number; // in cm
  headCircumference: number; // in cm
  temperature: number; // in F
  vitalsOther?: string;
  symptoms: string[];
  symptomsOther?: string;
  clinicalNotes: string;
  history: string;
  vaccinationsGiven: string[];
  milestonesChecked: string[];
  prescriptions: PrescriptionItem[];
  labReports: LabReportItem[];
  createdAt: string;
  updatedAt: string;
  creatorId: string;
}

export interface PrescriptionItem {
  medicineName: string;
  dosage: string; // e.g. "5ml" or "1 tablet"
  frequency: string; // e.g. "Once daily", "Three times a day"
  duration: string; // e.g. "5 days"
  instructions?: string; // e.g. "After food"
}

export interface LabReportItem {
  id: string;
  fileName: string;
  fileUrl: string; // image or doc link
  notes?: string;
  uploadedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string; // ISO date-time
  status: 'scheduled' | 'checked-in' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
}

export interface Vaccination {
  id: string;
  patientId: string;
  vaccineName: string;
  dueDate: string; // YYYY-MM-DD
  status: 'scheduled' | 'completed' | 'overdue';
  givenDate?: string;
  notes?: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  patientId: string;
  milestoneName: string;
  ageCategory: string; // e.g. "2 Months", "4 Months", etc.
  status: 'pending' | 'achieved' | 'delayed';
  achievedDate?: string;
  notes?: string;
  updatedAt: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  recipientPhones: string[];
  createdAt: string;
  senderId: string;
}

export interface Settings {
  id: 'clinic-settings';
  smsWebhook: string;
  appointmentTemplate: string;
  vaccineDueTemplate: string;
  diwaliTemplate: string;
  eidTemplate: string;
  newYearTemplate: string;
  updatedAt: string;
  updaterId: string;
}
