import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  useTheme,
  alpha,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgress, LinearProgress } from '@mui/material';
import { animations, durations } from '../../theme/animations';

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'kpi' | 'chart' | 'list' | 'metric';
  value?: number | string;
  previousValue?: number | string;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
  format?: 'number' | 'currency' | 'percentage';
  data?: any[];
  lastUpdated?: Date;
  refreshInterval?: number;
}

export interface RealtimeDashboardProps {
  // Widgets configuration
  widgets: DashboardWidget[];

  // Dashboard settings
  title?: string;
  subtitle?: string;
  autoRefresh?: boolean;
  globalRefreshInterval?: number;

  // Layout
  columns?: number;
  spacing?: number;
  height?: number | string;

  // Data fetching
  onRefresh?: (widgetId: string) => Promise<any>;
  onGlobalRefresh?: () => Promise<void>;

  // Real-time updates
  enableWebSocket?: boolean;
  webSocketUrl?: string;
  onWebSocketMessage?: (message: any) => void;

  // Interactivity
  enableWidgetDrag?: boolean;
  enableWidgetResize?: boolean;
  onWidgetClick?: (widget: DashboardWidget) => void;

  // Performance
  maxConcurrentRefreshes?: number;
  cacheTimeout?: number;

  // Styling
  sx?: any;
  className?: string;
}

