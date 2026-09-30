'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 600,
  formatter,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;

    const startValue = prevValueRef.current;
    const targetValue = value;
    prevValueRef.current = value;

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic: fast start, soft landing
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * easeOutProgress);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value, duration]);

  const output = formatter ? formatter(displayValue) : displayValue.toString();

  return <span className={className}>{output}</span>;
}

