# EarnBucks - Get Paid to Complete Tasks Online

A full-stack web application where users can earn real money by completing surveys, watching videos, installing apps, and participating in contests.

## Features

- **User Authentication**: Google OAuth + Email/Password registration
- **Task Completion**: Multiple task types (surveys, videos, apps, micro-tasks, ads, content)
- **Earnings Tracking**: Real-time balance and earnings history
- **Referral System**: 10% commission on all referral earnings
- **Withdrawal System**: PayPal, Bitcoin, Skrill, Wise support ($3 minimum)
- **Daily & Weekly Contests**: $2,000 weekly prize pool
- **Admin Panel**: Full user and task management
- **Notifications**: Real-time in-app notifications

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, tRPC
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Google OAuth + JWT
- **Deployment**: Docker, Railway, TiDB Cloud

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm
- MySQL 8.0+

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm run db:push

# Start development server
pnpm run dev
```

### Environment Variables

```
NODE_ENV=development
VITE_APP_ID=timebucks-clone
JWT_SECRET=your-secret-key
DATABASE_URL=mysql://user:password@localhost:3306/timebucks
OAUTH_SERVER_URL=http://localhost:3000
VITE_OAUTH_PORTAL_URL=http://localhost:3000
VITE_APP_ID=timebucks-clone
```

## Development

```bash
# Start dev server
pnpm run dev

# Build for production
pnpm run build

# Start production server
NODE_ENV=production node dist/index.js

# Run tests
pnpm run test

# Format code
pnpm run format
```

## Deployment

### Using Railway

1. Push code to GitHub
2. Connect GitHub repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy!

### Using Docker

```bash
docker build -t earnbucks .
docker run -p 3000:3000 -e DATABASE_URL=your-db-url earnbucks
```

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── lib/        # Utilities
│   └── index.html
├── server/              # Node.js backend
│   ├── _core/          # Core server logic
│   ├── routers.ts      # tRPC routers
│   └── db.ts           # Database setup
├── drizzle/            # Database schema & migrations
├── shared/             # Shared types & constants
└── package.json
```

## API Routes

- `/api/trpc/*` - tRPC API endpoints
- `/api/oauth/callback` - OAuth callback handler
- `/` - Frontend (served by Vite in dev, static in prod)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
