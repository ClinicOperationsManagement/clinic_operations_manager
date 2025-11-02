import React, { useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Brush,
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ButtonGroup,
  Button,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { animations, durations } from '../../theme/animations';

export interface TrendDataPoint {
  date: string;
  value: number;
  secondaryValue?: number;
  predicted?: boolean;
  confidence?: number;
  event?: {
    name: string;
    description: string;
  };
}

export interface TrendLineChartProps {
  // Data
  data: TrendDataPoint[];

  // Chart customization
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number | string;

  // Time range
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'custom';
  onTimeRangeChange?: (range: string) => void;

  // Data keys
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  secondaryYAxisDataKey?: string;

  // Visual settings
  showArea?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  strokeWidth?: number;
  curve?: 'monotone' | 'linear' | 'step' | 'basis' | 'cardinal';

  // Predictive features
  showPrediction?: boolean;
  predictionDays?: number;
  confidenceInterval?: boolean;
  showTrendLine?: boolean;

  // Event annotations
  showEvents?: boolean;
  eventMarkers?: Array<{
    date: string;
    label: string;
    color?: string;
  }>;

  // Animation
  animated?: boolean;
  animationDuration?: number;
  animationBegin?: number;

  // Interactivity
  enableHover?: boolean;
  enableBrush?: boolean;
  enableZoom?: boolean;

  // Legend
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';

  // Tooltip
  showTooltip?: boolean;
  tooltipContent?: (data: any) => React.ReactNode;

  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  predictionColor?: string;
  confidenceColor?: string;

  // Export
  enableExport?: boolean;
  exportFormats?: ('png' | 'svg' | 'csv')[];

  // Additional features
  enableComparison?: boolean;
  comparisonData?: TrendDataPoint[];
  showMovingAverage?: boolean;
  movingAveragePeriod?: number;

  // Styling
  sx?: any;
  className?: string;
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  title,
  subtitle,
  height = 400,
  width = '100%',
  timeRange = 'month',
  onTimeRangeChange,
  xAxisDataKey = 'date',
  yAxisDataKey = 'value',
  secondaryYAxisDataKey,
  showArea = false,
  showGrid = true,
  showDots = true,
  strokeWidth = 2,
  curve = 'monotone',
  showPrediction = false,
  predictionDays = 30,
  confidenceInterval = true,
  showTrendLine = false,
  showEvents = true,
  eventMarkers = [],
  animated = true,
  animationDuration = durations.normal * 1000,
  animationBegin = 0,
  enableHover = true,
  enableBrush = false,
  enableZoom = false,
  showLegend = true,
  legendPosition = 'top',
  showTooltip = true,
  tooltipContent,
  primaryColor = '#8884d8',
  secondaryColor = '#82ca9d',
  predictionColor = '#ff7300',
  confidenceColor = 'rgba(255, 115, 0, 0.3)',
  enableExport = true,
  exportFormats = ['png', 'svg', 'csv'],
  enableComparison = false,
  comparisonData = [],
  showMovingAverage = false,
  movingAveragePeriod = 7,
  sx = {},
  className,
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [viewMode, setViewMode] = useState<'line' | 'area' | 'composed'>('line');

  // Process data with predictions and moving averages
  const processedData = useMemo(() => {
    const processed = data.map((item) => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString(),
    }));

    // Calculate moving average if enabled
    if (showMovingAverage && processed.length >= movingAveragePeriod) {
      return processed.map((item, index) => {
        if (index < movingAveragePeriod - 1) {
          return { ...item, movingAverage: null };
        }

        const sum = processed
          .slice(index - movingAveragePeriod + 1, index + 1)
          .reduce((acc, curr) => acc + curr.value, 0);
        const movingAverage = sum / movingAveragePeriod;

        return { ...item, movingAverage };
      });
    }

    return processed;
  }, [data, showMovingAverage, movingAveragePeriod]);

  // Generate prediction data if enabled
  const predictionData = useMemo(() => {
    if (!showPrediction || processedData.length < 2) return [];

    const lastDataPoint = processedData[processedData.length - 1];
    const previousDataPoint = processedData[processedData.length - 2];

    // Simple linear regression for trend calculation
    const trend = (lastDataPoint.value - previousDataPoint.value) /
                 (new Date(lastDataPoint.date).getTime() - new Date(previousDataPoint.date).getTime());

    const predictions = [];
    const startDate = new Date(lastDataPoint.date);

    for (let i = 1; i <= predictionDays; i++) {
      const futureDate = new Date(startDate);
      futureDate.setDate(futureDate.getDate() + i);

      const predictedValue = lastDataPoint.value + (trend * i * 24 * 60 * 60 * 1000);
      const confidence = Math.max(0.1, 1 - (i / predictionDays) * 0.8);

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: predictedValue,
        predicted: true,
        confidence,
        formattedDate: futureDate.toLocaleDateString(),
      });
    }

    return predictions;
  }, [showPrediction, processedData, predictionDays]);

  // Combine actual and prediction data
  const combinedData = useMemo(() => {
    if (showPrediction) {
      return [...processedData, ...predictionData];
    }
    return processedData;
  }, [processedData, predictionData, showPrediction]);

  // Calculate trend line
  const trendLineData = useMemo(() => {
    if (!showTrendLine || processedData.length < 2) return [];

    const n = processedData.length;
    const sumX = processedData.reduce((sum, _, index) => sum + index, 0);
    const sumY = processedData.reduce((sum, item) => sum + item.value, 0);
    const sumXY = processedData.reduce((sum, item, index) => sum + index * item.value, 0);
    const sumXX = processedData.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return processedData.map((item, index) => ({
      ...item,
      trendValue: slope * index + intercept,
    }));
  }, [processedData, showTrendLine]);

  // Custom tooltip
  const defaultTooltipContent = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 2,
            boxShadow: theme.shadows[3],
            minWidth: 250,
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {data.formattedDate}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: {data.value?.toFixed(2)}
          </Typography>
          {data.movingAverage && (
            <Typography variant="body2" color="text.secondary">
              Moving Avg: {data.movingAverage?.toFixed(2)}
            </Typography>
          )}
          {data.trendValue && (
            <Typography variant="body2" color="text.secondary">
              Trend: {data.trendValue?.toFixed(2)}
            </Typography>
          )}
          {data.predicted && (
            <Box>
              <Chip
                label="Predicted"
                size="small"
                color="warning"
                sx={{ mb: 1 }}
              />
              {data.confidence && (
                <Typography variant="caption" color="text.secondary">
                  Confidence: {(data.confidence * 100).toFixed(1)}%
                </Typography>
              )}
            </Box>
          )}
          {data.event && (
            <Box sx={{ mt: 1, p: 1, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={600}>
                {data.event.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.event.description}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  // Time range options
  const timeRangeOptions = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    onTimeRangeChange?.(range);
  };

  // Export functionality
  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'png':
      case 'svg':
        console.log(`Export to ${format} not implemented yet`);
        break;
    }
    setMenuAnchor(null);
  };

  const exportToCSV = () => {
    const headers = ['Date', yAxisDataKey];
    if (secondaryYAxisDataKey) headers.push(secondaryYAxisDataKey);
    if (showMovingAverage) headers.push('Moving Average');
    if (showTrendLine) headers.push('Trend Line');
    headers.push('Type');

    const csvContent = [
      headers,
      ...combinedData.map(item => [
        item.formattedDate,
        item.value?.toFixed(2) || '',
        secondaryYAxisDataKey ? (item[secondaryYAxisDataKey] || '').toFixed(2) : '',
        showMovingAverage ? (item.movingAverage || '').toFixed(2) : '',
        showTrendLine ? (item.trendValue || '').toFixed(2) : '',
        item.predicted ? 'Predicted' : 'Actual',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trend-chart-data-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Render chart based on view mode
  const renderChart = () => {
    const commonProps = {
      data: showTrendLine ? trendLineData : combinedData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (viewMode) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            {showTooltip && <Tooltip content={tooltipContent || defaultTooltipContent} />}
            {showLegend && <Legend />}

            <Area
              type={curve}
              dataKey={yAxisDataKey}
              stroke={primaryColor}
              fill={alpha(primaryColor, 0.3)}
              strokeWidth={strokeWidth}
              animationDuration={animated ? animationDuration : 0}
            />

            {showMovingAverage && (
              <Area
                type={curve}
                dataKey="movingAverage"
                stroke={secondaryColor}
                fill={alpha(secondaryColor, 0.2)}
                strokeWidth={strokeWidth}
                strokeDasharray="5 5"
                animationDuration={animated ? animationDuration : 0}
              />
            )}
          </AreaChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            {showTooltip && <Tooltip content={tooltipContent || defaultTooltipContent} />}
            {showLegend && <Legend />}

            {showArea && (
              <Area
                type={curve}
                dataKey={yAxisDataKey}
                stroke={primaryColor}
                fill={alpha(primaryColor, 0.3)}
                strokeWidth={strokeWidth}
                animationDuration={animated ? animationDuration : 0}
              />
            )}

            <Line
              type={curve}
              dataKey={yAxisDataKey}
              stroke={primaryColor}
              strokeWidth={strokeWidth}
              dot={showDots}
              animationDuration={animated ? animationDuration : 0}
            />

            {showMovingAverage && (
              <Line
                type={curve}
                dataKey="movingAverage"
                stroke={secondaryColor}
                strokeWidth={strokeWidth}
                strokeDasharray="5 5"
                dot={false}
                animationDuration={animated ? animationDuration : 0}
              />
            )}
          </ComposedChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            {showTooltip && <Tooltip content={tooltipContent || defaultTooltipContent} />}
            {showLegend && <Legend />}

            <Line
              type={curve}
              dataKey={yAxisDataKey}
              stroke={primaryColor}
              strokeWidth={strokeWidth}
              dot={showDots}
              animationDuration={animated ? animationDuration : 0}
            />

            {secondaryYAxisDataKey && (
              <Line
                type={curve}
                dataKey={secondaryYAxisDataKey}
                stroke={secondaryColor}
                strokeWidth={strokeWidth}
                dot={showDots}
                animationDuration={animated ? animationDuration : 0}
              />
            )}

            {showMovingAverage && (
              <Line
                type={curve}
                dataKey="movingAverage"
                stroke={secondaryColor}
                strokeWidth={strokeWidth}
                strokeDasharray="5 5"
                dot={false}
                animationDuration={animated ? animationDuration : 0}
              />
            )}

            {showTrendLine && (
              <Line
                type="linear"
                dataKey="trendValue"
                stroke={alpha(theme.palette.text.secondary, 0.5)}
                strokeWidth={1}
                strokeDasharray="10 5"
                dot={false}
                animationDuration={animated ? animationDuration : 0}
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.normal }}
    >
      <Card sx={{ ...sx }} className={className}>
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          {(title || enableExport) && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                {title && (
                  <Typography variant="h6" fontWeight={600} gutterBottom={!!subtitle}>
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                {enableExport && (
                  <IconButton size="small" onClick={handleMenuOpen}>
                    <MoreVertIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}

          {/* Controls */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Time Range Selector */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={selectedTimeRange}
                label="Time Range"
                onChange={(e) => handleTimeRangeChange(e.target.value)}
              >
                {timeRangeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* View Mode Selector */}
            <ButtonGroup size="small">
              <Button
                variant={viewMode === 'line' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('line')}
                startIcon={<TimelineIcon />}
              >
                Line
              </Button>
              <Button
                variant={viewMode === 'area' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('area')}
                startIcon={<ShowChartIcon />}
              >
                Area
              </Button>
              <Button
                variant={viewMode === 'composed' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('composed')}
                startIcon={<AssessmentIcon />}
              >
                Combined
              </Button>
            </ButtonGroup>

            {/* Feature Toggles */}
            {showMovingAverage && (
              <Chip
                label={`MA (${movingAveragePeriod} days)`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {showPrediction && (
              <Chip
                label={`${predictionDays} day prediction`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>

          {/* Brush for navigation */}
          {enableBrush && combinedData.length > 20 && (
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={combinedData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <Line
                  type={curve}
                  dataKey={yAxisDataKey}
                  stroke={primaryColor}
                  strokeWidth={1}
                  dot={false}
                />
                <Brush
                  dataKey={xAxisDataKey}
                  height={30}
                  stroke={theme.palette.primary.main}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>

        {/* Export Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          {exportFormats.includes('csv') && (
            <MenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </MenuItem>
          )}
          {exportFormats.includes('png') && (
            <MenuItem onClick={() => handleExport('png')}>
              Export as PNG
            </MenuItem>
          )}
          {exportFormats.includes('svg') && (
            <MenuItem onClick={() => handleExport('svg')}>
              Export as SVG
            </MenuItem>
          )}
        </Menu>
      </Card>
    </motion.div>
  );
};

export default TrendLineChart;