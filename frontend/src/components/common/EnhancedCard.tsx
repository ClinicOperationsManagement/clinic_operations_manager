import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardProps,
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { animations, durations, easings } from '../../theme/animations';

export interface EnhancedCardProps extends Omit<CardProps, 'elevation'> {
  // Glass morphism effect
  glass?: boolean;
  glassBlur?: number;
  glassOpacity?: number;

  // Gradient overlay
  gradient?: 'primary' | 'secondary' | 'medical' | 'success' | 'warning' | 'error' | 'custom';
  customGradient?: string;
  gradientOpacity?: number;

  // Enhanced hover effects
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'border' | 'none';
  hoverScale?: number;
  hoverY?: number;
  hoverDuration?: number;

  // Border customization
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';

  // Loading state
  loading?: boolean;
  loadingSkeleton?: boolean;

  // Animation
  animation?: 'fadeIn' | 'fadeInUp' | 'slideInLeft' | 'scaleIn' | 'bounceIn';
  animationDelay?: number;

  // Interactive states
  clickable?: boolean;
  selected?: boolean;

  // Custom content overlay
  overlay?: React.ReactNode;
  overlayPosition?: 'top' | 'bottom' | 'center';

  // Children
  children: React.ReactNode;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  glass = false,
  glassBlur = 10,
  glassOpacity = 0.8,
  gradient,
  customGradient,
  gradientOpacity = 1,
  hoverEffect = 'lift',
  hoverScale = 1.02,
  hoverY = -4,
  hoverDuration = durations.normal,
  borderColor,
  borderWidth = 1,
  borderStyle = 'solid',
  loading = false,
  loadingSkeleton = false,
  animation = 'fadeInUp',
  animationDelay = 0,
  clickable = false,
  selected = false,
  overlay,
  overlayPosition = 'bottom',
  children,
  onClick,
  sx = {},
  ...cardProps
}) => {
  const theme = useTheme();

  // Get gradient based on type
  const getGradient = () => {
    if (customGradient) return customGradient;

    const gradients = theme.custom?.gradients;
    if (!gradients) return 'none';

    switch (gradient) {
      case 'primary': return gradients.primary;
      case 'secondary': return gradients.secondary;
      case 'medical': return gradients.medical;
      case 'success': return gradients.success;
      case 'warning': return gradients.warning;
      case 'error': return gradients.error;
      default: return 'none';
    }
  };

  // Get hover animation
  const getHoverAnimation = () => {
    switch (hoverEffect) {
      case 'lift':
        return {
          y: hoverY,
          boxShadow: `0 8px 24px ${alpha('#000', 0.15)}`,
          transition: { duration: hoverDuration, ease: easings.easeOut }
        };
      case 'scale':
        return {
          scale: hoverScale,
          transition: { duration: hoverDuration, ease: easings.easeOut }
        };
      case 'glow':
        return {
          boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
          transition: { duration: hoverDuration, ease: easings.easeOut }
        };
      case 'border':
        return {
          borderColor: theme.palette.primary.main,
          borderWidth: borderWidth + 1,
          transition: { duration: hoverDuration, ease: easings.easeOut }
        };
      default:
        return {};
    }
  };

  // Get glass morphism styles
  const getGlassStyles = () => {
    if (!glass) return {};

    return {
      background: theme.palette.mode === 'dark'
        ? `rgba(26, 31, 46, ${glassOpacity})`
        : `rgba(255, 255, 255, ${glassOpacity})`,
      backdropFilter: `blur(${glassBlur}px)`,
      WebkitBackdropFilter: `blur(${glassBlur}px)`,
      border: `1px solid ${theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.1)'
      }`,
    };
  };

  // Get loading skeleton styles
  const getLoadingStyles = () => {
    if (!loadingSkeleton) return {};

    return {
      position: 'relative',
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.text.primary, 0.1)}, transparent)`,
        animation: 'shimmer 1.5s infinite',
      },
      '@keyframes shimmer': {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
    };
  };

  // Base card styles
  const baseStyles = {
    position: 'relative',
    borderRadius: theme.custom?.borderRadius?.lg || '12px',
    overflow: 'hidden',
    cursor: clickable ? 'pointer' : 'default',
    transition: `all ${hoverDuration}ms ${easings.easeOut}`,
    ...getGlassStyles(),
    ...getLoadingStyles(),
    ...(gradient && {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: getGradient(),
        opacity: gradientOpacity,
        zIndex: 0,
      },
    }),
    ...(selected && {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    }),
    ...(borderColor && {
      borderColor,
      borderWidth,
      borderStyle,
    }),
    ...(clickable && {
      '&:active': {
        transform: 'scale(0.98)',
      },
    }),
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
    ...sx,
  };

  // Animation variants
  const animationVariants = {
    initial: animations[animation]?.initial || { opacity: 0 },
    animate: animations[animation]?.animate || { opacity: 1 },
    exit: animations[animation]?.exit || { opacity: 0 },
  };

  return (
    <motion.div
      variants={animationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: durations.normal,
        delay: animationDelay,
        ease: easings.easeOut,
      }}
      whileHover={hoverEffect !== 'none' ? getHoverAnimation() : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      <Card
        elevation={0}
        sx={baseStyles}
        {...cardProps}
      >
        {/* Loading overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: alpha(theme.palette.background.paper, 0.8),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Loading...
              </Typography>
            </motion.div>
          </Box>
        )}

        {/* Main content */}
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          {children}
        </CardContent>

        {/* Overlay */}
        {overlay && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              p: 2,
              background: `linear-gradient(to ${overlayPosition}, ${
                overlayPosition === 'top' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)'
              }, ${
                overlayPosition === 'bottom' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)'
              })`,
              zIndex: 2,
              ...(overlayPosition === 'top' && { top: 0 }),
              ...(overlayPosition === 'bottom' && { bottom: 0 }),
              ...(overlayPosition === 'center' && {
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.7)',
              }),
            }}
          >
            {overlay}
          </Box>
        )}
      </Card>
    </motion.div>
  );
};

// Preset card variants
export const GlassCard: React.FC<Omit<EnhancedCardProps, 'glass'>> = (props) => (
  <EnhancedCard {...props} glass />
);

export const GradientCard: React.FC<Omit<EnhancedCardProps, 'gradient'>> = (props) => (
  <EnhancedCard {...props} gradient="primary" />
);

export const StatsCard: React.FC<Omit<EnhancedCardProps, 'hoverEffect'>> = (props) => (
  <EnhancedCard {...props} hoverEffect="lift" hoverY={-6} />
);

export const InteractiveCard: React.FC<Omit<EnhancedCardProps, 'clickable' | 'hoverEffect'>> = (props) => (
  <EnhancedCard {...props} clickable hoverEffect="scale" />
);

export const SelectedCard: React.FC<Omit<EnhancedCardProps, 'selected'>> = (props) => (
  <EnhancedCard {...props} selected />
);

export default EnhancedCard;