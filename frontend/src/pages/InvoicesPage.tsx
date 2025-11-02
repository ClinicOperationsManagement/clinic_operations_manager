import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { invoiceService } from '../services/invoice.service';
import { patientService } from '../services/patient.service';
import type { Invoice } from '../types';

const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientTreatments, setPatientTreatments] = useState<any[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState({ paidAmount: '', notes: '' });

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invoicesRes = await invoiceService.getInvoices({ page: page + 1, limit: rowsPerPage });
      setInvoices(invoicesRes.data || []);
      setTotal(invoicesRes.total || 0);

      if (user?.role !== 'dentist') {
        const patientsRes = await patientService.getPatients({ limit: 1000 });
        setPatients(patientsRes.data || []);
      }
      setError('');
    } catch (err: any) {
      setError(err.error || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patientId: string) => {
    setSelectedPatient(patientId);
    setSelectedTreatments([]);
    try {
      const treatments = await patientService.getPatientTreatments(patientId);
      setPatientTreatments(treatments);
    } catch (err: any) {
      setError(err.error || 'Failed to load patient treatments');
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await invoiceService.createInvoice({ patientId: selectedPatient, treatmentIds: selectedTreatments });
      setCreateModalOpen(false);
      setSelectedPatient('');
      setSelectedTreatments([]);
      fetchData();
    } catch (err: any) {
      setError(err.error || 'Failed to create invoice');
    }
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      await invoiceService.updateInvoice(selectedInvoice._id, {
        paidAmount: parseFloat(editFormData.paidAmount),
        notes: editFormData.notes,
      });
      setEditModalOpen(false);
      setSelectedInvoice(null);
      fetchData();
    } catch (err: any) {
      setError(err.error || 'Failed to update invoice');
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const fullInvoice = await invoiceService.getInvoiceById(invoice._id);
      setSelectedInvoice(fullInvoice);
      setViewModalOpen(true);
    } catch (err: any) {
      setError(err.error || 'Failed to load invoice details');
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditFormData({
      paidAmount: invoice.paidAmount.toString(),
      notes: invoice.notes || '',
    });
    setEditModalOpen(true);
  };

  const getTotalAmount = () =>
    patientTreatments
      .filter((t) => selectedTreatments.includes(t._id))
      .reduce((sum, t) => sum + t.cost, 0);

  const canCreate = user?.role === 'admin' || user?.role === 'receptionist';

  return (
    <Box
      p={4}
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box
        mb={4}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          borderRadius: 2,
          p: 3,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" fontWeight="600">
          Invoices Management
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'white',
              color: theme.palette.primary.main,
              fontWeight: 600,
              '&:hover': { backgroundColor: '#f4f4f4' },
            }}
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Invoice
          </Button>
        )}
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Table Section */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                  {['Invoice No', 'Date', 'Patient', 'Total', 'Paid', 'Status', 'Actions'].map(
                    (header) => (
                      <TableCell
                        key={header}
                        sx={{ color: 'white', fontWeight: 600 }}
                        align={header === 'Actions' ? 'center' : 'left'}
                      >
                        {header}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice._id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transition: '0.2s',
                      },
                    }}
                  >
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {typeof invoice.patientId === 'object'
                        ? invoice.patientId.name
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>₹{invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>₹{invoice.paidAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        size="small"
                        color={
                          invoice.status === 'paid'
                            ? 'success'
                            : invoice.status === 'partial'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </TableCell>

                    {/* --- Centered Action Buttons (View + Edit only) --- */}
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                        <Tooltip title="View Invoice" arrow>
                          <IconButton color="primary" onClick={() => handleViewInvoice(invoice)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>

                        {canCreate && (
                          <Tooltip title="Edit Invoice" arrow>
                            <IconButton color="secondary" onClick={() => handleEditInvoice(invoice)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    {/* -------------------------------------------- */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>
      )}

      {/* Create Invoice Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Invoice</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Select Patient *</InputLabel>
              <Select
                value={selectedPatient}
                onChange={(e) => handlePatientSelect(e.target.value)}
                label="Select Patient *"
              >
                {patients.map((patient) => (
                  <MenuItem key={patient._id} value={patient._id}>
                    {patient.name} - {patient.contact}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedPatient && patientTreatments.length > 0 && (
              <>
                <Typography variant="subtitle1">Select Treatments:</Typography>
                <List
                  sx={{
                    maxHeight: 300,
                    overflow: 'auto',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  {patientTreatments.map((treatment) => (
                    <ListItem
                      key={treatment._id}
                      dense
                      button
                      onClick={() =>
                        setSelectedTreatments((prev) =>
                          prev.includes(treatment._id)
                            ? prev.filter((id) => id !== treatment._id)
                            : [...prev, treatment._id]
                        )
                      }
                    >
                      <Checkbox checked={selectedTreatments.includes(treatment._id)} edge="start" />
                      <ListItemText
                        primary={treatment.treatmentType}
                        secondary={`${new Date(
                          treatment.treatmentDate
                        ).toLocaleDateString()} - ₹${treatment.cost.toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={2}
                  bgcolor="background.default"
                  borderRadius={1}
                >
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6">₹{getTotalAmount().toFixed(2)}</Typography>
                </Box>
              </>
            )}
            {selectedPatient && patientTreatments.length === 0 && (
              <Alert severity="info">No treatments found for this patient</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedPatient || selectedTreatments.length === 0}
            onClick={handleCreateInvoice}
          >
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Invoice Details</DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="h6">{selectedInvoice.invoiceNumber}</Typography>
              <Typography>
                <strong>Patient:</strong>{' '}
                {typeof selectedInvoice.patientId === 'object'
                  ? selectedInvoice.patientId.name
                  : 'Unknown'}
              </Typography>
              <Typography>
                <strong>Issue Date:</strong>{' '}
                {new Date(selectedInvoice.issueDate).toLocaleDateString()}
              </Typography>

              <Typography>
                <strong>Status:</strong>{' '}
                <Chip label={selectedInvoice.status} size="small" />
              </Typography>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Treatments:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Treatment</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(selectedInvoice.treatmentIds) &&
                      selectedInvoice.treatmentIds.map((treatment: any, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{treatment.treatmentType || 'Unknown'}</TableCell>
                          <TableCell>
                            {treatment.treatmentDate
                              ? new Date(treatment.treatmentDate).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            ₹{treatment.cost?.toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="space-between" p={2} bgcolor="background.default" borderRadius={1}>
                <Typography><strong>Total:</strong></Typography>
                <Typography>₹{selectedInvoice.totalAmount.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" px={2}>
                <Typography><strong>Paid:</strong></Typography>
                <Typography>₹{selectedInvoice.paidAmount.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" px={2}>
                <Typography><strong>Balance:</strong></Typography>
                <Typography color="error">
                  ₹{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)}
                </Typography>
              </Box>

              {selectedInvoice.notes && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Notes:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedInvoice.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Update Payment</DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography>Invoice: {selectedInvoice.invoiceNumber}</Typography>
              <Typography>Total: ₹{selectedInvoice.totalAmount.toFixed(2)}</Typography>

              <TextField
                label="Paid Amount"
                type="number"
                value={editFormData.paidAmount}
                onChange={(e) => setEditFormData({ ...editFormData, paidAmount: e.target.value })}
                helperText={`Maximum: ₹${selectedInvoice.totalAmount.toFixed(2)}`}
              />
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateInvoice}
            variant="contained"
            disabled={
              !editFormData.paidAmount ||
              parseFloat(editFormData.paidAmount) > (selectedInvoice?.totalAmount || 0)
            }
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoicesPage;
