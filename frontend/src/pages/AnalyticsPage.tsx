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
        <LoadingStates type="spinner" size="large" text="Loading analytics..." />
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
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        p: 3,
      }}
    >
      {/* Header */}
      <AnimatedContainer animation="fadeInDown">
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Analytics & Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back, {user?.name}! Here's your clinic's performance overview.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchAnalytics}
                size="small"
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                size="small"
              >
                Export
              </Button>
            </Box>
          </Box>

          {/* View Mode Selector */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              View Mode:
            </Typography>
            <ButtonGroup size="small">
              <Button
                variant={viewMode === 'overview' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('overview')}
                startIcon={<PieChartIcon />}
              >
                Overview
              </Button>
              <Button
                variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('detailed')}
                startIcon={<BarChartIcon />}
              >
                Detailed
              </Button>
              <Button
                variant={viewMode === 'trends' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('trends')}
                startIcon={<TimelineIcon />}
              >
                Trends
              </Button>
            </ButtonGroup>

            {/* Period Selector */}
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={(_, newPeriod) => newPeriod && setPeriod(newPeriod)}
              size="small"
              sx={{ ml: 'auto' }}
            >
              <ToggleButton value="daily">Daily</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
              <ToggleButton value="monthly">Monthly</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </AnimatedContainer>

      {/* Real-time KPI Dashboard */}
      <AnimatedContainer animation="fadeInUp" sx={{ mb: 4 }}>
        <RealtimeDashboard
          title="Key Performance Indicators"
          subtitle="Real-time clinic metrics"
          widgets={kpiWidgets}
          columns={4}
          autoRefresh={false}
        />
      </AnimatedContainer>

      {/* Charts Grid */}
      {viewMode === 'overview' && (
        <Grid container spacing={3}>
          {/* Patient Growth Trend */}
          <Grid item xs={12}>
            <AnimatedContainer animation="fadeInUp" animationDelay={0.1}>
              <TrendLineChart
                title="Patient Growth Trend"
                subtitle="Track patient acquisition over time"
                data={transformPatientGrowthData()}
                height={400}
                showArea={true}
                showMovingAverage={true}
                movingAveragePeriod={7}
                showPrediction={false}
                enableExport={true}
              />
            </AnimatedContainer>
          </Grid>

          {/* Revenue Distribution */}
          <Grid item xs={12} md={6}>
            <AnimatedContainer animation="fadeInUp" animationDelay={0.2}>
              <EnhancedPieChart
                title="Revenue Distribution"
                subtitle="Revenue by treatment type"
                data={transformRevenueData()}
                height={350}
                showLabels={true}
                enableExport={true}
                animationDuration={1000}
              />
            </AnimatedContainer>
          </Grid>

          {/* Patient Distribution */}
          {canViewAll && (
            <Grid item xs={12} md={6}>
              <AnimatedContainer animation="fadeInUp" animationDelay={0.3}>
                <EnhancedPieChart
                  title="Patient Distribution"
                  subtitle="Patients by doctor"
                  data={transformDoctorData()}
                  height={350}
                  showLabels={true}
                  enableExport={true}
                  animationDuration={1200}
                />
              </AnimatedContainer>
            </Grid>
          )}
        </Grid>
      )}

      {viewMode === 'detailed' && (
        <Grid container spacing={3}>
          {/* Treatment Revenue Bar Chart */}
          <Grid item xs={12}>
            <AnimatedContainer animation="fadeInUp" animationDelay={0.1}>
              <InteractiveBarChart
                title="Treatment Revenue Analysis"
                subtitle="Detailed breakdown of revenue by treatment type"
                data={transformRevenueData()}
                height={400}
                enableBrush={true}
                enableFilter={true}
                enableExport={true}
                showReferenceLines={true}
                referenceLines={[
                  {
                    value: revenueByTreatment.reduce((sum, item) => sum + item.totalRevenue, 0) / revenueByTreatment.length,
                    label: 'Average',
                    color: theme.palette.warning.main,
                    strokeDasharray: '5 5',
                  },
                ]}
              />
            </AnimatedContainer>
          </Grid>

          {/* Common Conditions */}
          {canViewAll && diseases.length > 0 && (
            <Grid item xs={12}>
              <AnimatedContainer animation="fadeInUp" animationDelay={0.2}>
                <InteractiveBarChart
                  title="Common Conditions"
                  subtitle="Top 10 most frequently diagnosed conditions"
                  data={transformDiseaseData()}
                  height={350}
                  enableExport={true}
                />
              </AnimatedContainer>
            </Grid>
          )}
        </Grid>
      )}

      {viewMode === 'trends' && (
        <Grid container spacing={3}>
          {/* Patient Growth with Predictions */}
          <Grid item xs={12}>
            <AnimatedContainer animation="fadeInUp" animationDelay={0.1}>
              <TrendLineChart
                title="Patient Growth Forecast"
                subtitle="Historical data with 30-day prediction"
                data={transformPatientGrowthData()}
                height={400}
                showPrediction={true}
                predictionDays={30}
                confidenceInterval={true}
                showTrendLine={true}
                showMovingAverage={true}
                movingAveragePeriod={14}
                enableExport={true}
              />
            </AnimatedContainer>
          </Grid>

          {/* Treatment Trends */}
          <Grid item xs={12}>
            <AnimatedContainer animation="fadeInUp" animationDelay={0.2}>
              <TrendLineChart
                title="Treatment Trends Analysis"
                subtitle="Compare treatment popularity over time"
                data={transformPatientGrowthData()}
                height={350}
                showComparison={true}
                enableExport={true}
              />
            </AnimatedContainer>
          </Grid>
        </Grid>
      )}

      {/* Treatment Statistics Cards */}
      <AnimatedContainer animation="fadeInUp" animationDelay={0.4} sx={{ mt: 4 }}>
        <EnhancedCard gradient="primary" gradientOpacity={0.1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Treatment Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              {revenueByTreatment.map((treatment, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <AnimatedContainer animation="fadeInUp" animationDelay={0.5 + index * 0.1}>
                    <EnhancedCard
                      hoverEffect="lift"
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {treatment.treatmentType}
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main">
                        ${treatment.totalRevenue.toFixed(0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {treatment.count} treatments
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={`Avg: $${(treatment.totalRevenue / treatment.count).toFixed(0)}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </EnhancedCard>
                  </AnimatedContainer>
                </Grid>
              ))}
            </Grid>
          </Box>
        </EnhancedCard>
      </AnimatedContainer>
    </Box>
  );
};

export default AnalyticsPage;
