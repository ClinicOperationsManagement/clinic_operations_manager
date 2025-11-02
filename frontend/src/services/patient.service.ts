import api from './api';
import type { Patient, ApiResponse } from '../types';

export const patientService = {
  getPatients: async (params?: any) => {
    const response = await api.get<any, ApiResponse<Patient[]>>('/patients', { params });
    return response;
  },

  getPatientById: async (id: string) => {
    const response = await api.get<any, ApiResponse<{ patient: Patient }>>(`/patients/${id}`);
    return response.data?.patient;
  },

  createPatient: async (patientData: Partial<Patient>) => {
    const response = await api.post<any, ApiResponse<{ patient: Patient }>>('/patients', patientData);
    return response.data?.patient;
  },

  updatePatient: async (id: string, patientData: Partial<Patient>) => {
    const response = await api.put<any, ApiResponse<{ patient: Patient }>>(`/patients/${id}`, patientData);
    return response.data?.patient;
  },

  deletePatient: async (id: string) => {
    await api.delete(`/patients/${id}`);
  },

  getPatientAppointments: async (id: string) => {
    const response = await api.get<any, ApiResponse<any[]>>(`/patients/${id}/appointments`);
    return response.data || [];
  },

  getPatientTreatments: async (id: string) => {
    const response = await api.get<any, ApiResponse<any[]>>(`/patients/${id}/treatments`);
    return response.data || [];
  },

  getPatientInvoices: async (id: string) => {
    const response = await api.get<any, ApiResponse<any[]>>(`/patients/${id}/invoices`);
    return response.data || [];
  },

  getPatientFiles: async (id: string) => {
    const response = await api.get<any, ApiResponse<any[]>>(`/patients/${id}/files`);
    return response.data || [];
  },

  exportPatients: async (format: 'csv' | 'excel' | 'pdf', filters?: any) => {
    const response = await api.post('/patients/export', { format, filters }, {
      responseType: 'blob',
    });
    return response;
  },
};
