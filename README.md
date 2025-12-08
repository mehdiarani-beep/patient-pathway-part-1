# Patient Pathway Live

> A comprehensive healthcare assessment platform for ENT specialists to create, manage, and distribute medical quizzes to patients.

**Production URL**: https://pathway-lead-capture-bot.vercel.app/auth

---

## 📋 Table of Contents

- [Overview](#overview)
- [Documentation](#documentation)
- [Quick Start](#quick-start)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**Patient Pathway Live** is a full-stack healthcare platform that enables ENT (Ear, Nose, Throat) specialists to:

- Create and customize medical assessment quizzes (NOSE, SNOT-12, SNOT-22, TNSS, etc.)
- Generate AI-powered landing pages for patient engagement
- Capture and manage patient leads with analytics
- Send automated communications via email and SMS
- Manage clinic teams and multi-location practices
- Embed quizzes and chatbots on external websites
- Share assessments via customizable short links

### Key Features

- **AI-Powered Content Generation** - Automated landing page creation using LLMs
- **Multi-tenant Architecture** - Support for clinics and team members
- **Real-time Analytics** - Track quiz performance and patient engagement
- **Customizable Assessments** - Create custom quizzes or use standard medical assessments
- **Email & SMS Integration** - Automated patient communication
- **OAuth Social Sharing** - Share results on social platforms
- **Embeddable Widgets** - Integrate quizzes into any website

---
### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **bun**
- **Git**
- **Supabase account** (for backend)
- **Vercel account** (for deployment)

### Local Development Setup

```bash
git clone <YOUR_GIT_URL>
cd patientpathwaylive

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# 4. Configure your .env.local file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_RESEND_API_KEY=your-resend-key

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:8080
```


---

## Technology Stack

### Frontend
- **React** 18.3.1 - UI framework
- **TypeScript** 5.5.3 - Type safety
- **Vite** 5.4.1 - Build tool
- **Tailwind CSS** 3.4.11 - Styling
- **shadcn/ui** - Component library
- **React Query** 5.56.2 - Server state management
- **React Router** v6 - Client-side routing

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL 14+ database
  - Deno edge functions
  - Authentication (GoTrue)
  - S3-compatible storage
- **Deno** - Edge function runtime

### Third-Party Services
- **Resend** - Email delivery
- **Twilio** - SMS notifications
- **OpenRouter** - AI/LLM (Llama 3.3)
- **OAuth** - Google, Facebook, Twitter, LinkedIn

### Deployment
- **Vercel** - Frontend hosting
- **Supabase Cloud** - Backend hosting

---

## Project Structure

```
patientpathwaylive/
├── src/                     # Frontend source code
│   ├── components/          # React components
│   │   ├── dashboard/       # Doctor portal components (31 files)
│   │   ├── quiz/            # Quiz components (17 files)
│   │   ├── auth/            # Authentication components
│   │   ├── admin/           # Admin components
│   │   └── ui/              # shadcn/ui components (60 files)
│   ├── pages/               # Route components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities & services
│   ├── integrations/        # External service clients
│   ├── types/               # TypeScript definitions
│   └── data/                # Static data & configs
│
├── supabase/                # Backend configuration
│   ├── functions/           # Edge functions (29 functions)
│   └── migrations/          # Database migrations (37 files)
│
├── public/                  # Static assets
│
└── Configuration Files
    ├── package.json         # Dependencies
    ├── vite.config.ts       # Vite configuration
    ├── tailwind.config.ts   # Tailwind CSS
    ├── tsconfig.json        # TypeScript
    └── vercel.json          # Vercel deployment
```

---
### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Lint code

# Supabase
npx supabase start      # Start local Supabase
npx supabase db push    # Push database migrations
npx supabase functions deploy  # Deploy edge functions

# Testing (future)
npm run test            # Run tests
npm run test:e2e        # Run E2E tests
```

### Development Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Create pull request
5. Code review
6. Merge to main
7. Auto-deploy to production

---

## Deployment

### Frontend (Vercel)

**Automatic Deployment:**
- Push to `main` branch → Production
- Push to feature branch → Preview deployment

**Manual Deployment:**
```bash
vercel --prod
```

### Backend (Supabase)

**Database Migrations:**
```bash
npx supabase db push
```

**Edge Functions:**
```bash
npx supabase functions deploy
```

### Environment Variables

Required variables for deployment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENROUTER_API_KEY`
- `VITE_RESEND_API_KEY`
---

### Code Standards

- **TypeScript** - Use strict mode, define types
- **React** - Functional components, hooks
- **Styling** - Tailwind utility classes
- **Testing** - Write tests for new features (future)
- **Documentation** - Update docs with changes

### Pull Request Process

1. Create feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Update documentation
5. Submit PR with clear description
6. Address review comments
7. Merge after approval

---

## Additional Editing Options

### GitHub Web Editor

- Navigate to desired file
- Click "Edit" button (pencil icon)
- Make changes and commit

### GitHub Codespaces

- Click "Code" button → "Codespaces" tab
- Create new codespace
- Edit files in VS Code environment
- Commit and push changes

---

## SEO & Sitemap

### Sitemap Configuration

The sitemap is dynamically generated by a Supabase edge function. Since React is client-side and search crawlers don't execute JavaScript, the sitemap is served directly from the edge function.

**Sitemap URL for Google Search Console:**
```
https://drvitjhhggcywuepyncx.supabase.co/functions/v1/generate-sitemap?baseUrl=https://patientpathway.ai
```

**To submit to Google Search Console:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property (patientpathway.ai)
3. Navigate to Sitemaps in the left sidebar
4. Enter the full edge function URL above
5. Click Submit

**Note:** The `robots.txt` file references this direct edge function URL. Do not use `/sitemap.xml` as Lovable hosting doesn't support server-side rewrites.

---

## Support & Resources

### External Resources
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://typescriptlang.org)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)

### Project Links
- **Production URL**: https://patientpathway.ai/

---