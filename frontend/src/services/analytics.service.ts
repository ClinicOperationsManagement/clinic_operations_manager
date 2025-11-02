import api from './api';
import type {
  DashboardMetrics,
  PatientGrowth,
  RevenueByTreatment,
  PatientsByDoctor,
  DiseaseStats,
  ApiResponse,
} from '../types';

export const analyticsService = {
  getDashboardMetrics: async () => {
    const response = await api.get<any, ApiResponse<DashboardMetrics>>('/analytics/dashboard');
    return response.data;
  },

  getPatientGrowth: async (params?: any) => {
    const response = await api.get<any, ApiResponse<PatientGrowth[]>>('/analytics/patient-growth', { params });
    return response.data || [];
  },

  getRevenueByTreatment: async (params?: any) => {
    const response = await api.get<any, ApiResponse<RevenueByTreatment[]>>('/analytics/revenue-by-treatment', { params });
    return response.data || [];
  },

  getPatientsByDoctor: async () => {
    const response = await api.get<any, ApiResponse<PatientsByDoctor[]>>('/analytics/patients-by-doctor');
    return response.data || [];
  },

  getDiseases: async () => {
    const response = await api.get<any, ApiResponse<DiseaseStats[]>>('/analytics/diseases');
    return response.data || [];
  },
};
