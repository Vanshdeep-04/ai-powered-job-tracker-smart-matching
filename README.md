# AI-Powered Job Tracker with Smart Matching

An AI-powered job tracking system that fetches jobs from external APIs, tracks application status intelligently, and uses AI to match jobs with your resume.

![JobTracker AI Demo](./docs/demo.gif)

## 🚀 Live Demo

Frontend (Vercel):  
https://ai-powered-job-tracker-smart-matchi.vercel.app

Backend (Render):  
https://ai-powered-job-tracker-smart-matching.onrender.com

> ⚠️ Note: On first load, the backend may take a few seconds to wake up due to Render’s free-tier cold start.


## ✨ Features

### 1. Job Feed & External Integration
- Fetch jobs from JSearch API (RapidAPI) or use built-in mock data
- Clean job cards with title, company, location, description, job type
- "Apply" button that opens job link and tracks application

### 2. Advanced Filters
- 🔍 **Role/Title**: Search by job title
- 💻 **Skills**: Multi-select (React, Node.js, Python, etc.)
- 📅 **Date Posted**: Last 24 hours, Last week, Last month, Any time
- 💼 **Job Type**: Full-time, Part-time, Contract, Internship
- 🏠 **Work Mode**: Remote, Hybrid, On-site
- 📍 **Location**: City/region filter
- ⭐ **Match Score**: High (>70%), Medium (40-70%), All

### 3. Resume Upload
- Resume uploads are handled using multipart/form-data with in-memory parsing to support cloud deployments (no local file system dependency).
- Upload PDF or TXT resumes
- Drag & drop support
- Replace/update anytime
- Automatic text extraction

### 4. AI-Powered Job Matching ⭐
- Automatic scoring of each job against your resume (0-100%)
- Color-coded badges: Green (>70%), Yellow (40-70%), Gray (<40%)
- "Best Matches" section highlighting top 6-8 jobs
- Skill match explanations

### 5. Smart Application Tracking ⭐
- Opens job link in new tab when clicking "Apply"
- Smart popup when returning: "Did you apply?"
- Track status: Applied → Interview → Offer/Rejected
- Dashboard with timeline and filters

### 6. AI Sidebar Assistant
- Natural language job queries
- Product help and guidance
- Filter suggestions

---

## 🏗️ Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     React Application (Vite)                     │    │
│  │                                                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │    │
│  │  │  Jobs    │  │  Resume  │  │Dashboard │  │   AI Sidebar   │  │    │
│  │  │  Page    │  │  Upload  │  │   Page   │  │     Chat       │  │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │    │
│  │       │              │             │                │           │    │
│  │  ┌────┴──────────────┴─────────────┴────────────────┴────────┐ │    │
│  │  │                    API Service Layer                       │ │    │
│  │  │  - Session management (localStorage)                       │ │    │
│  │  │  - Axios HTTP client                                       │ │    │
│  │  └───────────────────────────┬────────────────────────────────┘ │    │
│  └──────────────────────────────│────────────────────────────────┘    │
│                                 │                                      │
└─────────────────────────────────│──────────────────────────────────────┘
                                  │ HTTP/REST API
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SERVER (Node.js + Fastify)                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                           Routes Layer                              │ │
│  │                                                                     │ │
│  │   /api/jobs          /api/resume       /api/applications  /api/chat│ │
│  │   - GET (list)       - POST (upload)   - GET (list)       - POST   │ │
│  │   - GET /:id         - GET (status)    - POST (create)             │ │
│  │                      - DELETE          - PATCH (status)            │ │
│  └────────────┬────────────────┬────────────────┬───────────────┬─────┘ │
│               │                │                │               │       │
│  ┌────────────▼────────────────▼────────────────▼───────────────▼────┐  │
│  │                         Services Layer                            │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │ Job Service │  │ AI Service  │  │  Storage    │              │  │
│  │  │             │  │             │  │  Service    │              │  │
│  │  │ - JSearch   │  │ - Gemini AI │  │             │              │  │
│  │  │   API       │  │ - Scoring   │  │ - Upstash   │              │  │
│  │  │ - Mock data │  │ - Chat      │  │   Redis     │              │  │
│  │  └──────┬──────┘  └──────┬──────┘  │ - In-memory │              │  │
│  │         │                │         │   fallback  │              │  │
│  │         │                │         └──────┬──────┘              │  │
│  └─────────│────────────────│────────────────│──────────────────────┘  │
└────────────│────────────────│────────────────│─────────────────────────┘
             ▼                ▼                ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  JSearch    │   │   Google    │   │   Upstash   │
    │   API       │   │   Gemini    │   │    Redis    │
    │ (RapidAPI)  │   │     AI      │   │             │
    └─────────────┘   └─────────────┘   └─────────────┘
