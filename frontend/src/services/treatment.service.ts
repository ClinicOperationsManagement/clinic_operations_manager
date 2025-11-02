import api from './api';
import type { Treatment, ApiResponse } from '../types';

export const treatmentService = {
  getTreatments: async (params?: any) => {
    const response = await api.get<any, ApiResponse<Treatment[]>>('/treatments', { params });
    return response;
  },

  getTreatmentById: async (id: string) => {
    const response = await api.get<any, ApiResponse<{ treatment: Treatment }>>(`/treatments/${id}`);
    return response.data?.treatment;
  },

  createTreatment: async (treatmentData: Partial<Treatment>) => {
    const response = await api.post<any, ApiResponse<{ treatment: Treatment }>>('/treatments', treatmentData);
    return response.data?.treatment;
  },

  updateTreatment: async (id: string, treatmentData: Partial<Treatment>) => {
    const response = await api.put<any, ApiResponse<{ treatment: Treatment }>>(`/treatments/${id}`, treatmentData);
    return response.data?.treatment;
  },

  deleteTreatment: async (id: string) => {
    await api.delete(`/treatments/${id}`);
  },
};
