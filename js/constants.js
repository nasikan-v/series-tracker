export const PLATFORMS = {
  'Netflix':       { badge: 'N',  color: '#E50914' },
  'Viki':          { badge: 'V',  color: '#1aacff' },
  'WeTV':          { badge: 'W',  color: '#00bd96' },
  'iQIYI':         { badge: 'iQ', color: '#00be06' },
  'Crunchyroll':   { badge: 'CR', color: '#F47521' },
  'Disney+':       { badge: 'D+', color: '#1133cc' },
  'Amazon Prime':  { badge: 'AP', color: '#FF9900' },
  'YouTube':       { badge: 'YT', color: '#FF0000' },
  'GagaOOLala':    { badge: 'GG', color: '#c9006b' },
  'Other':         { badge: '?',  color: '#555555' },
};

export const PLATFORM_NAMES = Object.keys(PLATFORMS);

export const CHIP_COLORS = [
  { bg: 'rgba(108,99,255,0.13)',  text: '#a89fff' },
  { bg: 'rgba(255,99,119,0.13)', text: '#ff9faa' },
  { bg: 'rgba(99,197,255,0.13)', text: '#9fddff'  },
  { bg: 'rgba(99,255,159,0.13)', text: '#9fffcc'  },
  { bg: 'rgba(255,170,68,0.13)', text: '#ffcc88'  },
  { bg: 'rgba(255,99,255,0.13)', text: '#ff9fff'  },
];

export const STATUS_LABELS = {
  plan_to_watch: 'Plan to Watch',
  watching:      'Watching',
  completed:     'Completed',
  dropped:       'Dropped',
};

export const DAY_NAMES    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_DISPLAY  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
