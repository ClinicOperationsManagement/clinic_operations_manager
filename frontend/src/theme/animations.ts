import { Variants } from 'framer-motion';

// Animation variants for different use cases
export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } as Variants,

  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 },
  } as Variants,

  fadeInDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  } as Variants,

  fadeInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  } as Variants,

  fadeInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  } as Variants,

  // Slide animations
  slideInLeft: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  } as Variants,

  slideInRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  } as Variants,

  slideInUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  } as Variants,

  slideInDown: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  } as Variants,

  // Scale animations
  scaleIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  } as Variants,

  scaleOut: {
    initial: { scale: 1.2, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 },
  } as Variants,

  // Bounce animations
  bounceIn: {
    initial: { scale: 0.3, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 100
      }
    },
    exit: { scale: 0.3, opacity: 0 },
  } as Variants,

  bounceInUp: {
    initial: { y: 100, scale: 0.8, opacity: 0 },
    animate: {
      y: 0,
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 80
      }
    },
    exit: { y: 100, scale: 0.8, opacity: 0 },
  } as Variants,

  // Elastic animations
  elasticIn: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200,
        restDelta: 0.001
      }
    },
    exit: { scale: 0, opacity: 0 },
  } as Variants,

  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,

  // Stagger animations for lists
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  } as Variants,

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,

  // Loading animations
  loadingPulse: {
    animate: {
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  } as Variants,

  loadingSpin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  } as Variants,

  loadingBounce: {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  } as Variants,

  // Shimmer effect for skeletons
  shimmer: {
    initial: { x: -200 },
    animate: {
      x: 200,
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "linear"
      }
    },
  } as Variants,

  // Card hover effects
  cardHover: {
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  } as Variants,

  // Button animations
  buttonHover: {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  } as Variants,

  // Progress animations
  progressGrow: {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,

  // Notification animations
  notificationSlide: {
    initial: { x: 300, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      x: 300,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,

  // Modal animations
  modalAppear: {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.15,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,

  // Drawer animations
  drawerSlide: {
    initial: { x: '-100%' },
    animate: {
      x: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      x: '-100%',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,

  // Number counting animation
  countUp: {
    initial: { scale: 0.5, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,

  // Chart animations
  chartDraw: {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut"
      }
    },
  } as Variants,

  // Tab animation
  tabIndicator: {
    initial: { width: 0 },
    animate: {
      width: '100%',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,

  // Search field animation
  searchExpand: {
    initial: { width: 0, opacity: 0 },
    animate: {
      width: 'auto',
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      width: 0,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
  } as Variants,
};

// Animation duration constants
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
  verySlow: 1.2,
};

// Easing functions
export const easings = {
  easeInOut: [0.25, 0.1, 0.25, 1],
  easeOut: [0.0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.25, 0.46, 0.45, 0.94],
};

// Animation presets for common use cases
export const presets = {
  // Smooth entrance animations
  entrance: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: durations.normal,
        ease: easings.easeInOut
      }
    },
  },

  // Fast hover animations
  hover: {
    whileHover: {
      scale: 1.05,
      transition: {
        duration: durations.fast,
        ease: easings.easeOut
      }
    },
  },

  // Loading state
  loading: {
    animate: {
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Success feedback
  success: {
    initial: { scale: 0 },
    animate: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: durations.normal,
        ease: easings.bounce
      }
    },
  },

  // Error shake animation
  error: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: durations.normal,
        ease: easings.easeInOut
      }
    },
  },
};

// Responsive animation variants
export const responsive = {
  mobile: {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: durations.fast,
        ease: easings.easeOut
      }
    },
  },
  desktop: {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: durations.normal,
        ease: easings.easeInOut
      }
    },
  },
};

// Scroll-triggered animations
export const scrollReveal = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    }
  },
};

// Utility functions for animation properties
export const getSpringConfig = (stiffness = 100, damping = 10) => ({
  type: "spring",
  stiffness,
  damping,
});

export const getTweenConfig = (duration = durations.normal, ease = easings.easeInOut) => ({
  duration,
  ease,
});

export const getStaggerDelay = (index: number, baseDelay = 0.1) => index * baseDelay;

// Accessibility considerations
export const reducedMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};