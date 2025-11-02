import api from './api';
import type { Appointment, ApiResponse } from '../types';

export const appointmentService = {
  getAppointments: async (params?: any) => {
    const response = await api.get<any, ApiResponse<Appointment[]>>('/appointments', { params });
    return response;
  },

  getCalendarAppointments: async (params?: any) => {
    const response = await api.get<any, ApiResponse<any[]>>('/appointments/calendar', { params });
    return response.data || [];
  },

  getAppointmentById: async (id: string) => {
    const response = await api.get<any, ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}`);
    return response.data?.appointment;
  },

  createAppointment: async (appointmentData: Partial<Appointment>) => {
    const response = await api.post<any, ApiResponse<{ appointment: Appointment }>>('/appointments', appointmentData);
    return response.data?.appointment;
  },

  updateAppointment: async (id: string, appointmentData: Partial<Appointment>) => {
    const response = await api.put<any, ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}`, appointmentData);
    return response.data?.appointment;
  },

  cancelAppointment: async (id: string) => {
    await api.delete(`/appointments/${id}`);
  },

  sendReminder: async (id: string) => {
    await api.post(`/appointments/${id}/reminder`);
  },
};
