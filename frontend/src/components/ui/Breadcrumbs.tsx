import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex mb-4">
      <ol className="flex items-center space-x-2 text-sm text-[--color-muted-foreground]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center">
              {isFirst && (
                <Home size={14} className="mr-1.5" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-[--color-foreground] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-[--color-foreground] font-medium' : ''}>
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <ChevronRight size={14} className="ml-2 text-[--color-muted]" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
