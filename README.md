# PrePulse

PrePulse is a lightweight tool designed for day traders who want a fast and intuitive summary of the market's pulse before the opening bell. Built using Next.js, Supabase, and Resend.

## 🎯 Features

- **Daily Market Pulse**: Comprehensive premarket analysis with SPY/IWM rotation tracking
- **Market Strength Indicator**: Visual gauge showing Bullish/Neutral/Bearish market conditions
- **Breadth Score**: Real-time market breadth analysis (0-100 scale)
- **Sector Analysis**: Leading and lagging sector identification
- **Email Alerts**: Automated daily alerts sent by 8:30am EST
- **Admin Panel**: Easy-to-use interface for daily pulse entry
- **Authentication**: Secure user management with Supabase Auth

## 🚀 Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Authentication + Database)
- **Email**: Resend API
- **Deployment**: Vercel-ready
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- A Resend account and API key
- Git installed

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd prepulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `src/utils/database.sql` to create the required tables and policies

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🤖 n8n Automation Integration

PrePulse includes n8n workflow automation for:
- Daily market summary emails
- Price movement alerts
- Data pipeline automation
- External system integrations

### Setup n8n

1. Start n8n services:
   ```bash
   npm run n8n:start
   ```

2. Access n8n interface:
   - URL: http://localhost:5678
   - Username: admin
   - Password: (set in .env.n8n file)

3. Import workflow templates from `n8n-workflows/templates/`

4. Configure Supabase credentials in n8n settings

## 📊 Database Schema

The application uses two main tables:

### `users`
- Extends Supabase auth.users
- Tracks admin privileges
- Automatically created via trigger

### `daily_pulses`
- Stores daily market analysis
- Includes SPY/IWM rotation, breadth score, sector data
- Row-level security enabled

## 🔐 Authentication

- Email/password authentication via Supabase
- Admin users can access the `/admin` panel
- Row-level security policies protect data access

## 📧 Email Alerts

Daily email alerts are sent via the Resend API:
- Triggered from the admin panel
- Sent to all registered users
- Rich HTML formatting with market data visualization
- Scheduled for 8:30am EST delivery

## 🎨 UI Components

- **Dashboard**: Main market pulse display
- **Auth Pages**: Sign in/up with form validation
- **Admin Panel**: Market data entry interface
- **Email Templates**: Rich HTML email formatting

## 🚀 Deployment

### Quick Start (Demo Mode)
For immediate testing without external services:

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd prepulse
   npm install
   ```

2. **Run in Demo Mode**:
   ```bash
   npm run dev
   ```
   The app will automatically use mock authentication when placeholder credentials are detected.

### Production Setup

1. **Supabase Configuration**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your URL and anon key
   - Run the SQL schema from `src/utils/database.sql` in your Supabase SQL editor

2. **Environment Configuration**:
   Update `.env.local` with your real credentials:
   ```bash
   # Replace placeholder values with real Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Add your Resend API key for email functionality
   RESEND_API_KEY=your_resend_api_key
   ```

3. **Email Setup** (Optional):
   - Sign up at [resend.com](https://resend.com)
   - Get your API key and add it to `.env.local`

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## Authentication Modes

### Demo Mode
- **When**: Placeholder credentials are detected in `.env.local`
- **Features**: Mock authentication using localStorage
- **Usage**: Perfect for development and testing
- **Sign-in**: Any email/password combination works

### Production Mode  
- **When**: Real Supabase credentials are configured
- **Features**: Full Supabase authentication with email verification
- **Usage**: Live deployment with real user accounts
- **Sign-in**: Requires valid user registration

## Troubleshooting

### Authentication Issues
- **"Failed to fetch"**: Check if you're using placeholder Supabase credentials (demo mode should activate automatically)
- **"Connection error"**: Verify your Supabase URL and API key are correct
- **Email not working**: Ensure Resend API key is configured for email alerts

### Development Issues
- **Build errors**: Run `npm run build` to check for TypeScript errors
- **Styling issues**: Ensure Tailwind CSS is properly configured
- **Database errors**: Verify the SQL schema has been applied to your Supabase project

## 📱 Usage

### For Traders
1. Sign up for an account
2. Receive daily email alerts at 8:30am EST
3. View market pulse on the dashboard
4. Track SPY/IWM rotation and market strength

### For Admins
1. Access the `/admin` panel
2. Enter daily market analysis
3. Save pulse data to database
4. Send email alerts to all users

## 🔧 Development

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint
```

### Project Structure

```
prepulse/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── admin/          # Admin panel
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   └── page.tsx        # Main dashboard
│   ├── components/         # Reusable components (future)
│   ├── supabase/          # Supabase client configuration
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions and SQL schema
├── public/                # Static assets
└── package.json          # Dependencies and scripts
```

## 🎯 Target Users

- Retail day traders focused on SPY, IWM, and index components
- Traders who scalp or position intraday using TA and flow confirmation
- Users who want quick actionable insights, not long reports

## 📈 Market Data

The application tracks:
- **SPY/IWM Rotation**: Which index is leading the market
- **Breadth Score**: Market participation strength (0-100)
- **Market Strength**: Overall market sentiment (Bullish/Neutral/Bearish)
- **Sector Analysis**: Leading and lagging sectors
- **Daily Summary**: Comprehensive market analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ by a trader, for traders.**

For support or questions, please contact the development team.
