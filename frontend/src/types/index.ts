export interface User {
  _id: string;
  id?: string;
  email: string;
  name: string;
  role: 'admin' | 'dentist' | 'receptionist';
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  _id: string;
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  weight?: number;
  height?: number;
  bloodPressure?: string;
  temperature?: number;
  contact: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
  diseases?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  patientId: Patient | string;
  doctorId: User | string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  _id: string;
  patientId: Patient | string;
  doctorId: User | string;
  appointmentId?: string;
  treatmentType: string;
  description?: string;
  cost: number;
  disease?: string;
  treatmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  patientId: Patient | string;
  treatmentIds: (Treatment | string)[];
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  _id: string;
  patientId: string;
  fileName: string;
  fileType: 'prescription' | 'scan' | 'report' | 'other';
  mimeType: string;
  fileSize: number;
  s3Key: string;
  s3Bucket: string;
  uploadedBy: User | string;
  signedUrl?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalPatients: number;
  totalRevenue: number;
  totalAppointments: number;
  upcomingAppointments: number;
}

export interface PatientGrowth {
  date: string;
  count: number;
}

export interface RevenueByTreatment {
  treatmentType: string;
  totalRevenue: number;
  count: number;
}

export interface PatientsByDoctor {
  doctorId: string;
  doctorName: string;
  patientCount: number;
}

export interface DiseaseStats {
  disease: string;
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
