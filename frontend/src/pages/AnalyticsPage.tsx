import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { analyticsService } from "../services/analytics.service";
import { useAuth } from "../context/AuthContext";
import {
  People as PeopleIcon,
  CurrencyRupee as RupeeIcon,
  LocalHospital as DoctorIcon,
} from "@mui/icons-material";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B6B",
];

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const [patientGrowth, setPatientGrowth] = useState<any[]>([]);
  const [revenueByTreatment, setRevenueByTreatment] = useState<any[]>([]);
  const [patientsByDoctor, setPatientsByDoctor] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  );

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

      if (user?.role === "admin" || user?.role === "receptionist") {
        const doctorData = await analyticsService.getPatientsByDoctor();
        setPatientsByDoctor(doctorData);
      }

      setError("");
    } catch (err: any) {
      setError(err.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const CardWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <Card
      sx={{
        borderRadius: "24px",
        background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        height: "100%",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
        },
      }}
    >
      <CardContent
        sx={{
          p: 2,
          "&:last-child": { pb: 2 },
        }}
      >
        {children}
      </CardContent>
    </Card>
  );

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  const canViewAll = user?.role === "admin" || user?.role === "receptionist";
  const totalPatients = patientGrowth.reduce((sum, d) => sum + d.count, 0);
  const totalRevenue = revenueByTreatment.reduce(
    (sum, t) => sum + t.totalRevenue,
    0
  );
  const topDoctor =
    patientsByDoctor.sort((a, b) => b.patientCount - a.patientCount)[0]
      ?.doctorName || "N/A";

  // Helper: square box
  const SquareBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        "&::before": {
          content: '""',
          display: "block",
          paddingTop: "100%", // perfect square
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        {children}
      </Box>
    </Box>
  );

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        fontWeight={700}
        textAlign="center"
        gutterBottom
      >
        Analytics & Reports
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        gutterBottom
        sx={{ mb: 3 }}
      >
        Welcome back, {user?.name} 👋 — here’s your latest performance overview.
      </Typography>

      {/* KPI Summary */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <CardWrapper>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Patients
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {totalPatients}
                </Typography>
              </Box>
              <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardWrapper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <CardWrapper>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  ₹{totalRevenue.toFixed(2)}
                </Typography>
              </Box>
              <RupeeIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardWrapper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <CardWrapper>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Top Doctor
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  Dr. {topDoctor}
                </Typography>
              </Box>
              <DoctorIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardWrapper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Patient Growth */}
        <Grid item xs={12} md={6}>
          <CardWrapper>
            <Typography
              variant="h6"
              textAlign="center"
              fontWeight={600}
              mb={2}
            >
              Patient Growth Over Time
            </Typography>
            <Box display="flex" justifyContent="center" mb={2}>
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
            <SquareBox>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={theme.palette.primary.main}
                    name="New Patients"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </SquareBox>
          </CardWrapper>
        </Grid>

        {/* Revenue by Treatment */}
        <Grid item xs={12} md={6}>
          <CardWrapper>
            <Typography
              variant="h6"
              textAlign="center"
              fontWeight={600}
              mb={2}
            >
              Revenue by Treatment
            </Typography>
            <SquareBox>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByTreatment}
                    dataKey="totalRevenue"
                    nameKey="treatmentType"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
                  >
                    {revenueByTreatment.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </SquareBox>
          </CardWrapper>
        </Grid>

        {/* Revenue vs Patient Count */}
        <Grid item xs={12} md={6}>
          <CardWrapper>
            <Typography
              variant="h6"
              textAlign="center"
              fontWeight={600}
              mb={2}
            >
              Revenue vs Patient Count
            </Typography>
            <SquareBox>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="#8884d8"
                    name="Patients"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#82ca9d"
                    name="Revenue (₹)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </SquareBox>
          </CardWrapper>
        </Grid>

        {/* Patients by Doctor */}
        {canViewAll && (
          <Grid item xs={12} md={6}>
            <CardWrapper>
              <Typography
                variant="h6"
                textAlign="center"
                fontWeight={600}
                mb={2}
              >
                Patients by Doctor
              </Typography>
              <SquareBox>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={patientsByDoctor}
                      dataKey="patientCount"
                      nameKey="doctorName"
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      label={({ doctorName, patientCount }) =>
                        `Dr. ${doctorName}: ${patientCount}`
                      }
                    >
                      {patientsByDoctor.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </SquareBox>
            </CardWrapper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
