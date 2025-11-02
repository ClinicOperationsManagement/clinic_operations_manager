import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { treatmentService } from '../services/treatment.service';
import { patientService } from '../services/patient.service';
import { userService } from '../services/user.service';
import type { Treatment } from '../types';

const TreatmentsPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  const [formData, setFormData] = useState<any>({
    patientId: '',
    doctorId: '',
    treatmentType: '',
    description: '',
    cost: '',
    disease: '',
    treatmentDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchInitialData();
  }, [page, rowsPerPage]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const treatmentsRes = await treatmentService.getTreatments({
        page: page + 1,
        limit: rowsPerPage,
      });
      setTreatments(treatmentsRes.data || []);
      setTotal(treatmentsRes.total || 0);

      const patientsRes = await patientService.getPatients({ limit: 1000 });
      setPatients(patientsRes.data || []);

      if (user?.role === 'admin') {
        const doctorsRes = await userService.getUsers({ role: 'dentist', limit: 100 });
        setDoctors(doctorsRes.data || []);
      } else if (user?.role === 'dentist') {
        setDoctors([user]);
      }
      setError('');
    } catch (err: any) {
      setError(err.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (treatment?: Treatment) => {
    if (treatment) {
      setSelectedTreatment(treatment);
      setFormData({
        patientId: typeof treatment.patientId === 'string' ? treatment.patientId : treatment.patientId._id,
        doctorId: typeof treatment.doctorId === 'string' ? treatment.doctorId : treatment.doctorId._id,
        treatmentType: treatment.treatmentType,
        description: treatment.description || '',
        cost: treatment.cost.toString(),
        disease: treatment.disease || '',
        treatmentDate: new Date(treatment.treatmentDate).toISOString().split('T')[0],
      });
    } else {
      setSelectedTreatment(null);
      setFormData({
        patientId: '',
        doctorId: user?.role === 'dentist' ? user._id : '',
        treatmentType: '',
        description: '',
        cost: '',
        disease: '',
        treatmentDate: new Date().toISOString().split('T')[0],
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTreatment(null);
  };

  const handleSave = async () => {
    try {
      const treatmentData = { ...formData, cost: parseFloat(formData.cost) };
      if (selectedTreatment) {
        await treatmentService.updateTreatment(selectedTreatment._id, treatmentData);
      } else {
        await treatmentService.createTreatment(treatmentData);
      }
      handleCloseModal();
      fetchInitialData();
    } catch (err: any) {
      setError(err.error || 'Failed to save treatment');
    }
  };

  const handleDelete = async () => {
    if (selectedTreatment) {
      try {
        await treatmentService.deleteTreatment(selectedTreatment._id);
        setDeleteDialogOpen(false);
        setSelectedTreatment(null);
        fetchInitialData();
      } catch (err: any) {
        setError(err.error || 'Failed to delete treatment');
      }
    }
  };

  const handleViewDetails = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setViewModalOpen(true);
  };

  const canDelete = user?.role === 'admin';

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
          Treatments Management
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'white',
            color: theme.palette.primary.main,
            '&:hover': { backgroundColor: '#f4f4f4' },
            fontWeight: 600,
          }}
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          Add Treatment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

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
                  {['Date', 'Patient', 'Doctor', 'Treatment Type', 'Cost', 'Disease', 'Actions'].map(
                    (header) => (
                      <TableCell
                        key={header}
                        sx={{
                          color: 'white',
                          fontWeight: 600,
                          textAlign: header === 'Actions' ? 'center' : 'left',
                        }}
                      >
                        {header}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {treatments.map((treatment) => (
                  <TableRow
                    key={treatment._id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transition: '0.2s',
                      },
                    }}
                  >
                    <TableCell>{new Date(treatment.treatmentDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {typeof treatment.patientId === 'object' ? treatment.patientId.name : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {typeof treatment.doctorId === 'object'
                        ? `Dr. ${treatment.doctorId.name}`
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>{treatment.treatmentType}</TableCell>
                    <TableCell>
                      ₹{treatment.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{treatment.disease || '-'}</TableCell>

                    {/* Centered action buttons with tooltips */}
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton color="primary" onClick={() => handleViewDetails(treatment)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit Treatment">
                        <IconButton color="secondary" onClick={() => handleOpenModal(treatment)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      {canDelete && (
                        <Tooltip title="Delete Treatment">
                          <IconButton
                            color="error"
                            onClick={() => {
                              setSelectedTreatment(treatment);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {selectedTreatment ? 'Edit Treatment' : 'Add New Treatment'}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Patient *</InputLabel>
              <Select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient._id} value={patient._id}>
                    {patient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Doctor *</InputLabel>
              <Select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                disabled={user?.role === 'dentist'}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Treatment Type *"
              value={formData.treatmentType}
              onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
              placeholder="e.g., Root Canal, Filling, Cleaning"
            />

            <TextField
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <TextField
              label="Cost * (₹)"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />

            <TextField
              label="Disease/Condition"
              value={formData.disease}
              onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
            />

            <TextField
              label="Treatment Date *"
              type="date"
              value={formData.treatmentDate}
              onChange={(e) => setFormData({ ...formData, treatmentDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.patientId || !formData.doctorId || !formData.treatmentType || !formData.cost}
          >
            {selectedTreatment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Modal */}
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Treatment Details</DialogTitle>
        <DialogContent dividers>
          {selectedTreatment && (
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Typography>
                <strong>Patient:</strong>{' '}
                {typeof selectedTreatment.patientId === 'object'
                  ? selectedTreatment.patientId.name
                  : 'Unknown'}
              </Typography>
              <Typography>
                <strong>Doctor:</strong>{' '}
                {typeof selectedTreatment.doctorId === 'object'
                  ? `Dr. ${selectedTreatment.doctorId.name}`
                  : 'Unknown'}
              </Typography>
              <Typography>
                <strong>Type:</strong> {selectedTreatment.treatmentType}
              </Typography>
              <Typography>
                <strong>Cost:</strong>{' '}
                ₹{selectedTreatment.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography>
                <strong>Date:</strong>{' '}
                {new Date(selectedTreatment.treatmentDate).toLocaleDateString()}
              </Typography>
              {selectedTreatment.disease && (
                <Typography>
                  <strong>Disease:</strong> {selectedTreatment.disease}
                </Typography>
              )}
              {selectedTreatment.description && (
                <>
                  <Typography>
                    <strong>Description:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTreatment.description}
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

      {/* Delete Confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={600}>Delete Treatment</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this treatment record?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TreatmentsPage;
