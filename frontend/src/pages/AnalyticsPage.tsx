import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  ButtonGroup,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { analyticsService } from '../services/analytics.service';
import { useAuth } from '../context/AuthContext';
import EnhancedPieChart from '../components/charts/EnhancedPieChart';
import InteractiveBarChart from '../components/charts/InteractiveBarChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import RealtimeDashboard from '../components/charts/RealtimeDashboard';
import AnimatedContainer from '../components/common/AnimatedContainer';
import EnhancedCard from '../components/common/EnhancedCard';
import { LoadingStates } from '../components/common/LoadingStates';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const [patientGrowth, setPatientGrowth] = useState<any[]>([]);
  const [revenueByTreatment, setRevenueByTreatment] = useState<any[]>([]);
  const [patientsByDoctor, setPatientsByDoctor] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const growthData = await analyticsService.getPatientGrowth({ period });
      setPatientGrowth(growthData);

      const revenueData = await analyticsService.getRevenueByTreatment();
      setRevenueByTreatment(revenueData);

      if (user?.role === 'admin' || user?.role === 'receptionist') {
        const doctorData = await analyticsService.getPatientsByDoctor();
        setPatientsByDoctor(doctorData);

        const diseaseData = await analyticsService.getDiseases();
        setDiseases(diseaseData.slice(0, 10));
      }

      setError('');
    } catch (err: any) {
      setError(err.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Transform data for enhanced charts
  const transformPatientGrowthData = () => {
    return patientGrowth.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString(),
    }));
  };

  const transformRevenueData = () => {
    return revenueByTreatment.map(item => ({
      name: item.treatmentType,
      value: item.totalRevenue,
      description: `${item.count} treatments`,
      percentage: (item.totalRevenue / revenueByTreatment.reduce((sum, r) => sum + r.totalRevenue, 0)) * 100,
    }));
  };

  const transformDoctorData = () => {
    return patientsByDoctor.map(item => ({
      name: `Dr. ${item.doctorName}`,
      value: item.patientCount,
      description: `${item.patientCount} patients`,
    }));
  };

  const transformDiseaseData = () => {
    return diseases.map(item => ({
      name: item.disease,
      value: item.count,
      description: `${item.count} cases`,
    }));
  };

  // KPI data for real-time dashboard
  const kpiWidgets = [
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      type: 'kpi' as const,
      value: revenueByTreatment.reduce((sum, item) => sum + item.totalRevenue, 0),
      format: 'currency' as const,
      trend: 'up' as const,
      unit: '',
    },
    {
      id: 'total-patients',
      title: 'Total Patients',
      type: 'kpi' as const,
      value: patientGrowth.reduce((sum, item) => sum + item.count, 0),
      format: 'number' as const,
      trend: 'up' as const,
    },
    {
      id: 'treatments',
      title: 'Total Treatments',
      type: 'kpi' as const,
      value: revenueByTreatment.reduce((sum, item) => sum + item.count, 0),
      format: 'number' as const,
      trend: 'stable' as const,
    },
    {
      id: 'avg-revenue',
      title: 'Avg. Revenue per Patient',
      type: 'kpi' as const,
      value: revenueByTreatment.length > 0
        ? revenueByTreatment.reduce((sum, item) => sum + item.totalRevenue, 0) /
          revenueByTreatment.reduce((sum, item) => sum + item.count, 0)
        : 0,
      format: 'currency' as const,
      trend: 'up' as const,
    },
  ];

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

  const canViewAll = user?.role === 'admin' || user?.role === 'receptionist';

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Analytics & Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Welcome back, {user?.name}!
      </Typography>

      <Grid container spacing={3}>
        {/* Patient Growth */}
        <Grid item xs={12}>
          <CardWrapper>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Patient Growth Over Time</Typography>
              <ToggleButtonGroup
                value={period}
                exclusive
                onChange={(_, newPeriod) => newPeriod && setPeriod(newPeriod)}
                size="small"
              >
                <ToggleButton value="daily">Daily</ToggleButton>
                <ToggleButton value="weekly">Weekly</ToggleButton>
                <ToggleButton value="monthly">Monthly</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke={theme.palette.primary.main} name="New Patients" />
              </LineChart>
            </ResponsiveContainer>
          </CardWrapper>
        </Grid>

        {/* Revenue by Treatment */}
        <Grid item xs={12} md={6}>
          <CardWrapper>
            <Typography variant="h6" gutterBottom>
              Revenue by Treatment Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByTreatment}
                  dataKey="totalRevenue"
                  nameKey="treatmentType"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.treatmentType}: $${entry.totalRevenue.toFixed(0)}`}
                >
                  {revenueByTreatment.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardWrapper>
        </Grid>

        {/* Patients by Doctor */}
        {canViewAll && (
          <Grid item xs={12} md={6}>
            <CardWrapper>
              <Typography variant="h6" gutterBottom>
                Patients by Doctor
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={patientsByDoctor}
                    dataKey="patientCount"
                    nameKey="doctorName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `Dr. ${entry.doctorName}: ${entry.patientCount}`}
                  >
                    {patientsByDoctor.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardWrapper>
          </Grid>
        )}

        {/* Top Diseases */}
        {canViewAll && diseases.length > 0 && (
          <Grid item xs={12}>
            <CardWrapper>
              <Typography variant="h6" gutterBottom>
                Common Conditions (Top 10)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={diseases}
                    dataKey="count"
                    nameKey="disease"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.disease}: ${entry.count}`}
                  >
                    {diseases.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardWrapper>
          </Grid>
        )}

        {/* Summary Statistics */}
        <Grid item xs={12}>
          <CardWrapper>
            <Typography variant="h6" gutterBottom>
              Treatment Statistics
            </Typography>
            <Grid container spacing={2}>
              {revenueByTreatment.map((treatment, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    p={2}
                    borderRadius={2}
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      boxShadow: 2,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
                    }}
                  >
                    <Typography variant="subtitle2">{treatment.treatmentType}</Typography>
                    <Typography variant="h6" color="primary">
                      ${treatment.totalRevenue.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {treatment.count} treatments
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardWrapper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
