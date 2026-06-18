// Shared animation constants for React Native Reanimated v3
// Use withSpring(value, springs.default) or withTiming(value, { duration: timings.normal })

export const springs = {
  default: { damping: 18, stiffness: 200, mass: 0.8 },
  bounce:  { damping: 12, stiffness: 180, mass: 0.6 },
  gentle:  { damping: 25, stiffness: 150, mass: 1.0 },
};

export const timings = {
  fast:   280,
  normal: 400,
  slow:   600,
  ring:   2000,
  water:  2200,
};
