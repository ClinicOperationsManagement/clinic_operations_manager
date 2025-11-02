import api from './api';
import type { Invoice, ApiResponse } from '../types';

export const invoiceService = {
  getInvoices: async (params?: any) => {
    const response = await api.get<any, ApiResponse<Invoice[]>>('/invoices', { params });
    return response;
  },

  getInvoiceById: async (id: string) => {
    const response = await api.get<any, ApiResponse<{ invoice: Invoice }>>(`/invoices/${id}`);
    return response.data?.invoice;
  },

  createInvoice: async (invoiceData: any) => {
    const response = await api.post<any, ApiResponse<{ invoice: Invoice }>>('/invoices', invoiceData);
    return response.data?.invoice;
  },

  updateInvoice: async (id: string, invoiceData: Partial<Invoice>) => {
    const response = await api.put<any, ApiResponse<{ invoice: Invoice }>>(`/invoices/${id}`, invoiceData);
    return response.data?.invoice;
  },

  deleteInvoice: async (id: string) => {
    await api.delete(`/invoices/${id}`);
  },

  downloadPDF: async (id: string) => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response;
  },
};
