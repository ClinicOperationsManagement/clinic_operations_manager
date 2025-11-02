import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform, MotionProps } from 'framer-motion';
import { Box, BoxProps } from '@mui/material';
import { animations, durations, easings, reducedMotion } from '../../theme/animations';

export interface AnimatedContainerProps extends Omit<BoxProps, 'component'> {
  // Animation type
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' |
             'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown' |
             'scaleIn' | 'bounceIn' | 'elasticIn';

  // Custom animation variants
  variants?: MotionProps['variants'];

  // Animation timing
  duration?: number;
  delay?: number;
  ease?: any;

  // Scroll trigger
  triggerOnScroll?: boolean;
  scrollOffset?: string | number;
  once?: boolean;

  // Stagger animation for children
  staggerChildren?: boolean;
  staggerDelay?: number;

  // Reduced motion support
  respectReducedMotion?: boolean;

  // Custom motion props
  whileHover?: MotionProps['whileHover'];
  whileTap?: MotionProps['whileTap'];
  animate?: MotionProps['animate'];
  initial?: MotionProps['initial'];
  exit?: MotionProps['exit'];

  // Layout animation
  layout?: boolean;
  layoutId?: string;

  // Children
  children: React.ReactNode;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  animation = 'fadeInUp',
  duration,
  delay = 0,
  ease = easings.easeInOut,
  triggerOnScroll = false,
  scrollOffset = '100px',
  once = true,
  staggerChildren = false,
  staggerDelay = 0.1,
  respectReducedMotion = true,
  variants,
  whileHover,
  whileTap,
  animate,
  initial,
  exit,
  layout = false,
  layoutId,
  children,
  ...boxProps
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once,
    margin: typeof scrollOffset === 'string' ? scrollOffset : `${scrollOffset}px`
  });
  const [shouldAnimate, setShouldAnimate] = useState(!triggerOnScroll);

  // Scroll progress for parallax effects
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  // Transform scroll progress for visual effects
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  useEffect(() => {
    if (triggerOnScroll && isInView && !shouldAnimate) {
      setShouldAnimate(true);
    }
  }, [triggerOnScroll, isInView, shouldAnimate]);

  // Get animation variants
  const getAnimationVariants = () => {
    if (variants) return variants;

    const baseVariants = animations[animation] || animations.fadeInUp;

    // Apply custom timing if specified
    if (duration || delay > 0) {
      return {
        ...baseVariants,
        animate: {
          ...baseVariants.animate,
          transition: {
            ...baseVariants.animate?.transition,
            duration: duration || durations.normal,
            delay,
            ease,
          }
        }
      };
    }

    return baseVariants;
  };

  // Handle reduced motion
  const shouldUseReducedMotion = respectReducedMotion &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finalVariants = shouldUseReducedMotion ? reducedMotion : getAnimationVariants();

  // Wrap children with stagger animation if enabled
  const wrappedChildren = staggerChildren ? (
    <motion.div variants={animations.staggerContainer}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={animations.staggerItem}
          custom={index}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  ) : children;

  // Animation props
  const motionProps: MotionProps = {
    ref,
    layout,
    layoutId,
    variants: finalVariants,
    initial: triggerOnScroll ? 'initial' : (initial || 'initial'),
    animate: triggerOnScroll ? (shouldAnimate ? 'animate' : 'initial') : (animate || 'animate'),
    exit: exit || 'exit',
    whileHover,
    whileTap,
    transition: {
      duration: duration || durations.normal,
      ease,
      delay,
    },
  };

  return (
    <AnimatePresence>
      <Box
        component={motion.div}
        {...motionProps}
        {...boxProps}
      >
        {wrappedChildren}
      </Box>
    </AnimatePresence>
  );
};

// Preset AnimatedContainer components for common use cases
export const FadeInContainer: React.FC<Omit<AnimatedContainerProps, 'animation'>> = (props) => (
  <AnimatedContainer {...props} animation="fadeIn" />
);

export const SlideUpContainer: React.FC<Omit<AnimatedContainerProps, 'animation'>> = (props) => (
  <AnimatedContainer {...props} animation="fadeInUp" />
);

export const SlideLeftContainer: React.FC<Omit<AnimatedContainerProps, 'animation'>> = (props) => (
  <AnimatedContainer {...props} animation="fadeInLeft" />
);

export const BounceInContainer: React.FC<Omit<AnimatedContainerProps, 'animation'>> = (props) => (
  <AnimatedContainer {...props} animation="bounceIn" />
);

export const ScrollRevealContainer: React.FC<Omit<AnimatedContainerProps, 'animation' | 'triggerOnScroll'>> = (props) => (
  <AnimatedContainer {...props} animation="fadeInUp" triggerOnScroll />
);

// Staggered list container
export const StaggeredListContainer: React.FC<Omit<AnimatedContainerProps, 'staggerChildren' | 'animation'>> = (props) => (
  <AnimatedContainer {...props} animation="fadeInUp" staggerChildren />
);

// Parallax container with scroll-based animations
export const ParallaxContainer: React.FC<Omit<AnimatedContainerProps, 'animation' | 'triggerOnScroll'>> = ({
  children,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);

  return (
    <Box
      component={motion.div}
      ref={ref}
      style={{ y, opacity }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Hover animation container
export const HoverAnimatedContainer: React.FC<Omit<AnimatedContainerProps, 'whileHover'>> = ({
  children,
  hoverScale = 1.05,
  hoverY = -4,
  ...props
}) => (
  <AnimatedContainer
    {...props}
    whileHover={{
      scale: hoverScale,
      y: hoverY,
      transition: {
        duration: durations.fast,
        ease: easings.easeOut
      }
    }}
  >
    {children}
  </AnimatedContainer>
);

// Loading animation container
export const LoadingAnimatedContainer: React.FC<Omit<AnimatedContainerProps, 'animate' | 'initial'>> = ({
  children,
  ...props
}) => (
  <AnimatedContainer
    {...props}
    animate={animations.loadingPulse.animate}
    initial={false}
  >
    {children}
  </AnimatedContainer>
);

// Success animation container
export const SuccessAnimatedContainer: React.FC<Omit<AnimatedContainerProps, 'animation'>> = (props) => (
  <AnimatedContainer {...props} animation="bounceIn" />
);

// Error shake animation container
export const ErrorAnimatedContainer: React.FC<Omit<AnimatedContainerProps, 'animate'>> = ({
  children,
  ...props
}) => (
  <AnimatedContainer
    {...props}
    animate={animations.error.animate}
    initial={false}
  >
    {children}
  </AnimatedContainer>
);

export default AnimatedContainer;