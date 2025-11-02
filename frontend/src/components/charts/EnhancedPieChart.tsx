import React, { useState, useCallback, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { animations, durations } from '../../theme/animations';

export interface ChartData {
  name: string;
  value: number;
  color?: string;
  description?: string;
  percentage?: number;
}

export interface EnhancedPieChartProps {
  // Data
  data: ChartData[];

  // Chart customization
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number | string;

  // Visual settings
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  paddingAngle?: number;

  // Animation
  animated?: boolean;
  animationDuration?: number;
  animationBegin?: number;

  // Interactivity
  enableHover?: boolean;
  enableClick?: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onDataPointClick?: (data: ChartData, index: number) => void;

  // Legend
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  legendVerticalAlign?: 'top' | 'middle' | 'bottom';

  // Tooltip
  showTooltip?: boolean;
  tooltipContent?: (data: any) => React.ReactNode;

  // Labels
  showLabels?: boolean;
  labelLine?: boolean;
  labelContent?: (data: any) => React.ReactNode;

  // Colors
  colors?: string[];
  defaultColor?: string;

  // Export
  enableExport?: boolean;
  exportFormats?: ('png' | 'svg' | 'csv')[];

  // Additional features
  enableDrillDown?: boolean;
  drillDownComponent?: (data: ChartData) => React.ReactNode;

  // Performance
  lazyLoad?: boolean;
  virtualize?: boolean;
  maxDataPoints?: number;

  // Styling
  sx?: any;
  className?: string;
}

const EnhancedPieChart: React.FC<EnhancedPieChartProps> = ({
  data,
  title,
  subtitle,
  height = 400,
  width = '100%',
  innerRadius = 0,
  outerRadius = 120,
  startAngle = 0,
  endAngle = 360,
  paddingAngle = 0,
  animated = true,
  animationDuration = durations.normal * 1000,
  animationBegin = 0,
  enableHover = true,
  enableClick = true,
  activeIndex: controlledActiveIndex,
  onActiveIndexChange,
  onDataPointClick,
  showLegend = true,
  legendPosition = 'bottom',
  legendVerticalAlign = 'middle',
  showTooltip = true,
  tooltipContent,
  showLabels = false,
  labelLine = true,
  labelContent,
  colors,
  defaultColor = '#8884d8',
  enableExport = true,
  exportFormats = ['png', 'svg', 'csv'],
  enableDrillDown = false,
  drillDownComponent,
  lazyLoad = false,
  virtualize = false,
  maxDataPoints = 100,
  sx = {},
  className,
}) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<ChartData | null>(null);

  // Process data with performance optimizations
  const processedData = useMemo(() => {
    let processed = data.map((item, index) => ({
      ...item,
      color: item.color || colors?.[index % colors.length] || defaultColor,
      percentage: item.percentage || (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100,
    }));

    // Limit data points for performance
    if (maxDataPoints && processed.length > maxDataPoints) {
      const topItems = processed.slice(0, maxDataPoints - 1);
      const othersTotal = processed.slice(maxDataPoints - 1).reduce((sum, item) => sum + item.value, 0);
      processed = [
        ...topItems,
        {
          name: 'Others',
          value: othersTotal,
          color: theme.palette.grey[500],
          percentage: (othersTotal / data.reduce((sum, d) => sum + d.value, 0)) * 100,
        },
      ];
    }

    return processed;
  }, [data, colors, defaultColor, theme, maxDataPoints]);

  // Handle active index changes
  const handleActiveIndexChange = useCallback((index: number) => {
    if (controlledActiveIndex === undefined) {
      setActiveIndex(index);
    }
    onActiveIndexChange?.(index);
  }, [controlledActiveIndex, onActiveIndexChange]);

  // Custom label content
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (percent < 0.05) return null; // Don't show labels for small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (labelContent) {
      return labelContent(props);
    }

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom active shape
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
          {`${value} (${(percent * 100).toFixed(2)}%)`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {payload.description}
        </text>
      </g>
    );
  };

  // Custom tooltip
  const defaultTooltipContent = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0];
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 2,
            boxShadow: theme.shadows[3],
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: {data.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {data.payload.percentage?.toFixed(1)}%
          </Typography>
          {data.payload.description && (
            <Typography variant="caption" color="text.secondary">
              {data.payload.description}
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
      onDataPointClick?.(data.payload, index);

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
    const csvContent = [
      ['Name', 'Value', 'Percentage', 'Description'],
      ...processedData.map(item => [
        item.name,
        item.value.toString(),
        item.percentage?.toFixed(2) || '',
        item.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-data-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Refresh data
  const handleRefresh = () => {
    // This would typically trigger a data refresh
    console.log('Refreshing chart data');
  };

  // Menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const currentActiveIndex = controlledActiveIndex !== undefined ? controlledActiveIndex : activeIndex;

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
      >
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          {(title || enableExport) && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Box>
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
              <Box sx={{ display: 'flex', gap: 1 }}>
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

          {/* Chart */}
          {!drillDownData ? (
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  labelLine={labelLine}
                  label={showLabels ? renderLabel : false}
                  outerRadius={outerRadius}
                  innerRadius={innerRadius}
                  fill={defaultColor}
                  dataKey="value"
                  startAngle={startAngle}
                  endAngle={endAngle}
                  paddingAngle={paddingAngle}
                  animationBegin={animationBegin}
                  animationDuration={animated ? animationDuration : 0}
                  activeIndex={currentActiveIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => enableHover && handleActiveIndexChange(index)}
                  onMouseLeave={() => enableHover && handleActiveIndexChange(-1)}
                  onClick={handleDataPointClick}
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        filter: currentActiveIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                        cursor: enableClick ? 'pointer' : 'default',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </Pie>
                {showTooltip && (
                  <Tooltip content={tooltipContent || defaultTooltipContent} />
                )}
                {showLegend && (
                  <Legend
                    verticalAlign={legendVerticalAlign}
                    align={legendPosition}
                    wrapperStyle={{
                      paddingTop: '20px',
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ p: 2 }}>
              {drillDownComponent && drillDownComponent(drillDownData)}
              <IconButton
                onClick={() => setDrillDownData(null)}
                sx={{ mt: 2 }}
              >
                Back
              </IconButton>
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

export default EnhancedPieChart;