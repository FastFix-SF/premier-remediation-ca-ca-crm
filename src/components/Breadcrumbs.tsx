import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbStructuredData } from './StructuredData';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const location = useLocation();
  
  // Generate breadcrumbs from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;
    
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', url: '/' }
    ];
    
    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      // Convert slug to readable name
      const readableName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        name: readableName,
        url: currentPath
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();
  
  if (breadcrumbItems.length <= 1) return null;

  return (
    <>
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <nav 
        className={`flex items-center space-x-1 text-sm text-muted-foreground mb-6 ${className}`}
        aria-label="Breadcrumb"
      >
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.url}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            )}
            {index === breadcrumbItems.length - 1 ? (
              <span className="text-foreground font-medium" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link
                to={item.url}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {index === 0 && <Home className="w-4 h-4" />}
                {item.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumbs;