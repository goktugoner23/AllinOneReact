// UI Components - Barrel Export

// Core Components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './Card';

export { SegmentedControl } from './SegmentedControl';
export type { SegmentedControlProps, SegmentedControlOption } from './SegmentedControl';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Dialog, AlertDialog } from './Dialog';
export type { DialogProps, AlertDialogProps } from './Dialog';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Avatar, AvatarGroup } from './Avatar';
export type { AvatarProps, AvatarGroupProps } from './Avatar';

export { Chip, ChipGroup } from './Chip';
export type { ChipProps, ChipGroupProps } from './Chip';

export { IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { ListItem, ListSection, ListDivider } from './List';
export type { ListItemProps, ListSectionProps, ListDividerProps } from './List';

// shadcn-style Select (native Modal-based)
export { Select, SimpleSelect } from './Select';
export type { SelectOption, SimpleSelectOption, SimpleSelectProps } from './Select';

// Text primitive
export { Text } from './text';
export type { TextProps } from './text';

export { Tabs, TabContent } from './Tabs';
export type { TabsProps, Tab, TabContentProps } from './Tabs';

export { FAB, FABGroup } from './FAB';
export type { FABProps, FABGroupProps } from './FAB';

export { ProgressBar, CircularProgress } from './ProgressBar';
export type { ProgressBarProps, CircularProgressProps } from './ProgressBar';

export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { Skeleton, SkeletonGroup, SkeletonCard, SkeletonListItem } from './Skeleton';
export type { SkeletonProps, SkeletonGroupProps } from './Skeleton';

// Legacy Components (kept for backward compatibility)
export { ErrorBoundary, useErrorHandler } from './ErrorBoundary';
export { default as MediaViewer } from './MediaViewer';
export { default as AudioPlayer } from './AudioPlayer';
export { default as VoiceRecorder } from './VoiceRecorder';
export { default as DeleteConfirmationDialog } from './DeleteConfirmationDialog';
export { default as AddFab } from './AddFab';
export { default as RefreshFab } from './RefreshFab';
export { default as LinearProgressBar } from './LinearProgressBar';