const RealtimeDashboard: React.FC<RealtimeDashboardProps> = ({
  widgets,
  title,
  subtitle,
  autoRefresh = true,
  globalRefreshInterval = 30000, // 30 seconds
  columns = 3,
  spacing = 2,
  height = 'auto',
  onRefresh,
  onGlobalRefresh,
  enableWebSocket = false,
  webSocketUrl,
  onWebSocketMessage,
  enableWidgetDrag = false,
  enableWidgetResize = false,
  onWidgetClick,
  maxConcurrentRefreshes = 3,
  cacheTimeout = 5000,
  sx = {},
  className,
}) => {
  const theme = useTheme();
  const [widgetStates, setWidgetStates] = useState<Record<string, {
    loading: boolean;
    error: string | null;
    lastRefresh: Date | null;
    data: any;
  }>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState<Date | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const refreshTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize widget states
  useEffect(() => {
    const initialStates: Record<string, any> = {};
    widgets.forEach(widget => {
      initialStates[widget.id] = {
        loading: false,
        error: null,
        lastRefresh: null,
        data: widget.data || null,
      };
    });
    setWidgetStates(initialStates);
  }, [widgets]);

  // WebSocket connection
  useEffect(() => {
    if (enableWebSocket && webSocketUrl) {
      try {
        webSocketRef.current = new WebSocket(webSocketUrl);

        webSocketRef.current.onopen = () => {
          console.log('WebSocket connected');
        };

        webSocketRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            onWebSocketMessage?.(message);

            // Update widget data if message contains widget-specific data
            if (message.widgetId && message.data) {
              setWidgetStates(prev => ({
                ...prev,
                [message.widgetId]: {
                  ...prev[message.widgetId],
                  data: message.data,
                  lastRefresh: new Date(),
                  error: null,
                }
              }));
            }
          } catch (error) {
            console.error('WebSocket message parsing error:', error);
          }
        };

        webSocketRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (enableWebSocket) {
              console.log('Attempting to reconnect WebSocket...');
            }
          }, 5000);
        };

        webSocketRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }

      return () => {
        if (webSocketRef.current) {
          webSocketRef.current.close();
          webSocketRef.current = null;
        }
      };
    }
  }, [enableWebSocket, webSocketUrl, onWebSocketMessage]);

  // Refresh individual widget
  const refreshWidget = useCallback(async (widgetId: string) => {
    if (!onRefresh || isPaused) return;

    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    setWidgetStates(prev => ({
      ...prev,
      [widgetId]: {
        ...prev[widgetId],
        loading: true,
        error: null,
      }
    }));

    try {
      const data = await onRefresh(widgetId);
      setWidgetStates(prev => ({
        ...prev,
        [widgetId]: {
          ...prev[widgetId],
          data,
          loading: false,
          lastRefresh: new Date(),
          error: null,
        }
      }));
    } catch (error) {
      setWidgetStates(prev => ({
        ...prev,
        [widgetId]: {
          ...prev[widgetId],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to refresh',
        }
      }));
    }
  }, [onRefresh, widgets, isPaused]);

  // Global refresh
  const globalRefresh = useCallback(async () => {
    if (!onGlobalRefresh || isPaused) return;

    setGlobalLoading(true);
    try {
      await onGlobalRefresh();
      setLastGlobalRefresh(new Date());

      // Refresh individual widgets that have onRefresh
      const widgetsToRefresh = widgets.filter(w => onRefresh);
      const refreshPromises = widgetsToRefresh
        .slice(0, maxConcurrentRefreshes)
        .map(widget => refreshWidget(widget.id));

      await Promise.allSettled(refreshPromises);
    } catch (error) {
      console.error('Global refresh error:', error);
    } finally {
      setGlobalLoading(false);
    }
  }, [onGlobalRefresh, isPaused, widgets, maxConcurrentRefreshes, refreshWidget]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || isPaused) return;

    // Set up global refresh interval
    const globalInterval = setInterval(globalRefresh, globalRefreshInterval);

    // Set up individual widget intervals
    widgets.forEach(widget => {
      if (widget.refreshInterval && onRefresh) {
        refreshTimeoutsRef.current[widget.id] = setInterval(
          () => refreshWidget(widget.id),
          widget.refreshInterval
        );
      }
    });

    return () => {
      clearInterval(globalInterval);
      Object.values(refreshTimeoutsRef.current).forEach(timeout => {
        clearInterval(timeout);
      });
    };
  }, [autoRefresh, isPaused, globalRefreshInterval, widgets, onRefresh, globalRefresh, refreshWidget]);

  // Format value based on format type
  const formatValue = (value: number | string, format?: string, unit?: string) => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return `${value}${unit ? ` ${unit}` : ''}`;
    }
  };

  // Get trend icon and color
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return { icon: '↑', color: theme.palette.success.main };
      case 'down':
        return { icon: '↓', color: theme.palette.error.main };
      default:
        return { icon: '→', color: theme.palette.info.main };
    }
  };

  // Render KPI widget
  const renderKPIWidget = (widget: DashboardWidget, state: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: durations.normal }}
    >
      <Card
        sx={{
          height: '100%',
          cursor: onWidgetClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          '&:hover': onWidgetClick ? {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
          } : {},
        }}
        onClick={() => onWidgetClick?.(widget)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" fontWeight={600} color="text.secondary">
              {widget.title}
            </Typography>
            {state.lastRefresh && (
              <Tooltip title={`Last updated: ${state.lastRefresh.toLocaleTimeString()}`}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main,
                  }}
                />
              </Tooltip>
            )}
          </Box>

          {state.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : state.error ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="error">
                {state.error}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {formatValue(state.data || widget.value, widget.format, widget.unit)}
              </Typography>
              {widget.previousValue && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Previous: {formatValue(widget.previousValue, widget.format, widget.unit)}
                  </Typography>
                  {widget.trend && (
                    <Typography
                      variant="body2"
                      sx={{ color: getTrendIcon(widget.trend).color, fontWeight: 600 }}
                    >
                      {getTrendIcon(widget.trend).icon}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render list widget
  const renderListWidget = (widget: DashboardWidget, state: any) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: durations.normal }}
    >
      <Card
        sx={{
          height: '100%',
          cursor: onWidgetClick ? 'pointer' : 'default',
        }}
        onClick={() => onWidgetClick?.(widget)}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {widget.title}
          </Typography>

          {state.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : state.error ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="error">
                {state.error}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {(state.data || widget.data || []).slice(0, 5).map((item: any, index: number) => (
                <Box
                  key={index}
                  sx={{
                    py: 1,
                    borderBottom: index < 4 ? `1px solid ${theme.palette.divider}` : 'none',
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {item.name || item.title || `Item ${index + 1}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.value || item.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render chart widget (placeholder)
  const renderChartWidget = (widget: DashboardWidget, state: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.normal }}
    >
      <Card
        sx={{
          height: '100%',
          cursor: onWidgetClick ? 'pointer' : 'default',
        }}
        onClick={() => onWidgetClick?.(widget)}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {widget.title}
          </Typography>

          {state.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : state.error ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="error">
                {state.error}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chart visualization placeholder
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="indeterminate" sx={{ width: 200 }} />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render widget based on type
  const renderWidget = (widget: DashboardWidget) => {
    const state = widgetStates[widget.id] || { loading: false, error: null, data: null };

    switch (widget.type) {
      case 'kpi':
        return renderKPIWidget(widget, state);
      case 'list':
        return renderListWidget(widget, state);
      case 'chart':
        return renderChartWidget(widget, state);
      default:
        return renderKPIWidget(widget, state);
    }
  };

  return (
    <Box sx={{ ...sx }} className={className}>
      {/* Header */}
      {(title || subtitle) && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {title && (
                <Typography variant="h4" fontWeight={700} gutterBottom={!!subtitle}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {lastGlobalRefresh && (
                <Typography variant="caption" color="text.secondary">
                  Last update: {lastGlobalRefresh.toLocaleTimeString()}
                </Typography>
              )}
              {globalLoading && <CircularProgress size={20} />}
              <Tooltip title={isPaused ? "Resume updates" : "Pause updates"}>
                <IconButton
                  size="small"
                  onClick={() => setIsPaused(!isPaused)}
                  color={isPaused ? "primary" : "default"}
                >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh now">
                <IconButton size="small" onClick={globalRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <IconButton size="small">
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Status indicators */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              size="small"
              color={autoRefresh ? 'success' : 'default'}
              variant="outlined"
            />
            {enableWebSocket && (
              <Chip
                label="WebSocket connected"
                size="small"
                color="info"
                variant="outlined"
              />
            )}
            {isPaused && (
              <Chip
                label="Updates paused"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Widgets Grid */}
      <Grid container spacing={spacing}>
        <AnimatePresence>
          {widgets.map((widget) => (
            <Grid
              key={widget.id}
              item
              xs={12}
              sm={6}
              md={12 / columns}
              sx={{ minHeight: 200 }}
            >
              {renderWidget(widget)}
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>
    </Box>
  );
};

export default RealtimeDashboard;