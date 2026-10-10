export interface StarterHabitDefinition {
  name: string;
  emoji: string;
  category: string;
  target_value: number;
  target_unit: string;
  description: string;
  is_favorite: boolean;
}

export const DEFAULT_STARTER_HABITS: StarterHabitDefinition[] = [
  {
    name: 'Wake up (6 am)',
    emoji: '⏰',
    category: 'Morning Routine',
    target_value: 1,
    target_unit: 'time',
    description: 'Rise early without hitting snooze',
    is_favorite: true,
  },
  {
    name: 'DSA (1hrs)',
    emoji: '📚',
    category: 'Deep Work',
    target_value: 60,
    target_unit: 'mins',
    description: 'Solve data structures & algorithm problems',
    is_favorite: true,
  },
  {
    name: 'Meditation',
    emoji: '🧘',
    category: 'Mindfulness',
    target_value: 10,
    target_unit: 'mins',
    description: '10 minutes mindful breathing practice',
    is_favorite: false,
  },
  {
    name: 'No fake dopamine',
    emoji: '📱',
    category: 'Focus',
    target_value: 1,
    target_unit: 'day',
    description: 'No doomscrolling, shorts, or mindless feeds',
    is_favorite: true,
  },
  {
    name: 'Water intake (2.5 litres)',
    emoji: '💧',
    category: 'Health',
    target_value: 2.5,
    target_unit: 'litres',
    description: 'Stay hydrated throughout the day',
    is_favorite: true,
  },
  {
    name: 'Plan next day',
    emoji: '📋',
    category: 'Productivity',
    target_value: 1,
    target_unit: 'time',
    description: 'List top 3 priorities before closing work',
    is_favorite: true,
  },
  {
    name: 'No masturbation',
    emoji: '🧘',
    category: 'Self-Control',
    target_value: 1,
    target_unit: 'day',
    description: 'Retain focus and discipline',
    is_favorite: false,
  },
  {
    name: 'Maintain GitHub/LeetCode streak',
    emoji: '💻',
    category: 'Coding',
    target_value: 1,
    target_unit: 'commit',
    description: 'Push code or submit at least 1 solution',
    is_favorite: true,
  },
  {
    name: 'Read Atomic Habits',
    emoji: '📗',
    category: 'Reading',
    target_value: 20,
    target_unit: 'pages',
    description: 'Continuous incremental self-improvement',
    is_favorite: false,
  },
  {
    name: 'Sleep before 11PM',
    emoji: '🌙',
    category: 'Health',
    target_value: 1,
    target_unit: 'time',
    description: 'Ensure 7+ hours of quality sleep',
    is_favorite: true,
  },
];
