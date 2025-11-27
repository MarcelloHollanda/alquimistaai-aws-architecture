/**
 * Animações e transições reutilizáveis com Framer Motion
 */

import { Variants } from 'framer-motion';

// Fade in from bottom
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Fade in from top
export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// Fade in from left
export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Fade in from right
export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Scale in
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// Stagger children animation
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Stagger item
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Slide in from bottom (for modals/drawers)
export const slideInBottom: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

// Slide in from right (for sidebars)
export const slideInRight: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

// Rotate in
export const rotateIn: Variants = {
  initial: { opacity: 0, rotate: -10 },
  animate: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: 10 },
};

// Bounce in
export const bounceIn: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

// Transition presets
export const transitions = {
  default: { duration: 0.3, ease: 'easeInOut' },
  smooth: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 10 },
};

// Viewport settings for scroll animations
export const viewport = {
  once: true,
  amount: 0.3,
};

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: transitions.spring,
};

export const hoverLift = {
  y: -5,
  transition: transitions.spring,
};

export const hoverGlow = {
  boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
  transition: transitions.smooth,
};

// Loading animations
export const pulse: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse',
      duration: 1,
    },
  },
};

export const spin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'linear',
    },
  },
};

// Page transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Card hover effect
export const cardHover = {
  scale: 1.02,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
  transition: transitions.spring,
};

// Button press effect
export const buttonPress = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

// Gradient animation keyframes
export const gradientAnimation = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'linear',
  },
};
