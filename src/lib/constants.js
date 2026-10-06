export const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const SORT_OPTIONS = [
  { value: 'recorded_at_desc', label: 'Newest First', column: 'recorded_at', order: 'DESC' },
  { value: 'recorded_at_asc', label: 'Oldest First', column: 'recorded_at', order: 'ASC' },
  { value: 'duration_desc', label: 'Longest Length First', column: 'duration_seconds', order: 'DESC' },
  { value: 'duration_asc', label: 'Shortest Length First', column: 'duration_seconds', order: 'ASC' },
  { value: 'file_size_desc', label: 'Largest File Size', column: 'file_size', order: 'DESC' },
  { value: 'file_size_asc', label: 'Smallest File Size', column: 'file_size', order: 'ASC' },
  { value: 'name_asc', label: 'Contact (A to Z)', column: 'person_name', order: 'ASC' },
  { value: 'name_desc', label: 'Contact (Z to A)', column: 'person_name', order: 'DESC' },
];


export const DATE_FILTER_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
];