```

### Data Flow

```
User Action                    Frontend                 Backend                  External
──────────────────────────────────────────────────────────────────────────────────────────

1. Page Load
   └─────────────────────────► Fetch Jobs ──────────────► Get from JSearch ─────► JSearch API
                                   │                            │
                                   │                            ▼
                                   │                     Score with AI ─────────► Gemini API
                                   │                            │
                              ◄────┴────────────────────────────┘
                              Display Jobs with Scores

2. Resume Upload
   └─────────────────────────► Upload File ─────────────► Parse PDF/TXT
                                   │                            │
                                   │                      Save to Redis ────────► Upstash
                                   │                            │
                              ◄────┴────────────────────────────┘
                              Show Success + Refetch Jobs

3. Apply to Job
   └─────────────────────────► Open Link ──────────────► window.open()
   └─────────────────────────► Store Pending ──────────► localStorage
   │
   ▼ (User returns)
   └─────────────────────────► Show Popup ─────────────► User Response
                                   │                            │
                                   │                      Save Application ────► Upstash
                              ◄────┴────────────────────────────┘

4. AI Chat
   └─────────────────────────► Send Message ───────────► Process with Gemini ──► Gemini API
                                   │                            │
                              ◄────┴────────────────────────────┘
                              Display Response + Apply Filters
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | Fast development, modern tooling |
| Styling | Vanilla CSS + CSS Variables | Maximum flexibility, dark theme |
| Backend | Node.js + Fastify | High performance REST API |
| AI | Google Gemini 1.5 Flash | Job matching & chat assistant |
| Storage | Upstash Redis | Serverless, persistent storage |
| Jobs API | JSearch (RapidAPI) | Real job listings |

---

## 📦 Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys (optional for development - mock data available)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/job-tracker-ai.git
cd job-tracker-ai
```

### 2. Backend Setup

```bash
cd server
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys (optional - works with mock data)
```

### 3. Frontend Setup

```bash
cd ../client
npm install

# Copy environment file
cp .env.example .env
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables

