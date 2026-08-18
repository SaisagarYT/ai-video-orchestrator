import { Skeleton } from './Skeleton';
import { Card, CardContent } from './Card';

export function WorkspaceLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Campaign Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-[var(--radius-md)]" />
          <Skeleton className="h-8 w-28 rounded-[var(--radius-md)]" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 pb-2">
        <Skeleton className="h-8 w-20 rounded-[var(--radius-md)]" />
        <Skeleton className="h-8 w-20 rounded-[var(--radius-md)]" />
        <Skeleton className="h-8 w-24 rounded-[var(--radius-md)]" />
        <Skeleton className="h-8 w-24 rounded-[var(--radius-md)]" />
        <Skeleton className="h-8 w-16 rounded-[var(--radius-md)]" />
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-36 w-full rounded-none" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-8 w-full rounded-[var(--radius-md)]" />
      <Skeleton className="h-8 w-full rounded-[var(--radius-md)]" />
      <Skeleton className="h-8 w-full rounded-[var(--radius-md)]" />
      <div className="pt-6 border-t border-[var(--border-subtle)] space-y-3">
        <Skeleton className="h-8 w-full rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}
