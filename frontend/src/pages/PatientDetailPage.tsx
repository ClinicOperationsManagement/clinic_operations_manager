import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
} from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { patientService } from '../services/patient.service';
import type { Patient } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const patientData = await patientService.getPatientById(id!);
      setPatient(patientData);
      setError('');
    } catch (err: any) {
      setError(err.error || 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const data = await patientService.getPatientAppointments(id!);
      setAppointments(data);
    } catch {}
  };
  const fetchTreatments = async () => {
    try {
      const data = await patientService.getPatientTreatments(id!);
      setTreatments(data);
    } catch {}
  };
  const fetchInvoices = async () => {
    try {
      const data = await patientService.getPatientInvoices(id!);
      setInvoices(data);
    } catch {}
  };
  const fetchFiles = async () => {
    try {
      const data = await patientService.getPatientFiles(id!);
      setFiles(data);
    } catch {}
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1 && appointments.length === 0) fetchAppointments();
    if (newValue === 2 && treatments.length === 0) fetchTreatments();
    if (newValue === 3 && invoices.length === 0) fetchInvoices();
    if (newValue === 4 && files.length === 0) fetchFiles();
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  if (error || !patient)
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Patient not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/patients')} sx={{ mt: 2 }}>
          Back to Patients
        </Button>
      </Box>
    );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/patients')} sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 1 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight={700}>{patient.name}</Typography>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 2 }}>
          Edit
        </Button>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab label="Patient Information" />
        <Tab label="Appointments" />
        <Tab label="Treatments" />
        <Tab label="Invoices" />
        <Tab label="Files" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={700}>Personal Information</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Name:</strong> {patient.name}</Typography>
                  <Typography><strong>Age:</strong> {patient.age || 'N/A'}</Typography>
                  <Typography><strong>Gender:</strong> {patient.gender || 'N/A'}</Typography>
                  <Typography><strong>Contact:</strong> {patient.contact}</Typography>
                  <Typography><strong>Email:</strong> {patient.email || 'N/A'}</Typography>
                  <Typography><strong>Address:</strong> {patient.address || 'N/A'}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={700}>Medical Information</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Weight:</strong> {patient.weight ? `${patient.weight} kg` : 'N/A'}</Typography>
                  <Typography><strong>Height:</strong> {patient.height ? `${patient.height} cm` : 'N/A'}</Typography>
                  <Typography><strong>Blood Pressure:</strong> {patient.bloodPressure || 'N/A'}</Typography>
                  <Typography><strong>Temperature:</strong> {patient.temperature ? `${patient.temperature}°C` : 'N/A'}</Typography>
                  <Typography><strong>Medical History:</strong></Typography>
                  <Typography variant="body2" color="text.secondary">{patient.medicalHistory || 'No medical history recorded'}</Typography>
                  {patient.diseases?.length > 0 && (
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                      {patient.diseases.map((disease, i) => (
                        <Chip key={i} label={disease} size="small" color="primary" />
                      ))}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ background: theme.palette.primary.main }}>
              <TableRow>
                {['Date & Time', 'Doctor', 'Status', 'Notes'].map((head) => (
                  <TableCell key={head} sx={{ fontWeight: 700, color: 'white' }}>{head}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No appointments found</TableCell>
                </TableRow>
              ) : appointments.map((appt) => (
                <TableRow key={appt._id} sx={{ ':hover': { backgroundColor: theme.palette.action.hover } }}>
                  <TableCell>{new Date(appt.startTime).toLocaleString()}</TableCell>
                  <TableCell>{appt.doctorId?.name || 'Unknown'}</TableCell>
                  <TableCell><Chip label={appt.status} size="small" color="primary" /></TableCell>
                  <TableCell>{appt.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ background: theme.palette.primary.main }}>
              <TableRow>
                {['Date', 'Treatment Type', 'Doctor', 'Cost', 'Description'].map((head) => (
                  <TableCell key={head} sx={{ fontWeight: 700, color: 'white' }}>{head}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {treatments.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No treatments found</TableCell></TableRow>
              ) : treatments.map((treatment) => (
                <TableRow key={treatment._id} sx={{ ':hover': { backgroundColor: theme.palette.action.hover } }}>
                  <TableCell>{new Date(treatment.treatmentDate).toLocaleDateString()}</TableCell>
                  <TableCell>{treatment.treatmentType}</TableCell>
                  <TableCell>{treatment.doctorId?.name || 'Unknown'}</TableCell>
                  <TableCell>${treatment.cost.toFixed(2)}</TableCell>
                  <TableCell>{treatment.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ background: theme.palette.primary.main }}>
              <TableRow>
                {['Invoice Number', 'Date', 'Total Amount', 'Paid Amount', 'Status'].map((head) => (
                  <TableCell key={head} sx={{ fontWeight: 700, color: 'white' }}>{head}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No invoices found</TableCell></TableRow>
              ) : invoices.map((invoice) => (
                <TableRow key={invoice._id} sx={{ ':hover': { backgroundColor: theme.palette.action.hover } }}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>${invoice.paidAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      size="small"
                      color={
                        invoice.status === 'paid' ? 'success' :
                        invoice.status === 'partial' ? 'warning' :
                        invoice.status === 'pending' ? 'default' : 'error'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Typography variant="body2" color="text.secondary">
          File management interface to be implemented. This will show uploaded prescriptions, scans, and reports.
        </Typography>
      </TabPanel>
    </Box>
  );
};

export default PatientDetailPage;
