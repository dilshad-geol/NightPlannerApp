import type { TaskPriority } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const priorityStyles: Record<TaskPriority, string> = {
    low: 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30',
    high: 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30',
  };

  return (
    <Badge variant="outline" className={cn(priorityStyles[priority], 'capitalize', className)}>
      {priority}
    </Badge>
  );
}
