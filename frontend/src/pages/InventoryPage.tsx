import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  TablePagination,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Build as BuildIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import inventoryService, { InventoryItem, InventoryStats, InventoryFilters } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';

interface InventoryFormData {
  name: string;
  category: string;
  status: string;
  purchaseDate: string;
  purchasePrice: string;
  currentValue: string;
  location: string;
  serialNumber: string;
  warrantyExpiry: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  notes: string;
  assignedTo: string;
}

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    category: '',
    status: 'working',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    location: '',
    serialNumber: '',
    warrantyExpiry: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    notes: '',
    assignedTo: '',
  });

  const [maintenanceData, setMaintenanceData] = useState({
    cost: '',
    description: '',
    type: 'maintenance',
    nextMaintenanceDate: '',
    warrantyInformation: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Categories and statuses
  const categories = ['equipment', 'tools', 'consumables', 'furniture'];
  const statuses = ['working', 'needs_maintenance', 'damaged', 'retired'];
  const statusesFilter = [
    { value: 'working', label: 'Working', color: '#4caf50' },
    { value: 'needs_maintenance', label: 'Needs Maintenance', color: '#ff9800' },
    { value: 'damaged', label: 'Damaged', color: '#f44336' },
    { value: 'retired', label: 'Retired', color: '#9e9e9e' },
  ];

  useEffect(() => {
    fetchStats();
    fetchInventory();
  }, [filters, searchTerm]);

  const fetchStats = async () => {
    try {
      const response = await inventoryService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const currentFilters = {
        ...filters,
        search: searchTerm || undefined,
      };
      const response = await inventoryService.getInventory(currentFilters);
      if (response.success) {
        setInventory(response.data.inventory);
        setTotalItems(response.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: parseInt(event.target.value), page: 1 }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItems(inventory.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const validation = inventoryService.validateInventoryData(formData);
      if (!validation.isValid) {
        setFormErrors(validation.errors.reduce((acc, err, index) => {
          acc[`field_${index}`] = err;
          return acc;
        }, {} as Record<string, string>));
        return;
      }

      const submitData = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice),
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
      };

      if (selectedItem) {
        await inventoryService.updateInventory(selectedItem._id, submitData);
      } else {
        await inventoryService.createInventory(submitData);
      }

      setFormDialogOpen(false);
      resetForm();
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      setError(err.error || 'Failed to save inventory item');
    }
  };

  const handleMaintenanceSubmit = async () => {
    if (!selectedItem) return;

    try {
      const data = {
        cost: maintenanceData.cost ? parseFloat(maintenanceData.cost) : undefined,
        description: maintenanceData.description,
        type: maintenanceData.type as 'maintenance' | 'repair',
        nextMaintenanceDate: maintenanceData.nextMaintenanceDate || undefined,
        warrantyInformation: maintenanceData.warrantyInformation || undefined,
      };

      await inventoryService.recordMaintenance(selectedItem._id, data);
      setMaintenanceDialogOpen(false);
      resetMaintenanceForm();
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      setError(err.error || 'Failed to record maintenance');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await inventoryService.deleteInventory(id);
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      setError(err.error || 'Failed to delete inventory item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      status: 'working',
      purchaseDate: '',
      purchasePrice: '',
      currentValue: '',
      location: '',
      serialNumber: '',
      warrantyExpiry: '',
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      notes: '',
      assignedTo: '',
    });
    setFormErrors({});
    setSelectedItem(null);
  };

  const resetMaintenanceForm = () => {
    setMaintenanceData({
      cost: '',
      description: '',
      type: 'maintenance',
      nextMaintenanceDate: '',
      warrantyInformation: '',
    });
    setSelectedItem(null);
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      status: item.status,
      purchaseDate: new Date(item.purchaseDate).toISOString().split('T')[0],
      purchasePrice: item.purchasePrice.toString(),
      currentValue: item.currentValue?.toString() || '',
      location: item.location,
      serialNumber: item.serialNumber || '',
      warrantyExpiry: item.warrantyExpiry ? new Date(item.warrantyExpiry).toISOString().split('T')[0] : '',
      lastMaintenanceDate: item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate).toISOString().split('T')[0] : '',
      nextMaintenanceDate: item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toISOString().split('T')[0] : '',
      notes: item.notes || '',
      assignedTo: item.assignedTo?._id || '',
    });
    setFormDialogOpen(true);
  };

  const openMaintenanceDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setMaintenanceDialogOpen(true);
  };

  // Stats Card Component
  const StatsCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(145deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${alpha(color, 0.25)}`,
          },
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" fontWeight={600} color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                backgroundColor: alpha(color, 0.1),
                color: color,
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading && !inventory.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !inventory.length) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        p: 3,
      }}
    >
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Inventory Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage clinic equipment, tools, and supplies efficiently
        </Typography>
      </Box>

      {/* Main Content - 50/50 Split Layout */}
      <Grid container spacing={3}>
        {/* Left Side - Dashboard Stats */}
        <Grid item xs={12} lg={6}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <StatsCard
                title="Total Value"
                value={inventoryService.formatCurrency(stats?.totalValue || 0)}
                icon={<InventoryIcon />}
                color={theme.palette.primary.main}
                subtitle="All inventory items"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatsCard
                title="Working Items"
                value={stats?.statusCounts?.working || 0}
                icon={<CheckCircleIcon />}
                color="#4caf50"
                subtitle="Operational equipment"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatsCard
                title="Maintenance Due"
                value={stats?.maintenanceDue || 0}
                icon={<BuildIcon />}
                color="#ff9800"
                subtitle="Requires attention"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatsCard
                title="Damaged Items"
                value={stats?.statusCounts?.damaged || 0}
                icon={<ErrorIcon />}
                color="#f44336"
                subtitle="Needs repair"
              />
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetForm();
                      setFormDialogOpen(true);
                    }}
                    sx={{ py: 1.5 }}
                  >
                    Add Item
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<BuildIcon />}
                    onClick={() => {
                      const dueItems = stats?.maintenanceDueItems || [];
                      if (dueItems.length > 0) {
                        openMaintenanceDialog(dueItems[0]);
                      }
                    }}
                    disabled={!stats?.maintenanceDue}
                    sx={{ py: 1.5 }}
                  >
                    Schedule Maintenance
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      // Implement export functionality
                      console.log('Export inventory');
                    }}
                    sx={{ py: 1.5 }}
                  >
                    Export List
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AssignmentIcon />}
                    onClick={() => {
                      // Implement reports functionality
                      console.log('Generate reports');
                    }}
                    sx={{ py: 1.5 }}
                  >
                    Generate Reports
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Inventory Table */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              {/* Search and Filter Bar */}
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                  sx={{ minWidth: 200, flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                  size="small"
                >
                  Filter
                </Button>
              </Box>

              {/* Inventory Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedItems.length > 0 && selectedItems.length < inventory.length}
                          checked={inventory.length > 0 && selectedItems.length === inventory.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : inventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No inventory items found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventory.map((item) => (
                        <TableRow key={item._id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedItems.includes(item._id)}
                              onChange={() => handleSelectItem(item._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {item.name}
                              </Typography>
                              {item.serialNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  S/N: {item.serialNumber}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.category}
                              size="small"
                              sx={{
                                backgroundColor: alpha(inventoryService.getCategoryColor(item.category), 0.1),
                                color: inventoryService.getCategoryColor(item.category),
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusesFilter.find(s => s.value === item.status)?.label || item.status}
                              size="small"
                              sx={{
                                backgroundColor: alpha(inventoryService.getStatusColor(item.status), 0.1),
                                color: inventoryService.getStatusColor(item.status),
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.location}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {inventoryService.formatCurrency(item.currentValue || item.purchasePrice)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setSelectedItem(item);
                                setActionMenuAnchor(e.currentTarget);
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalItems}
                rowsPerPage={filters.limit || 10}
                page={(filters.page || 1) - 1}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        <MenuItem onClick={() => setFilterMenuAnchor(null)}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category || ''}
              label="Category"
              onChange={(e) => {
                handleFilterChange({ category: e.target.value });
                setFilterMenuAnchor(null);
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
        <MenuItem onClick={() => setFilterMenuAnchor(null)}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              label="Status"
              onChange={(e) => {
                handleFilterChange({ status: e.target.value });
                setFilterMenuAnchor(null);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (selectedItem) {
              openEditDialog(selectedItem);
              setActionMenuAnchor(null);
            }
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedItem) {
              openMaintenanceDialog(selectedItem);
              setActionMenuAnchor(null);
            }
          }}
        >
          <BuildIcon sx={{ mr: 1 }} fontSize="small" />
          Record Maintenance
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedItem) {
              handleDeleteItem(selectedItem._id);
              setActionMenuAnchor(null);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Form Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          {selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Price"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Value"
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained">
            {selectedItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog
        open={maintenanceDialogOpen}
        onClose={() => setMaintenanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Record Maintenance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={maintenanceData.type}
                  label="Type"
                  onChange={(e) => setMaintenanceData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={maintenanceData.description}
                onChange={(e) => setMaintenanceData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost"
                type="number"
                value={maintenanceData.cost}
                onChange={(e) => setMaintenanceData(prev => ({ ...prev, cost: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next Maintenance Date"
                type="date"
                value={maintenanceData.nextMaintenanceDate}
                onChange={(e) => setMaintenanceData(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMaintenanceSubmit} variant="contained">
            Record Maintenance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default InventoryPage;