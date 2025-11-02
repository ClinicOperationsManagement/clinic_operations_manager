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

      // Fetch treatments
      const treatmentsRes = await treatmentService.getTreatments({
        page: page + 1,
        limit: rowsPerPage,
      });
      setTreatments(treatmentsRes.data || []);
      setTotal(treatmentsRes.total || 0);

      // Fetch patients
      const patientsRes = await patientService.getPatients({ limit: 1000 });
      setPatients(patientsRes.data || []);

      // Fetch doctors
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
      const treatmentData = {
        ...formData,
        cost: parseFloat(formData.cost),
      };

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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Treatments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          Add Treatment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Treatment Type</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Disease/Condition</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {treatments.map((treatment) => (
                  <TableRow key={treatment._id}>
                    <TableCell>
                      {new Date(treatment.treatmentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {typeof treatment.patientId === 'object' ? treatment.patientId.name : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {typeof treatment.doctorId === 'object' ? `Dr. ${treatment.doctorId.name}` : 'Unknown'}
                    </TableCell>
                    <TableCell>{treatment.treatmentType}</TableCell>
                    <TableCell>${treatment.cost.toFixed(2)}</TableCell>
                    <TableCell>{treatment.disease || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewDetails(treatment)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenModal(treatment)}>
                        <EditIcon />
                      </IconButton>
                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTreatment(treatment);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
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
        </>
      )}

      {/* Add/Edit Treatment Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTreatment ? 'Edit Treatment' : 'Add New Treatment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Patient *</InputLabel>
              <Select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                label="Patient *"
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
                label="Doctor *"
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
              label="Cost *"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              InputProps={{ startAdornment: '$' }}
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
        <DialogActions>
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

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Treatment Details</DialogTitle>
        <DialogContent>
          {selectedTreatment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Typography><strong>Patient:</strong> {typeof selectedTreatment.patientId === 'object' ? selectedTreatment.patientId.name : 'Unknown'}</Typography>
              <Typography><strong>Doctor:</strong> {typeof selectedTreatment.doctorId === 'object' ? `Dr. ${selectedTreatment.doctorId.name}` : 'Unknown'}</Typography>
              <Typography><strong>Treatment Type:</strong> {selectedTreatment.treatmentType}</Typography>
              <Typography><strong>Cost:</strong> ${selectedTreatment.cost.toFixed(2)}</Typography>
              <Typography><strong>Date:</strong> {new Date(selectedTreatment.treatmentDate).toLocaleDateString()}</Typography>
              {selectedTreatment.disease && (
                <Typography><strong>Disease/Condition:</strong> {selectedTreatment.disease}</Typography>
              )}
              {selectedTreatment.description && (
                <>
                  <Typography><strong>Description:</strong></Typography>
                  <Typography variant="body2" color="text.secondary">{selectedTreatment.description}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Treatment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this treatment record?
          </Typography>
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
