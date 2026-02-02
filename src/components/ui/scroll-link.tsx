import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface ScrollLinkProps extends LinkProps {
  children: React.ReactNode;
  scrollToTop?: boolean;
}

const ScrollLink: React.FC<ScrollLinkProps> = ({ 
  to, 
  children, 
  scrollToTop = true, 
  onClick,
  ...props 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
    
    // Handle hash navigation - don't scroll to top if navigating to a hash
    if (typeof to === 'string' && to.includes('#')) {
      return; // Let default behavior handle hash navigation
    }
    
    // Scroll to top for regular navigation
    if (scrollToTop) {
      window.scrollTo(0, 0);
    }
  };

  return (
    <Link to={to} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
};

export default ScrollLink;