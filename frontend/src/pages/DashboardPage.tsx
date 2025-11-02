import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  CurrencyRupee as RupeeIcon,
  CalendarMonth as CalendarIcon,
  Event as EventIcon,
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { DashboardMetrics, ApiResponse } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.get<any, ApiResponse<DashboardMetrics>>('/analytics/dashboard');
      if (response.success && response.data) {
        setMetrics(response.data);
      } else {
        setError(response.error || 'Failed to load dashboard metrics');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'primary' | 'success' | 'info' | 'warning';
  }) => (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        background: `linear-gradient(145deg, ${theme.palette[color].light}33 0%, ${theme.palette[color].main}22 100%)`,
        transition: 'transform 0.3s, box-shadow 0.3s',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: 10,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: theme.palette[color].main,
              color: theme.palette.common.white,
              borderRadius: '50%',
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 70,
              minHeight: 70,
              boxShadow: `0px 4px 12px ${theme.palette[color].main}88`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      p={3}
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        transition: 'all 0.3s',
      }}
    >
      {/* Topbar-compatible header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, {user?.name}!
        </Typography>
      </Box>

      {/* Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Patients"
            value={metrics?.totalPatients || 0}
            icon={<PeopleIcon sx={{ fontSize: 42 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={`₹${metrics?.totalRevenue?.toFixed(2) || '0.00'}`}
            icon={<RupeeIcon sx={{ fontSize: 42 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Appointments"
            value={metrics?.totalAppointments || 0}
            icon={<CalendarIcon sx={{ fontSize: 42 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Upcoming Appointments"
            value={metrics?.upcomingAppointments || 0}
            icon={<EventIcon sx={{ fontSize: 42 }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Placeholder for charts / analytics */}
      <Box
        mt={4}
        p={3}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 3,
          boxShadow: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Charts and additional analytics will be displayed here. This layout uses gradients, hover effects, and card elevation for a clean, modern look.
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardPage;
