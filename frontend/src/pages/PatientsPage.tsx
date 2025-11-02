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
  Menu,
  MenuItem,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patient.service';
import type { Patient } from '../types';

const PatientsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchPatients();
  }, [page, rowsPerPage, search]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getPatients({
        search,
        page: page + 1,
        limit: rowsPerPage,
      });
      setPatients(response.data || []);
      setTotal(response.total || 0);
      setError('');
    } catch (err: any) {
      setError(err.error || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
      setSelectedPatient(patient);
      setFormData(patient);
    } else {
      setSelectedPatient(null);
      setFormData({});
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
    setFormData({});
  };

  const handleSave = async () => {
    try {
      if (selectedPatient) {
        await patientService.updatePatient(selectedPatient._id, formData);
      } else {
        await patientService.createPatient(formData);
      }
      handleCloseModal();
      fetchPatients();
    } catch (err: any) {
      setError(err.error || 'Failed to save patient');
    }
  };

  const handleDelete = async () => {
    if (selectedPatient) {
      try {
        await patientService.deletePatient(selectedPatient._id);
        setDeleteDialogOpen(false);
        setSelectedPatient(null);
        fetchPatients();
      } catch (err: any) {
        setError(err.error || 'Failed to delete patient');
      }
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await patientService.exportPatients(format);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `patients.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.error || 'Failed to export patients');
    }
    setExportAnchor(null);
  };

  const canEdit = user?.role === 'admin' || user?.role === 'receptionist';
  const canDelete = user?.role === 'admin';

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Patients
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              ':hover': { boxShadow: 3 },
            }}
          >
            Export
          </Button>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                background: theme.palette.primary.main,
                ':hover': { boxShadow: 4 },
              }}
            >
              Add Patient
            </Button>
          )}
        </Box>
      </Box>

      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>Export as Excel</MenuItem>
      </Menu>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        placeholder="Search patients by name, contact, or email"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        sx={{ mb: 2, borderRadius: 2, background: theme.palette.background.paper }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead sx={{ background: theme.palette.primary.light }}>
                <TableRow>
                  {['Name', 'Age', 'Gender', 'Contact', 'Email', 'Registered Date', 'Actions'].map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.common.white,
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow
                    key={patient._id}
                    sx={{
                      transition: 'all 0.2s',
                      ':hover': { backgroundColor: theme.palette.action.hover },
                    }}
                  >
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.age || 'N/A'}</TableCell>
                    <TableCell>
                      {patient.gender ? (
                        <Chip label={patient.gender} size="small" color="primary" />
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{patient.contact}</TableCell>
                    <TableCell>{patient.email || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => navigate(`/patients/${patient._id}`)}>
                        <ViewIcon />
                      </IconButton>
                      {canEdit && (
                        <IconButton size="small" onClick={() => handleOpenModal(patient)}>
                          <EditIcon />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPatient(patient);
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
            sx={{ mt: 2 }}
          />
        </>
      )}

      {/* Add/Edit Patient Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedPatient ? 'Edit Patient' : 'Add New Patient'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name *"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Gender"
                select
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                sx={{ flex: 1 }}
                SelectProps={{ native: true }}
              >
                <option value=""></option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </TextField>
            </Box>
            {/* Additional fields remain the same */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.contact}
          >
            {selectedPatient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Patient</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedPatient?.name}? This will also delete all
            related appointments, treatments, invoices, and files.
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

export default PatientsPage;
