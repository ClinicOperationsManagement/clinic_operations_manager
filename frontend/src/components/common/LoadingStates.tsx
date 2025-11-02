import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { animations, durations, easings } from '../../theme/animations';

export interface LoadingStatesProps {
  // Loading type
  type?: 'spinner' | 'pulse' | 'skeleton' | 'dots' | 'bars' | 'shimmer';

  // Size and dimensions
  size?: 'small' | 'medium' | 'large';
  height?: number | string;
  width?: number | string;

  // Color customization
  color?: string;
  backgroundColor?: string;

  // Text
  text?: string;
  textPosition?: 'top' | 'bottom' | 'center';

  // Animation speed
  speed?: 'slow' | 'normal' | 'fast';

  // Skeleton specific props
  skeletonVariant?: 'text' | 'rectangular' | 'circular';
  skeletonLines?: number;

  // Progress specific props
  progress?: number;
  showPercentage?: boolean;

  // Custom styling
  sx?: any;

  // Children (for custom loading content)
  children?: React.ReactNode;
}

const LoadingStates: React.FC<LoadingStatesProps> = ({
  type = 'spinner',
  size = 'medium',
  height,
  width,
  color,
  backgroundColor,
  text,
  textPosition = 'bottom',
  speed = 'normal',
  skeletonVariant = 'text',
  skeletonLines = 3,
  progress,
  showPercentage = false,
  sx = {},
  children,
}) => {
  const theme = useTheme();

  // Get size values
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 24;
      case 'medium': return 40;
      case 'large': return 64;
      default: return 40;
    }
  };

  const sizeValue = getSizeValue();
  const actualColor = color || theme.palette.primary.main;
  const actualBgColor = backgroundColor || alpha(actualColor, 0.1);

  // Get animation duration based on speed
  const getAnimationDuration = () => {
    switch (speed) {
      case 'slow': return durations.slow;
      case 'fast': return durations.fast;
      default: return durations.normal;
    }
  };

  const animationDuration = getAnimationDuration();

  // Spinner loading component
  const SpinnerLoader = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        ...sx,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: animationDuration,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <CircularProgress
          size={sizeValue}
          sx={{
            color: actualColor,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
      </motion.div>
      {text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>
        </motion.div>
      )}
    </Box>
  );

  // Pulse loading component
  const PulseLoader = () => {
    const pulseVariants = {
      animate: {
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
        transition: {
          duration: animationDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          ...sx,
        }}
      >
        <motion.div
          variants={pulseVariants}
          animate="animate"
        >
          <Box
            sx={{
              width: sizeValue,
              height: sizeValue,
              borderRadius: '50%',
              background: actualColor,
            }}
          />
        </motion.div>
        {text && (
          <motion.div
            variants={pulseVariants}
            animate="animate"
          >
            <Typography variant="body2" color="text.secondary">
              {text}
            </Typography>
          </motion.div>
        )}
      </Box>
    );
  };

  // Skeleton loading component
  const SkeletonLoader = () => (
    <Box sx={{ width: '100%', ...sx }}>
      {Array.from({ length: skeletonLines }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.1,
            ease: easings.easeOut,
          }}
        >
          <Skeleton
            variant={skeletonVariant}
            width={width || (index === skeletonLines - 1 ? '60%' : '100%')}
            height={height || (skeletonVariant === 'text' ? 20 : sizeValue)}
            sx={{
              backgroundColor: actualBgColor,
              mb: index < skeletonLines - 1 ? 1 : 0,
            }}
          />
        </motion.div>
      ))}
      {text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: skeletonLines * 0.1 }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {text}
          </Typography>
        </motion.div>
      )}
    </Box>
  );

  // Dots loading component
  const DotsLoader = () => {
    const dotVariants = {
      animate: {
        y: [0, -10, 0],
        transition: {
          duration: animationDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          ...sx,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={dotVariants}
              animate="animate"
              transition={{
                ...dotVariants.animate.transition,
                delay: index * 0.1,
              }}
            >
              <Box
                sx={{
                  width: sizeValue / 3,
                  height: sizeValue / 3,
                  borderRadius: '50%',
                  background: actualColor,
                }}
              />
            </motion.div>
          ))}
        </Box>
        {text && (
          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>
        )}
      </Box>
    );
  };

  // Bars loading component
  const BarsLoader = () => {
    const barVariants = {
      animate: {
        scaleY: [0.3, 1, 0.3],
        transition: {
          duration: animationDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          ...sx,
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
          {[0, 1, 2, 3, 4].map((index) => (
            <motion.div
              key={index}
              variants={barVariants}
              animate="animate"
              transition={{
                ...barVariants.animate.transition,
                delay: index * 0.1,
              }}
            >
              <Box
                sx={{
                  width: sizeValue / 8,
                  height: sizeValue * (0.5 + Math.random() * 0.5),
                  background: actualColor,
                  borderRadius: 1,
                }}
              />
            </motion.div>
          ))}
        </Box>
        {text && (
          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>
        )}
      </Box>
    );
  };

  // Shimmer loading component
  const ShimmerLoader = () => (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: width || '100%',
        height: height || sizeValue,
        backgroundColor: actualBgColor,
        borderRadius: 1,
        ...sx,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, transparent, ${alpha(actualColor, 0.3)}, transparent)`,
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: animationDuration * 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {text && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Progress loading component
  const ProgressLoader = () => (
    <Box
      sx={{
        width: width || '100%',
        ...sx,
      }}
    >
      {text && textPosition === 'top' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>
          {showPercentage && (
            <Typography variant="body2" color="text.secondary">
              {Math.round((progress || 0) * 100)}%
            </Typography>
          )}
        </Box>
      )}
      <Box sx={{ position: 'relative' }}>
        <LinearProgress
          variant="determinate"
          value={(progress || 0) * 100}
          sx={{
            height: height || 8,
            borderRadius: 4,
            backgroundColor: actualBgColor,
            '& .MuiLinearProgress-bar': {
              background: actualColor,
              borderRadius: 4,
            },
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.3)}, transparent)`,
            borderRadius: 4,
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: animationDuration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </Box>
      {text && textPosition === 'bottom' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>
          {showPercentage && (
            <Typography variant="body2" color="text.secondary">
              {Math.round((progress || 0) * 100)}%
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );

  // Render the appropriate loading component
  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return <SpinnerLoader />;
      case 'pulse':
        return <PulseLoader />;
      case 'skeleton':
        return <SkeletonLoader />;
      case 'dots':
        return <DotsLoader />;
      case 'bars':
        return <BarsLoader />;
      case 'shimmer':
        return <ShimmerLoader />;
      case 'progress':
        return <ProgressLoader />;
      default:
        return <SpinnerLoader />;
    }
  };

  // Custom children support
  if (children) {
    return (
      <motion.div
        animate={animations.loadingPulse.animate}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return renderLoader();
};

// Preset loading components
export const SpinnerLoading: React.FC<Omit<LoadingStatesProps, 'type'>> = (props) => (
  <LoadingStates {...props} type="spinner" />
);

export const SkeletonLoading: React.FC<Omit<LoadingStatesProps, 'type'>> = (props) => (
  <LoadingStates {...props} type="skeleton" />
);

export const PulseLoading: React.FC<Omit<LoadingStatesProps, 'type'>> = (props) => (
  <LoadingStates {...props} type="pulse" />
);

export const ProgressLoading: React.FC<Omit<LoadingStatesProps, 'type'>> = (props) => (
  <LoadingStates {...props} type="progress" />
);

// Page loading component
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      gap: 3,
    }}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <LoadingStates type="spinner" size="large" text={text} />
    </motion.div>
  </Box>
);

export default LoadingStates;