# PRD – Voxinta AI Voice Agent (Vercel-Only MVP)

## Project Name

Voxinta AI Voice Agent

## Vision

Build a modern, production-ready AI Voice Agent platform that is deployed entirely on Vercel for the MVP. The application should provide natural, real-time voice conversations, memory, document understanding (RAG), and tool calling while maintaining a clean, modular, scalable architecture. The platform should be designed so that future enterprise features can be added without rewriting the core architecture.

## Primary Goal

Create an AI employee capable of:

- Listening to users
- Understanding speech
- Reasoning with an LLM
- Remembering previous conversations
- Answering from uploaded documents
- Using external tools
- Responding naturally with voice
- Managing multiple AI agents
- Running as a SaaS platform

## Deployment Requirement

Entire application must be deployed on Vercel. Use:

- Next.js App Router
- Vercel Functions
- Vercel Edge Functions where appropriate
- Vercel Blob (if needed)
- Vercel Cron (future use)

No Render. No Railway. No Koyeb. No Oracle Cloud. No Docker deployment for the MVP. Everything should be compatible with Vercel.

## Tech Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI
- Framer Motion
- React Hook Form
- Zod

### Backend

Backend should live inside the Next.js application. Use:

- Next.js API Routes
- Server Actions
- Route Handlers
- Edge Runtime where beneficial

No separate backend repository. Everything should exist in one codebase.

### Database

Supabase Free. Use:

- PostgreSQL
- Authentication
- Storage
- Row Level Security

### Authentication

Supabase Auth. Support:

- Email login
- Email signup
- Password reset
- Session management

### LLM

Groq Free API. Architecture should allow future providers:

- OpenAI
- Claude
- Gemini
- Ollama

without changing the overall architecture.

### Speech to Text

Use browser-native speech recognition first for the MVP. Abstract the interface so it can later be replaced with:

- Faster Whisper
- Whisper API
- Other providers

without affecting the rest of the application.

### Text to Speech

Use browser SpeechSynthesis API. Design the code so it can later support:

- Piper
- ElevenLabs
- OpenAI TTS

### Memory

LangChain ChromaDB interface abstraction (future-ready), but for the Vercel-only MVP use Supabase/Postgres-based storage for conversation history and retrieved context.

### Embeddings

Design an embedding service abstraction. Allow future providers without changing business logic.

## Core Modules

### Landing Page

Professional SaaS landing page. Sections:

- Hero
- Features
- AI Demo
- Pricing
- Testimonials
- FAQ
- CTA
- Login
- Dashboard

### Authentication

Features:

- Login
- Signup
- Forgot Password
- Email Verification
- User Profile

### Dashboard

Dashboard should display:

- AI Agents
- Conversations
- Analytics
- Knowledge Base
- Integrations
- Settings
- Usage

### AI Agent Management

Users can create unlimited agents. Each agent includes:

- Name
- Description
- Avatar
- Prompt
- Personality
- Welcome Message
- Voice
- Temperature
- Language
- Max Tokens

### Voice Conversation

Workflow:

```
User clicks microphone
        ↓
Speech Recognition
        ↓
Transcript
        ↓
Groq
        ↓
Response
        ↓
Speech Synthesis
        ↓
Continue conversation
```

Conversation should feel natural with minimal latency.

### Chat Interface

Support:

- Voice
- Text
- Typing Indicator
- Speaking Indicator
- Conversation History
- Markdown Rendering
- Code Blocks
- Copy Buttons
- Regenerate Response
- Stop Generation

### Memory

Maintain:

**Short-Term Memory**

- Current conversation

**Long-Term Memory**

- Previous conversations
- User preferences
- User profile
- Agent context

### Knowledge Base (RAG)

Users can upload:

- PDF
- DOCX
- TXT
- Markdown

Pipeline:

```
Upload
   ↓
Extract Text
   ↓
Chunk
   ↓
Generate Embeddings
   ↓
Store
   ↓
Retrieve During Chat
```

### Tool Calling

Architecture should support tools such as:

- Calculator
- Weather
- Web Search
- Email
- Calendar
- Database
- REST APIs
- Custom Functions

Tool system must be plugin-based. Adding new tools should require minimal changes.

### Conversation History

Store:

- Messages
- Role
- Timestamp
- Agent
- Response Time
- Metadata

Support:

- Search
- Filter
- Delete
- Export

### Analytics

Dashboard metrics:

- Conversations
- Users
- Response Time
- Messages
- Daily Usage
- Weekly Usage
- Monthly Usage

### Settings

Allow users to configure:

- Profile
- Theme
- AI Settings
- API Keys
- Notifications
- Voice Preferences

### Multi-Agent

Allow users to build specialized AI agents. Examples:

- Customer Support
- Sales
- HR
- Tutor
- Personal Assistant
- Technical Support

Each agent has:

- Independent Prompt
- Independent Memory
- Independent Documents
- Independent Settings

### Admin Panel

Administrator features:

- User Management
- Conversation Logs
- Analytics
- Reports
- System Monitoring
- Feature Flags

## UI Requirements

Style:

- Premium
- Minimal
- Modern SaaS
- Glassmorphism (subtle)
- Responsive
- Fast
- Smooth animations
- Mobile-first

## Folder Structure

```
/app
    /(landing)
    /(dashboard)
    /(auth)
    /api
/components
/features
    /chat
    /voice
    /agents
    /knowledge
    /analytics
    /settings
/lib
/services
/hooks
/types
/utils
/public
/styles
```

## Coding Standards

- TypeScript throughout
- Strict typing
- Reusable components
- Feature-based architecture
- Clean code
- SOLID principles
- Centralized configuration
- Environment variables
- Error boundaries
- Logging
- Input validation with Zod
- Consistent API responses
- Accessibility support

## Future Roadmap (Design for Extensibility)

The architecture should make it straightforward to add:

- MCP server support
- Multiple LLM providers
- Local models
- Voice cloning
- Emotion detection
- Vision capabilities
- Live phone calls
- WhatsApp integration
- Slack integration
- CRM integrations
- Workflow builder
- AI automation engine
- Team workspaces
- SaaS subscriptions
- White-label deployments
- Marketplace for tools and agents

## Claude Development Instructions

- Treat this as a production SaaS project, not a demo.
- Build the application incrementally with clean commits and modular features.
- Keep the frontend, API routes, business logic, and UI well separated within the Next.js project.
- Use server-side functionality only where necessary to optimize performance on Vercel.
- Design all services behind interfaces so providers (LLM, STT, TTS, embeddings) can be swapped later without affecting the rest of the application.
- Optimize for maintainability, scalability, security, and low latency.
- Ensure the final codebase is clean, documented, and ready to evolve into a commercial product under the Voxinta brand.
