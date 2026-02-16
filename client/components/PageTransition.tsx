import React, { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-in' | 'slide-in-up' | 'fade-in-up';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  animation = 'fade-in-up',
}) => {
  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'slide-in-up': 'animate-slide-in-up',
    'fade-in-up': 'fade-in-up',
  };

  return (
    <div className={`${animationClasses[animation]} ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
