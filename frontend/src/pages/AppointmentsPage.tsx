import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  FormControl,
  InputLabel,
  Select,
  ButtonGroup,
  useTheme,
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { appointmentService } from '../services/appointment.service';
import { patientService } from '../services/patient.service';
import { userService } from '../services/user.service';
import { useAuth } from '../context/AuthContext';

const AppointmentsPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const calendarRef = useRef<any>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const patientsRes = await patientService.getPatients({ limit: 1000 });
      setPatients(patientsRes.data || []);

      if (user?.role === 'admin' || user?.role === 'receptionist') {
        const usersRes = await userService.getUsers({ role: 'dentist', limit: 100 });
        setDoctors(usersRes.data || []);
      } else if (user?.role === 'dentist') {
        setDoctors([user]);
      }

      await fetchAppointments();
    } catch (err: any) {
      setError(err.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async (start?: Date, end?: Date) => {
    try {
      const params: any = {};
      if (start) params.start = start.toISOString();
      if (end) params.end = end.toISOString();

      const appointments = await appointmentService.getCalendarAppointments(params);
      const calendarEvents = appointments.map((appt: any) => ({
        id: appt.id,
        title: appt.title,
        start: appt.start,
        end: appt.end,
        backgroundColor: getColorForStatus(appt.extendedProps.status),
        borderColor: getColorForStatus(appt.extendedProps.status),
        extendedProps: {
          ...appt.extendedProps,
          patientName: appt.extendedProps.patientName,
          doctorName: appt.extendedProps.doctorName,
        },
      }));

      setEvents(calendarEvents);
    } catch (err: any) {
      setError(err.error || 'Failed to load appointments');
    }
  };

  const getColorForStatus = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'linear-gradient(135deg, #42a5f5, #1e88e5)';
      case 'completed':
        return 'linear-gradient(135deg, #66bb6a, #43a047)';
      case 'cancelled':
        return 'linear-gradient(135deg, #ef5350, #e53935)';
      case 'rescheduled':
        return 'linear-gradient(135deg, #ffa726, #fb8c00)';
      default:
        return '#bdbdbd';
    }
  };

  const handleDateClick = (arg: any) => {
    const startTime = new Date(arg.date);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(10, 0, 0, 0);

    setFormData({
      patientId: '',
      doctorId: user?.role === 'dentist' ? user._id : '',
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
      notes: '',
    });

    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;

    setSelectedEvent(event);
    setFormData({
      patientId: event.extendedProps.patientId,
      doctorId: event.extendedProps.doctorId,
      startTime: new Date(event.start).toISOString().slice(0, 16),
      endTime: new Date(event.end).toISOString().slice(0, 16),
      notes: event.extendedProps.notes || '',
    });

    setModalOpen(true);
  };

  const handleSaveAppointment = async () => {
    try {
      setError('');

      const appointmentData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        notes: formData.notes,
      };

      if (selectedEvent) {
        await appointmentService.updateAppointment(selectedEvent.id, appointmentData);
      } else {
        await appointmentService.createAppointment(appointmentData);
      }

      setModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      setError(err.error || 'Failed to save appointment');
    }
  };

  const handleCancelAppointment = async () => {
    if (selectedEvent) {
      try {
        await appointmentService.cancelAppointment(selectedEvent.id);
        setModalOpen(false);
        fetchAppointments();
      } catch (err: any) {
        setError(err.error || 'Failed to cancel appointment');
      }
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Appointments
        </Typography>
        <Button
          variant="contained"
          onClick={() => handleDateClick({ date: new Date() })}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
            background: 'linear-gradient(135deg, #42a5f5, #1e88e5)',
            '&:hover': { background: 'linear-gradient(135deg, #1e88e5, #1565c0)' },
          }}
        >
          New Appointment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Modern view toggle buttons */}
      <Box display="flex" justifyContent="flex-start" mb={1}>
        <ButtonGroup variant="contained" sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          {[
            { label: 'Month', view: 'dayGridMonth' },
            { label: 'Week', view: 'timeGridWeek' },
            { label: 'Day', view: 'timeGridDay' },
          ].map((btn) => (
            <Button
              key={btn.view}
              onClick={() => {
                setCurrentView(btn.view as any);
                calendarRef.current.getApi().changeView(btn.view);
              }}
              sx={{
                background: currentView === btn.view ? 'linear-gradient(135deg, #42a5f5, #1e88e5)' : '#e0e0e0',
                color: currentView === btn.view ? '#fff' : '#424242',
                fontWeight: 600,
                '&:hover': {
                  background:
                    currentView === btn.view ? 'linear-gradient(135deg, #1e88e5, #1565c0)' : '#d5d5d5',
                },
              }}
            >
              {btn.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Modern Calendar */}
      <Box
        sx={{
          height: '720px',
          p: 2,
          borderRadius: 3,
          boxShadow: 3,
          backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
          '& .fc-toolbar': {
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
            padding: 1,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          '& .fc-toolbar-title': {
            fontWeight: 700,
            fontSize: '1.5rem',
            color: theme.palette.mode === 'dark' ? '#fff' : '#333',
          },
          '& .fc-button': {
            borderRadius: 6,
            backgroundColor: '#1976d2',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            '&:hover': { backgroundColor: '#1565c0', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
          },
          '& .fc-timegrid-slot': {
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? '#333' : '#e0e0e0',
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fafafa',
          },
          '& .fc-timegrid-axis': { color: theme.palette.mode === 'dark' ? '#bbb' : '#616161', fontSize: '0.85rem', fontWeight: 500 },
          '& .fc-daygrid-day-top': { fontWeight: 600, fontSize: '0.9rem', color: theme.palette.mode === 'dark' ? '#eee' : '#424242', padding: '4px 0' },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '', // hide default buttons
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          height="100%"
          editable
          selectable
          eventContent={(arg) => {
            const { title, extendedProps, start, end } = arg.event;
            const patientInitials = extendedProps.patientName
              ? extendedProps.patientName.split(' ').map((n: string) => n[0]).join('')
              : '';
            const doctorInitials = extendedProps.doctorName
              ? extendedProps.doctorName.split(' ').map((n: string) => n[0]).join('')
              : '';
            const statusColorMap: any = {
              scheduled: theme.palette.info.main,
              completed: theme.palette.success.main,
              cancelled: theme.palette.error.main,
              rescheduled: theme.palette.warning.main,
            };
            const statusColor = statusColorMap[extendedProps.status] || theme.palette.grey[500];

            return (
              <Box
                sx={{
                  background: theme.palette.mode === 'dark' ? '#333' : arg.event.backgroundColor,
                  borderRadius: 2,
                  padding: '6px 10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.35)' },
                }}
              >
                <Typography noWrap>{title}</Typography>
                <Typography sx={{ fontSize: '0.7rem', opacity: 0.85 }}>
                  {start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Box sx={{ display: 'flex', mt: 0.5, gap: 1, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#fff',
                      color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #ccc',
                    }}
                  >
                    {patientInitials}
                  </Box>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#fff',
                      color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #ccc',
                    }}
                  >
                    {doctorInitials}
                  </Box>
                  <Box
                    sx={{
                      ml: 'auto',
                      px: 1,
                      py: 0.2,
                      borderRadius: 1,
                      backgroundColor: statusColor,
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {extendedProps.status}
                  </Box>
                </Box>
              </Box>
            );
          }}
        />
      </Box>

      {/* Appointment Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ fontWeight: 700, bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}
        >
          {selectedEvent ? 'Edit Appointment' : 'New Appointment'}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Patient *</InputLabel>
              <Select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                label="Patient *"
                sx={{ borderRadius: 2 }}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient._id} value={patient._id}>
                    {patient.name} - {patient.contact}
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
                sx={{ borderRadius: 2 }}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Start Time *"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ borderRadius: 2 }}
            />
            <TextField
              label="End Time *"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ borderRadius: 2 }}
            />
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {selectedEvent && (
            <Button onClick={handleCancelAppointment} color="error" sx={{ textTransform: 'none' }}>
              Cancel Appointment
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setModalOpen(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
          <Button
            onClick={handleSaveAppointment}
            variant="contained"
            disabled={!formData.patientId || !formData.doctorId || !formData.startTime || !formData.endTime}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #42a5f5, #1e88e5)',
              '&:hover': { background: 'linear-gradient(135deg, #1e88e5, #1565c0)' },
            }}
          >
            {selectedEvent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsPage;
