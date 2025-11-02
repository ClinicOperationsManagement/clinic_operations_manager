import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Brush,
  ReferenceLine,
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Button,
  ButtonGroup,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { animations, durations } from '../../theme/animations';

export interface BarChartData {
  name: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  category?: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface InteractiveBarChartProps {
  // Data
  data: BarChartData[];

  // Chart customization
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number | string;

  // Axes
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  secondaryYAxisDataKey?: string;

  // Visual settings
  barSize?: number;
  maxBarSize?: number;
  gap?: number;
  stackId?: string;

  // Animation
  animated?: boolean;
  animationDuration?: number;
  animationBegin?: number;

  // Interactivity
  enableHover?: boolean;
  enableClick?: boolean;
  enableBrush?: boolean;
  enableZoom?: boolean;
  enableFilter?: boolean;

  // Grid and lines
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showReferenceLines?: boolean;
  referenceLines?: Array<{
    value: number;
    label?: string;
    color?: string;
    strokeDasharray?: string;
  }>;

  // Legend
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';

  // Tooltip
  showTooltip?: boolean;
  tooltipContent?: (data: any) => React.ReactNode;

  // Colors
  colors?: string[];
  defaultColor?: string;
  secondaryColor?: string;

  // Export
  enableExport?: boolean;
  exportFormats?: ('png' | 'svg' | 'csv')[];

  // Performance
  lazyLoad?: boolean;
  virtualize?: boolean;
  maxDataPoints?: number;
  thresholdForVirtualization?: number;

  // Additional features
  enableComparison?: boolean;
  comparisonData?: BarChartData[];
  enableDrillDown?: boolean;
  drillDownComponent?: (data: BarChartData) => React.ReactNode;

  // Styling
  sx?: any;
  className?: string;
}

const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({
  data,
  title,
  subtitle,
  height = 400,
  width = '100%',
  xAxisDataKey = 'name',
  yAxisDataKey = 'value',
  secondaryYAxisDataKey,
  barSize,
  maxBarSize = 50,
  gap = 0,
  stackId,
  animated = true,
  animationDuration = durations.normal * 1000,
  animationBegin = 0,
  enableHover = true,
  enableClick = true,
  enableBrush = false,
  enableZoom = false,
  enableFilter = false,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  showReferenceLines = false,
  referenceLines = [],
  showLegend = true,
  legendPosition = 'top',
  showTooltip = true,
  tooltipContent,
  colors,
  defaultColor = '#8884d8',
  secondaryColor = '#82ca9d',
  enableExport = true,
  exportFormats = ['png', 'svg', 'csv'],
  lazyLoad = false,
  virtualize = false,
  maxDataPoints = 100,
  thresholdForVirtualization = 50,
  enableComparison = false,
  comparisonData = [],
  enableDrillDown = false,
  drillDownComponent,
  sx = {},
  className,
}) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<BarChartData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSecondary, setShowSecondary] = useState(!!secondaryYAxisDataKey);
  const [zoomLevel, setZoomLevel] = useState(1);
  const chartRef = useRef<any>(null);

  // Process data with performance optimizations
  const processedData = useMemo(() => {
    let processed = data.map((item, index) => ({
      ...item,
      color: item.color || colors?.[index % colors.length] || defaultColor,
      secondaryColor: colors?.[(index + 1) % colors.length] || secondaryColor,
    }));

    // Apply category filter
    if (enableFilter && selectedCategory !== 'all') {
      processed = processed.filter(item => item.category === selectedCategory);
    }

    // Limit data points for performance
    if (maxDataPoints && processed.length > maxDataPoints) {
      processed = processed.slice(0, maxDataPoints);
    }

    return processed;
  }, [data, colors, defaultColor, secondaryColor, enableFilter, selectedCategory, maxDataPoints]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!enableFilter) return [];
    const cats = ['all', ...new Set(data.map(item => item.category).filter(Boolean))];
    return cats as string[];
  }, [data, enableFilter]);

  // Handle active index changes
  const handleActiveIndexChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Custom tooltip
  const defaultTooltipContent = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0];
      const secondaryData = props.payload[1];
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 2,
            boxShadow: theme.shadows[3],
            minWidth: 200,
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {data.payload.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Primary: {data.value}
          </Typography>
          {secondaryData && (
            <Typography variant="body2" color="text.secondary">
              Secondary: {secondaryData.value}
            </Typography>
          )}
          {data.payload.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {data.payload.description}
            </Typography>
          )}
          {data.payload.trend && (
            <Typography
              variant="caption"
              sx={{
                color: data.payload.trend === 'up' ? 'success.main' :
                       data.payload.trend === 'down' ? 'error.main' : 'text.secondary',
                display: 'block',
                mt: 0.5,
              }}
            >
              Trend: {data.payload.trend}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  // Handle data point click
  const handleDataPointClick = (data: any, index: number) => {
    if (enableClick) {
      handleActiveIndexChange(index);

      if (enableDrillDown && drillDownComponent) {
        setDrillDownData(data.payload);
      }
    }
  };

  // Export functionality
  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'png':
      case 'svg':
        // Implement export to image
        console.log(`Export to ${format} not implemented yet`);
        break;
    }
    setMenuAnchor(null);
  };

  const exportToCSV = () => {
    const headers = ['Name', yAxisDataKey];
    if (secondaryYAxisDataKey) headers.push(secondaryYAxisDataKey);
    headers.push('Category', 'Description');

    const csvContent = [
      headers,
      ...processedData.map(item => [
        item.name,
        item[yAxisDataKey],
        secondaryYAxisDataKey ? item[secondaryYAxisDataKey] || '' : '',
        item.category || '',
        item.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bar-chart-data-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Refresh data
  const handleRefresh = () => {
    console.log('Refreshing chart data');
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5));

  // Menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Check if virtualization should be used
  const shouldVirtualize = virtualize && processedData.length > thresholdForVirtualization;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.normal }}
    >
      <Card
        sx={{
          height: isFullscreen ? '100vh' : 'auto',
          width: isFullscreen ? '100vw' : width,
          ...sx,
        }}
        className={className}
        ref={chartRef}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          {(title || enableExport || enableFilter) && (
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
                {enableZoom && (
                  <ButtonGroup size="small">
                    <IconButton size="small" onClick={handleZoomOut}>
                      <ZoomOutIcon />
                    </IconButton>
                    <IconButton size="small" onClick={handleZoomIn}>
                      <ZoomInIcon />
                    </IconButton>
                  </ButtonGroup>
                )}
                {enableExport && (
                  <IconButton size="small" onClick={handleMenuOpen}>
                    <MoreVertIcon />
                  </IconButton>
                )}
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
                <IconButton size="small" onClick={() => setIsFullscreen(!isFullscreen)}>
                  <FullscreenIcon />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Filters */}
          {enableFilter && categories.length > 1 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Filter by category:
              </Typography>
              <ButtonGroup size="small">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'contained' : 'outlined'}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>
          )}

          {/* Secondary data toggle */}
          {secondaryYAxisDataKey && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showSecondary}
                    onChange={(e) => setShowSecondary(e.target.checked)}
                    size="small"
                  />
                }
                label="Show Secondary Data"
              />
            </Box>
          )}

          {/* Chart */}
          {!drillDownData ? (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barGap={gap}
              >
                {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                {showXAxis && <XAxis dataKey={xAxisDataKey} />}
                {showYAxis && <YAxis />}
                {showTooltip && (
                  <Tooltip content={tooltipContent || defaultTooltipContent} />
                )}
                {showLegend && <Legend align={legendPosition} />}

                {/* Reference lines */}
                {showReferenceLines && referenceLines.map((line, index) => (
                  <ReferenceLine
                    key={index}
                    y={line.value}
                    label={line.label}
                    stroke={line.color || theme.palette.divider}
                    strokeDasharray={line.strokeDasharray}
                  />
                ))}

                {/* Main bars */}
                <Bar
                  dataKey={yAxisDataKey}
                  fill={defaultColor}
                  barSize={barSize}
                  maxBarSize={maxBarSize}
                  stackId={stackId}
                  animationBegin={animationBegin}
                  animationDuration={animated ? animationDuration : 0}
                  onMouseEnter={(_, index) => enableHover && handleActiveIndexChange(index)}
                  onMouseLeave={() => enableHover && handleActiveIndexChange(-1)}
                  onClick={handleDataPointClick}
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                        cursor: enableClick ? 'pointer' : 'default',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </Bar>

                {/* Secondary bars */}
                {showSecondary && secondaryYAxisDataKey && (
                  <Bar
                    dataKey={secondaryYAxisDataKey}
                    fill={secondaryColor}
                    barSize={barSize}
                    maxBarSize={maxBarSize}
                    stackId={stackId}
                    animationBegin={animationBegin}
                    animationDuration={animated ? animationDuration : 0}
                  />
                )}

                {/* Brush for large datasets */}
                {enableBrush && processedData.length > 20 && (
                  <Brush
                    dataKey={xAxisDataKey}
                    height={30}
                    stroke={theme.palette.primary.main}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ p: 2 }}>
              {drillDownComponent && drillDownComponent(drillDownData)}
              <Button
                onClick={() => setDrillDownData(null)}
                sx={{ mt: 2 }}
              >
                Back to Chart
              </Button>
            </Box>
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

export default InteractiveBarChart;