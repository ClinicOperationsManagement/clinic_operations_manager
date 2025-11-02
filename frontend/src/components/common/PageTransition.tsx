import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Box, BoxProps } from '@mui/material';
import { animations, durations, easings } from '../../theme/animations';

export interface PageTransitionProps extends BoxProps {
  // Transition type
  transition?: 'fade' | 'slide' | 'scale' | 'flip' | 'none';

  // Transition direction (for slide transitions)
  direction?: 'up' | 'down' | 'left' | 'right';

  // Animation duration
  duration?: number;

  // Animation easing
  ease?: any;

  // Custom variants
  variants?: any;

  // Layout animation
  layout?: boolean;

  // Children
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  transition = 'fade',
  direction = 'up',
  duration = durations.normal,
  ease = easings.easeInOut,
  variants,
  layout = false,
  children,
  ...boxProps
}) => {
  const location = useLocation();
  const controls = useAnimation();
  const isInitialMount = useRef(true);

  // Determine if we're navigating forward or backward
  const getNavigationDirection = () => {
    // This is a simplified version - in a real app you'd track navigation history
    return direction;
  };

  // Get transition variants
  const getTransitionVariants = () => {
    if (variants) return variants;

    const navDirection = getNavigationDirection();

    switch (transition) {
      case 'fade':
        return animations.pageTransition;

      case 'slide':
        switch (navDirection) {
          case 'up':
            return animations.slideInUp;
          case 'down':
            return animations.slideInDown;
          case 'left':
            return animations.slideInLeft;
          case 'right':
            return animations.slideInRight;
          default:
            return animations.slideInUp;
        }

      case 'scale':
        return animations.scaleIn;

      case 'flip':
        return {
          initial: { rotateY: -90, opacity: 0 },
          animate: { rotateY: 0, opacity: 1 },
          exit: { rotateY: 90, opacity: 0 },
        };

      default:
        return animations.pageTransition;
    }
  };

  // Start animation when location changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    controls.start('animate');
  }, [location.pathname, controls]);

  // Prevent animation on initial mount
  const shouldAnimate = !isInitialMount.current;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={shouldAnimate ? getTransitionVariants() : undefined}
        initial={shouldAnimate ? 'initial' : false}
        animate={shouldAnimate ? 'animate' : false}
        exit={shouldAnimate ? 'exit' : false}
        transition={{
          duration,
          ease,
        }}
        layout={layout}
      >
        <Box {...boxProps}>
          {children}
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

// Preset page transition components
export const FadeTransition: React.FC<Omit<PageTransitionProps, 'transition'>> = (props) => (
  <PageTransition {...props} transition="fade" />
);

export const SlideUpTransition: React.FC<Omit<PageTransitionProps, 'transition' | 'direction'>> = (props) => (
  <PageTransition {...props} transition="slide" direction="up" />
);

export const SlideLeftTransition: React.FC<Omit<PageTransitionProps, 'transition' | 'direction'>> = (props) => (
  <PageTransition {...props} transition="slide" direction="left" />
);

export const ScaleTransition: React.FC<Omit<PageTransitionProps, 'transition'>> = (props) => (
  <PageTransition {...props} transition="scale" />
);

// Layout animation wrapper for content reorganization
export const LayoutTransition: React.FC<BoxProps> = ({ children, ...props }) => (
  <Box
    component={motion.div}
    layout
    transition={{
      duration: durations.normal,
      ease: easings.easeInOut,
    }}
    {...props}
  >
    {children}
  </Box>
);

// Staggered container for list items
export const StaggeredTransition: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'scaleIn';
}> = ({
  children,
  staggerDelay = 0.1,
  animation = 'fadeInUp'
}) => {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = animations[animation] || animations.fadeInUp;

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate">
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          custom={index}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Route change animation wrapper
export const RouteTransition: React.FC<{
  children: React.ReactNode;
  timeout?: number;
}> = ({ children, timeout = 300 }) => {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), timeout);
    return () => clearTimeout(timer);
  }, [location.pathname, timeout]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitioning ? 0.7 : 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Shared element transition for hero elements
export const SharedElementTransition: React.FC<{
  children: React.ReactNode;
  layoutId: string;
}> = ({ children, layoutId }) => (
  <motion.div layoutId={layoutId}>
    {children}
  </motion.div>
);

// Animated switch for toggling content
export const AnimatedSwitch: React.FC<{
  value: boolean;
  onTrue: React.ReactNode;
  onFalse: React.ReactNode;
  animation?: 'fade' | 'slide' | 'scale';
}> = ({ value, onTrue, onFalse, animation = 'fade' }) => {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { x: value ? -20 : 20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: value ? 20 : -20, opacity: 0 },
    },
    scale: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.8, opacity: 0 },
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value.toString()}
        variants={variants[animation]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: durations.normal }}
      >
        {value ? onTrue : onFalse}
      </motion.div>
    </AnimatePresence>
  );
};

// Progressive disclosure animation
export const ProgressiveDisclosure: React.FC<{
  children: React.ReactNode;
  reveal?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}> = ({
  children,
  reveal = true,
  direction = 'up',
  distance = 30
}) => {
  const getVariants = () => {
    const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
    const value = direction === 'up' || direction === 'left' ? distance : -distance;

    return {
      initial: { opacity: 0, [axis]: value },
      animate: { opacity: 1, [axis]: 0 },
      exit: { opacity: 0, [axis]: value },
    };
  };

  return (
    <motion.div
      variants={getVariants()}
      initial="initial"
      animate={reveal ? "animate" : "initial"}
      exit="exit"
      transition={{ duration: durations.normal, ease: easings.easeOut }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;