#### Backend (.env)
```env
# Required for real job data (optional - uses mock data if not set)
JSEARCH_API_KEY=your_jsearch_api_key

# Required for AI features (optional - uses mock responses if not set)
GEMINI_API_KEY=your_gemini_api_key

# Required for persistent storage (optional - uses in-memory if not set)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Server config
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🧠 AI Matching Logic

## 🧩 Key Engineering Challenges Solved

1. Multipart File Uploads in Production  
   - Implemented Fastify multipart handling with correct plugin order  
   - Ensured compatibility with Axios FormData in a cloud environment  

2. Cross-Origin Session Management  
   - Stateless backend with session tracking via custom headers  
   - Consistent session handling across resume upload, job matching, and applications  

3. AI Cost & Performance Optimization  
   - Resume-based matching only triggers when resume changes  
   - Parallel scoring with caching to reduce API calls  

4. Deployment Constraints  
   - Handled CORS preflight issues for custom headers  
   - Designed system to work with free-tier cold starts and rate limits  


### How Scoring Works

The AI matching system uses Google Gemini 1.5 Flash to analyze job-resume compatibility:

```javascript
// Simplified scoring flow
async function scoreJobMatch(job, resumeText) {
  const prompt = `
    Analyze job-resume match and return:
    - score (0-100)
    - matchedSkills
    - missingSkills
    - explanation
  `;
  
  const response = await gemini.generateContent(prompt);
  return parseScore(response);
}
```

### Scoring Criteria

| Factor | Weight | Description |
|--------|--------|-------------|
| Skill Match | 40% | Direct skill overlap |
| Experience Level | 30% | Years/seniority alignment |
| Industry Fit | 20% | Relevant domain experience |
| Keywords | 10% | Title/description relevance |

### Efficiency Optimizations

1. **Parallel Processing**: Score up to 5 jobs concurrently
2. **Caching**: Store scores in Redis (1 hour TTL)
3. **Progressive Loading**: Show jobs immediately, scores load async
4. **Resume Hash**: Re-score only when resume changes

---

## 🎯 Critical Thinking: Popup Flow

### Design Decision

The "Did you apply?" popup solves a key UX challenge: **tracking applications without requiring manual data entry**.

### Why This Approach?

| Approach | Pros | Cons |
|----------|------|------|
| **Manual Entry** | Simple | User burden, low adoption |
| **Browser Extension** | Accurate | Requires installation |
| **URL Polling** | Automatic | CORS blocked, privacy concerns |
| **Tab Focus Detection** ✓ | Non-invasive, reliable | User must return to tab |

### Edge Cases Handled

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE CASE HANDLING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User clicks Apply but doesn't leave tab                    │
│     → 5-second delay before popup eligible                      │
│                                                                 │
│  2. Multiple Apply clicks in quick succession                   │
│     → Only track most recent job                                │
│                                                                 │
│  3. Browser crash before returning                              │
│     → Pending job persists in localStorage                      │
│                                                                 │
│  4. User ignores popup                                          │
│     → Popup stays, can dismiss manually                         │
│                                                                 │
│  5. Same job applied multiple times                             │
│     → Check existing applications, update timestamp             │
│                                                                 │
│  6. User was browsing, not applying                             │
│     → "No, just browsing" clears pending state                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Alternatives Considered

1. **Confirmation before opening link**: Interrupts flow
2. **Auto-detect from tab title**: Unreliable, privacy concerns
3. **Mobile deep linking**: Platform-specific, complex

---

## 📈 Scalability Considerations

### Handling 100 Jobs at Once

| Challenge | Solution |
|-----------|----------|
| Render performance | Virtual scrolling (react-window) |
| API rate limits | Pagination (20 jobs/page) |
| AI scoring time | Parallel processing + caching |
| Filter responsiveness | Debounced input (300ms) |

### Handling 10,000 Users

```
┌───────────────────────────────────────────────────────────────────┐
│                     SCALABILITY ARCHITECTURE                      │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│                          Load Balancer                            │
│                               │                                   │
│              ┌────────────────┼────────────────┐                  │
│              ▼                ▼                ▼                  │
│        ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│        │ Server 1 │    │ Server 2 │    │ Server N │              │
│        │ (Fastify)│    │ (Fastify)│    │ (Fastify)│              │
│        └────┬─────┘    └────┬─────┘    └────┬─────┘              │
│             │               │               │                     │
│             └───────────────┼───────────────┘                     │
│                             ▼                                     │
│                    ┌─────────────────┐                            │
│                    │  Upstash Redis  │                            │
│                    │  (Serverless)   │                            │
│                    └─────────────────┘                            │
│                                                                   │
│  Key Strategies:                                                  │
│  • Stateless servers → Horizontal scaling                         │
│  • Redis for sessions → Shared state                              │
│  • Rate limiting → 100 req/min per user                           │
│  • CDN for static → Vercel Edge                                   │
│  • Connection pooling → Reuse API clients                         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Tradeoffs & Limitations

### Current Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Session-based storage | Data lost on browser clear | Use proper auth in production |
| Single resume only | No version history | Store multiple in Redis |
| API rate limits | 500 req/month (JSearch free) | Upgrade plan or use mock data |
| No real-time updates | Jobs may be stale | Add refresh button + TTL |

### What I'd Improve with More Time

1. **User Authentication**: Persistent accounts with OAuth
2. **Email Notifications**: Application reminders, interview prep
3. **Resume Parsing**: Better skill extraction with NLP
4. **Browser Extension**: More reliable apply tracking
5. **Analytics Dashboard**: Success rates, market insights
6. **Mobile App**: React Native for on-the-go tracking
7. **Collaborative Features**: Share jobs, referrals

---

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# E2E tests
npm run test:e2e
```

---

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full sidebar + job grid
- **Tablet**: Collapsible sidebar
- **Mobile**: Stack layout, slide-out panels

---

## 🔒 Security

- No API keys in client code
- Session tokens in HTTP headers
- CORS configured for cross-origin frontend-backend communication (production demo setup)
- Input validation on all endpoints
- File type validation for uploads

---

## 📄 License

MIT License - feel free to use for your projects!

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📞 Support

Questions? Open an issue or reach out!

---

Built with ❤️ using React, Fastify, and Google Gemini AI
