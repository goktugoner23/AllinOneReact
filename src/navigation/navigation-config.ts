import type { LucideIcon } from 'lucide-react-native';
import {
  Bird,
  CalendarDays,
  CheckSquare,
  Clock,
  Dumbbell,
  Home,
  StickyNote,
  Users,
  Wallet,
} from 'lucide-react-native';

export interface NavigationItem {
  title: string;
  route: string;
  icon: LucideIcon;
  blurb: string;
}

export interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      {
        title: 'Dashboard',
        route: 'Dashboard',
        icon: Home,
        blurb: 'Cross-module overview and launchpad',
      },
      {
        title: 'Transactions',
        route: 'Transactions',
        icon: Wallet,
        blurb: 'Money flow, budgets, and reports',
      },
{
        title: 'Tasks',
        route: 'Tasks',
        icon: CheckSquare,
        blurb: 'Action queue with focus views',
      },
      {
        title: 'Notes',
        route: 'Notes',
        icon: StickyNote,
        blurb: 'Second brain and attachment library',
      },
      {
        title: 'Calendar',
        route: 'Calendar',
        icon: CalendarDays,
        blurb: 'Events, reminders, and planning rhythm',
      },
    ],
  },
  {
    id: 'systems',
    title: 'Systems',
    items: [
      {
        title: 'Workout',
        route: 'Workout',
        icon: Dumbbell,
        blurb: 'Programs, sessions, and progression',
      },
      {
        title: 'WT Registry',
        route: 'WTRegistry',
        icon: Users,
        blurb: 'Students, registrations, and seminars',
      },
      {
        title: 'History',
        route: 'History',
        icon: Clock,
        blurb: 'Unified timeline across the system',
      },
    ],
  },
  {
    id: 'intelligence',
    title: 'Intelligence',
    items: [
      {
        title: 'Muninn',
        route: 'Muninn',
        icon: Bird,
        blurb: 'AI agent, memory, and conversation archive',
      },
    ],
  },
];

export function findNavigationItem(routeName: string) {
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (item.route === routeName) {
        return { group, item };
      }
    }
  }
  return null;
}
