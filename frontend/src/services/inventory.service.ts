import api from './api';

export interface InventoryItem {
  _id: string;
  name: string;
  category: 'equipment' | 'tools' | 'consumables' | 'furniture';
  status: 'working' | 'needs_maintenance' | 'damaged' | 'retired';
  purchaseDate: string;
  purchasePrice: number;
  currentValue?: number;
  location: string;
  serialNumber?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  image?: string;
  specifications?: {
    brand?: string;
    model?: string;
    manufacturer?: string;
    year?: number;
    dimensions?: string;
    weight?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  _id: string;
  inventoryItem: InventoryItem;
  type: 'purchase' | 'maintenance' | 'repair' | 'disposal' | 'transfer' | 'upgrade' | 'depreciation';
  cost?: number;
  description: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  previousStatus?: string;
  newStatus?: string;
  previousLocation?: string;
  newLocation?: string;
  previousAssignedTo?: {
    _id: string;
    name: string;
  };
  newAssignedTo?: {
    _id: string;
    name: string;
  };
  vendor?: string;
  invoiceNumber?: string;
  warrantyInformation?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalValue: number;
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  maintenanceDue: number;
  maintenanceDueItems: InventoryItem[];
  recentTransactions: InventoryTransaction[];
}

export interface InventoryFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  location?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryResponse {
  success: boolean;
  data: {
    inventory: InventoryItem[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
      pages: number;
    };
  };
}

export interface InventoryDetailResponse {
  success: boolean;
  data: {
    inventory: InventoryItem;
    transactions: InventoryTransaction[];
  };
}

export interface CreateInventoryData {
  name: string;
  category: string;
  status?: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue?: number;
  location: string;
  serialNumber?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  assignedTo?: string;
  image?: string;
  specifications?: {
    brand?: string;
    model?: string;
    manufacturer?: string;
    year?: number;
    dimensions?: string;
    weight?: string;
  };
}

export interface UpdateInventoryData extends Partial<CreateInventoryData> {}

export interface MaintenanceData {
  cost?: number;
  description?: string;
  type?: 'maintenance' | 'repair';
  nextMaintenanceDate?: string;
  warrantyInformation?: string;
}

export interface ExpenseReportData {
  startDate: string;
  endDate: string;
  category?: string;
}

class InventoryService {
  // Get all inventory items with filtering and pagination
  async getInventory(filters: InventoryFilters = {}): Promise<InventoryResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return api.get(`/inventory?${params.toString()}`);
  }

  // Get single inventory item with transaction history
  async getInventoryById(id: string): Promise<InventoryDetailResponse> {
    return api.get(`/inventory/${id}`);
  }

  // Create new inventory item
  async createInventory(data: CreateInventoryData): Promise<{ success: boolean; data: InventoryItem }> {
    return api.post('/inventory', data);
  }

  // Update inventory item
  async updateInventory(id: string, data: UpdateInventoryData): Promise<{ success: boolean; data: InventoryItem }> {
    return api.put(`/inventory/${id}`, data);
  }

  // Delete/retire inventory item
  async deleteInventory(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete(`/inventory/${id}`);
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<{ success: boolean; data: InventoryStats }> {
    return api.get('/inventory/stats/dashboard');
  }

  // Record maintenance activity
  async recordMaintenance(id: string, data: MaintenanceData): Promise<{ success: boolean; data: InventoryItem; message: string }> {
    return api.post(`/inventory/${id}/maintenance`, data);
  }

  // Get items requiring maintenance
  async getMaintenanceDue(days: number = 30): Promise<{ success: boolean; data: InventoryItem[] }> {
    return api.get(`/inventory/maintenance-due?days=${days}`);
  }

  // Get expense reports
  async getExpenseReports(data: ExpenseReportData): Promise<{
    success: boolean;
    data: {
      purchaseReport: any[];
      maintenanceReport: any[];
    };
  }> {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return api.get(`/inventory/reports/expenses?${params.toString()}`);
  }

  // Utility methods for data formatting
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getStatusColor(status: string): string {
    const colors = {
      working: '#4caf50',
      needs_maintenance: '#ff9800',
      damaged: '#f44336',
      retired: '#9e9e9e'
    };
    return colors[status as keyof typeof colors] || '#9e9e9e';
  }

  getCategoryColor(category: string): string {
    const colors = {
      equipment: '#2196f3',
      tools: '#9c27b0',
      consumables: '#00bcd4',
      furniture: '#795548'
    };
    return colors[category as keyof typeof colors] || '#9e9e9e';
  }

  // Search and filter helpers
  buildSearchQuery(searchTerm: string): string {
    return searchTerm.trim();
  }

  validateInventoryData(data: CreateInventoryData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Item name must be at least 2 characters long');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    if (!data.purchaseDate) {
      errors.push('Purchase date is required');
    }

    if (!data.purchasePrice || data.purchasePrice <= 0) {
      errors.push('Purchase price must be greater than 0');
    }

    if (!data.location || data.location.trim().length < 2) {
      errors.push('Location must be at least 2 characters long');
    }

    if (data.currentValue && data.currentValue < 0) {
      errors.push('Current value cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Export functionality
  async exportInventory(format: 'csv' | 'pdf' = 'csv', filters: InventoryFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/inventory/export?${params.toString()}`, {
      responseType: 'blob'
    });

    return response;
  }

  // Image upload helper
  async uploadInventoryImage(file: File): Promise<{ success: boolean; data: { url: string } }> {
    const formData = new FormData();
    formData.append('image', file);

    return api.post('/inventory/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // Bulk operations
  async bulkUpdateStatus(ids: string[], status: string): Promise<{ success: boolean; updated: number }> {
    return api.put('/inventory/bulk-status', { ids, status });
  }

  async bulkAssign(ids: string[], assignedTo: string): Promise<{ success: boolean; updated: number }> {
    return api.put('/inventory/bulk-assign', { ids, assignedTo });
  }
}

export default new InventoryService();