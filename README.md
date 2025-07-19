# IntentKit Sandbox UI

A modern web interface for creating, managing, and chatting with IntentKit agents. Built with Next.js, TypeScript, and integrated with the Nation API for agent management and Supabase for authentication.

## Features

### Agent Management
- **Template-Based Creation**: Quick agent creation using predefined templates
- **Custom Agent Builder**: Create agents with custom configurations
- **Agent Dashboard**: View and manage all your agents
- **Real-time Updates**: Live updates of agent status and configurations

### Authentication & Security
- **Supabase Authentication**: Secure email/password authentication
- **Session Management**: Persistent login sessions with automatic token refresh
- **Protected Routes**: Authentication-required features and API access
- **HTTPBearer Authentication**: Secure API communication with the Nation API

### Chat & Communication
- **Real-time Chat**: Chat with your agents using proper Nation API endpoints
- **Chat Threads**: Organized conversation threads for each agent
- **Skill Visualization**: See which skills are being used in responses
- **Message History**: Navigate through previous messages with arrow keys

### API Integration
- **Nation API**: Full integration with Nation IntentKit API
- **Proper Endpoints**: Uses correct REST endpoints for agent and chat management
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Base URL Configuration**: Easily switch between local and deployed API instances

### Logging & Debugging
- **Development Logging**: Comprehensive logging system for debugging
- **Production Safety**: Logs are automatically disabled in production
- **Component Tracking**: Track component lifecycle and user interactions
- **API Monitoring**: Monitor all API calls, responses, and errors
- **Authentication Events**: Track authentication flows and session management

## Usage

### Main Application
1. **Sign In**: Create account or sign in with email/password
2. **Browse Agents**: View all available agents or your own agents
3. **Create Agent**: Use templates for quick creation or create custom agents
4. **Chat**: Start conversations with any agent

### Mini-App (Mobile Optimized)
1. Visit `/mini-app` for mobile-first experience
2. Sign in with your account
3. Select a template to instantly create and chat with an agent
4. Streamlined flow: Template → Create → Chat

## Template System

The application includes three pre-configured templates:

### Customer Support Agent
- **Skills**: Tavily (web search) + Firecrawl (web scraping)
- **Use Case**: Answer customer questions with web research
- **Features**: Search current information, scrape documentation

### Social Media Manager
- **Skills**: Twitter + Tavily + Firecrawl
- **Use Case**: Manage social media presence and content
- **Features**: Post tweets, research trends, analyze content

### Research Assistant
- **Skills**: Tavily (web search)
- **Use Case**: Research and analysis tasks
- **Features**: Comprehensive web search and information gathering

## Configuration

### Base URL Settings
- **Default**: Configured in `lib/utils/config.ts` (currently https://sandbox.service.crestal.dev)
- **Local**: Can be changed to http://127.0.0.1:8000 for local development
- **Dynamic**: Configurable through the UI settings panel

### Environment Variables
```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Configuration (Optional)
NEXT_PUBLIC_IS_DEV=true  # Enable development logging
NODE_ENV=development     # Automatically enables logging
```

### Logging Configuration

The application includes a comprehensive logging system controlled by the `IS_DEV` flag:

#### Development Mode (Logging Enabled)
- Set `NEXT_PUBLIC_IS_DEV=true` or `NODE_ENV=development`
- All logs will be displayed in the browser console
- Includes API calls, authentication events, component lifecycle, and errors

#### Production Mode (Logging Disabled)
- Set `NEXT_PUBLIC_IS_DEV=false` or `NODE_ENV=production`
- All logging is disabled for performance and security
- No sensitive information logged in production

#### Log Categories
- **API Calls**: All HTTP requests and responses
- **Authentication**: Sign in/out events and token management
- **Components**: React component lifecycle events
- **Errors**: Application and API errors with context
- **User Actions**: Button clicks, form submissions, navigation

#### Logger Usage Example
```typescript
import logger from '../utils/logger';

// Log API calls
logger.apiCall('POST', '/agents', agentData);

// Log authentication events
logger.auth('User signed in', { userId: user.id });

// Log component events
logger.component('mounted', 'ComponentName');

// Log errors with context
logger.error('Failed to create agent', { error: error.message });
```

## Authentication

The application uses Supabase for user authentication:

1. **Sign Up**: Create a new account with email/password
2. **Sign In**: Access your account and agents
3. **Session Management**: Automatic token refresh and persistence
4. **Secure API Access**: All API calls authenticated with bearer tokens

## Development

### Getting Started
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Project Structure
- `/pages` - Next.js pages and routing
- `/components` - Reusable React components
- `/hooks` - Custom React hooks (auth, API)
- `/utils` - Utility functions (logger, API client, templates)
- `/constants` - Configuration constants
- `/types` - TypeScript type definitions
- `/styles` - Global CSS and styling

### Key Files
- `utils/logger.ts` - Logging utility with development/production modes
- `utils/apiClient.ts` - API client with authentication and error handling
- `hooks/useSupabaseAuth.ts` - Authentication hook
- `constants/config.ts` - Application configuration including IS_DEV flag
- `components/Header.tsx` - Reusable header with authentication

## Deployment

For production deployment:

1. Set environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   NEXT_PUBLIC_IS_DEV=false  # Disable logging
   NODE_ENV=production
   ```

2. Build and deploy:
   ```bash
   npm run build
   npm start
   ```
   
## Contributing

Contributions to this UI project are welcome. Please feel free to submit a PR or create an issue.

## License

This project is licensed under the MIT License.
