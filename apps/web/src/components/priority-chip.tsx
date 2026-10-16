import { Chip } from '@mui/material';
import type { Priority } from '@apree/contracts';
import { priorityColors, priorityLabels } from '../lib/labels';

export function PriorityChip({ priority }: { priority: Priority }) {
  return <Chip size="small" label={priorityLabels[priority]} icon={<span className="priority-bars"><i /><i /><i /></span>}
    sx={{ color: priorityColors[priority], bgcolor: `${priorityColors[priority]}12`, border: `1px solid ${priorityColors[priority]}26`, '& .MuiChip-icon': { color: 'inherit', marginLeft: '8px' } }} />;
}
