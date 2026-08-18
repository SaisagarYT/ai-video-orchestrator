import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs ${className}`}>
      <ol className="flex items-center space-x-1.5 list-none m-0 p-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] mx-1 shrink-0 select-none" />
              )}
              {isLast || (!item.href && !item.onClick) ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`font-medium truncate max-w-[200px] ${
                    isLast
                      ? 'text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate max-w-[200px] cursor-pointer focus:outline-none focus:underline"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
