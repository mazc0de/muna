// Every route in one place. Keep in sync with <Routes> in App.tsx.
export const paths = {
  login: '/login',
  register: '/register',
  items: '/',
  item: (id: string) => `/items/${id}`,
  trips: '/trips',
  newTrip: '/trips/new',
  trip: (id: string) => `/trips/${id}`,
} as const
