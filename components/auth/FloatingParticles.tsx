import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: Animated.Value;
  opacity: Animated.Value;
  size: number;
  duration: number;
}

export default function FloatingParticles() {
  const particles = useRef<Particle[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const count = 12;
    particles.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: new Animated.Value(height + 10),
      opacity: new Animated.Value(0),
      size: 1.5 + Math.random() * 2.5,
      duration: 8000 + Math.random() * 10000,
    }));

    particles.current.forEach((p, idx) => {
      const animate = () => {
        p.y.setValue(height + 10);
        p.opacity.setValue(0);
        Animated.parallel([
          Animated.timing(p.y, {
            toValue: -20,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.opacity, {
              toValue: 0.7,
              duration: p.duration * 0.1,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0.5,
              duration: p.duration * 0.8,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: p.duration * 0.1,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animate());
      };

      setTimeout(animate, idx * 1200);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.current.map(p => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: '#00E5C8',
            opacity: p.opacity,
            transform: [{ translateY: p.y }],
          }}
        />
      ))}
    </View>
  );
}
