# APBMT 2025 Conference Management System

A comprehensive web application for managing the Asia-Pacific Blood and Marrow Transplantation (APBMT) 2025 Conference, enabling abstract submissions, user registration, and administrative oversight.

![Conference System](https://img.shields.io/badge/Conference-Management-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4)

## 🏥 About APBMT 2025

The Asia-Pacific Blood and Marrow Transplantation Group (APBMT) 2025 Conference brings together medical professionals, researchers, and healthcare experts from across the Asia-Pacific region to share knowledge and advances in hematology and bone marrow transplantation.

**Conference Details:**
- 📅 **Dates:** March 15-17, 2025
- 📍 **Location:** Asia-Pacific Region
- 👥 **Expected Attendees:** 500+
- 🎯 **Focus:** Blood and Marrow Transplantation Research

## ✨ Key Features

### 🔐 User Management
- **Delegate Registration:** Secure user registration with email verification
- **Authentication:** JWT-based login system with role-based access
- **Profile Management:** User dashboard with submission tracking

### 📄 Abstract Management
- **Multi-Category Submissions:** Support for 5 presentation types
  - Free Paper Presentation (6+2 minutes, 250 words)
  - Award Paper Presentation (6+2 minutes, 250 words)  
  - Poster Presentation (250 words)
  - e-Poster Presentation (250 words)
  - Case Report (250 words)
- **Real-time Word Count:** Live validation with visual feedback
- **File Upload:** PDF support for supplementary materials
- **Co-author Management:** Multiple co-author support

### 👨‍💼 Administrative Dashboard
- **Real-time Statistics:** Live submission tracking and analytics
- **Review System:** Abstract approval/rejection workflow
- **Bulk Operations:** Mass status updates and email notifications
- **Export Functionality:** Excel/CSV export for abstracts
- **Category-wise Analytics:** Detailed breakdown by presentation type

### 📧 Communication System
- **Automated Notifications:** Email confirmations and status updates
- **Bulk Messaging:** Admin broadcast capabilities
- **Status Tracking:** Real-time submission status updates

### 📱 User Experience
- **Responsive Design:** Mobile-first approach with Tailwind CSS
- **Modern UI/UX:** Clean, professional interface
- **Accessibility:** WCAG compliant design
- **Performance Optimized:** Fast loading with Next.js optimization

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5.5.3
- **Styling:** Tailwind CSS 3.4.4
- **Icons:** Lucide React 0.400.0
- **UI Components:** Custom React components

### Backend
- **Runtime:** Node.js (≥18.17.0)
- **Database:** PostgreSQL with connection pooling
- **Authentication:** JWT with bcryptjs
- **File Handling:** Multer for uploads
- **Email Service:** Nodemailer integration

### Development Tools
- **Linting:** ESLint with Next.js config
- **Type Checking:** TypeScript strict mode
- **Package Manager:** npm (≥9.0.0)
- **Build Tool:** Next.js built-in bundler

## 🚀 Quick Start

### Prerequisites
- Node.js ≥18.17.0
- npm ≥9.0.0
- PostgreSQL database
- SMTP email service (for notifications)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd apbmt-2025-conference-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/apbmt_conference

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-key

# Email Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@apbmt2025.org

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

4. **Database Setup**
The application will automatically create required tables on first run. Ensure your PostgreSQL database is accessible.

5. **Start Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Homepage with conference info
│   ├── submit/                   # Abstract submission flow
│   ├── admin/                    # Administrative dashboard
│   ├── delegate-dashboard/       # User dashboard
│   ├── delegate-login/          # User authentication
│   ├── delegate-register/       # User registration
│   ├── abstract-guidelines/     # Submission guidelines
│   └── api/                     # API routes
│       ├── abstracts/           # Abstract CRUD operations
│       ├── admin/               # Admin-only endpoints
│       ├── auth/                # Authentication endpoints
│       └── upload/              # File upload handling
├── components/                   # Reusable React components
│   ├── FileUpload.tsx           # File upload component
│   ├── ValidatedTextArea.jsx    # Word count validation
│   ├── WordCounter.jsx          # Real-time word counting
│   └── admin/                   # Admin-specific components
└── lib/                         # Utility libraries
    ├── auth-utils.js            # Authentication helpers
    ├── database-postgres.js     # Database connection & queries
    ├── email-service.ts         # Email notification service
    ├── file-utils.ts            # File handling utilities
    └── word-count-utils.js      # Text processing utilities
```

## 🔧 Configuration

### Database Schema
The application uses PostgreSQL with the following main tables:
- **users:** Delegate registration and authentication
- **abstracts:** Abstract submissions and metadata
- **abstract_files:** File upload tracking
- **admin_users:** Administrative access control

### File Storage
- Uploaded files are stored in `public/uploads/abstracts/`
- Each submission gets a unique folder with timestamp-based naming
- Supports PDF files up to configured size limits

### Email Templates
Customizable email templates for:
- Registration confirmation
- Abstract submission confirmation
- Status update notifications
- Admin notifications

## 📊 API Endpoints

### Public Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/abstracts/user` - User's abstracts
- `POST /api/abstracts` - Submit new abstract

### Admin Endpoints
- `GET /api/admin/abstracts` - All abstracts with filters
- `PUT /api/admin/abstracts/status` - Update abstract status
- `POST /api/admin/abstracts/bulk-update` - Bulk operations
- `GET /api/export` - Export abstracts to Excel

### Utility Endpoints
- `POST /api/upload` - File upload handling
- `GET /api/abstracts/download/[id]` - Download abstract files
- `POST /api/email` - Send notifications

## 🎨 UI Components

### Key Components
- **ValidatedTextArea:** Real-time word count with visual feedback
- **FileUpload:** Drag-and-drop file upload with progress
- **AdminComponents:** Comprehensive dashboard components
- **WordCounter:** Standalone word counting utility

### Design System
- **Colors:** Medical/professional color palette
- **Typography:** Clean, readable fonts optimized for medical content
- **Icons:** Lucide React icons for consistency
- **Responsive:** Mobile-first design approach

## 🔒 Security Features

- **Authentication:** JWT-based with secure HTTP-only cookies
- **Password Hashing:** bcryptjs with salt rounds
- **Input Validation:** Server-side validation for all inputs
- **File Upload Security:** Type and size restrictions
- **SQL Injection Protection:** Parameterized queries
- **XSS Protection:** Input sanitization and CSP headers

## 📈 Performance Optimizations

- **Next.js App Router:** Improved performance and SEO
- **Connection Pooling:** PostgreSQL connection optimization
- **Image Optimization:** Next.js built-in image optimization
- **Code Splitting:** Automatic route-based code splitting
- **Caching:** Intelligent caching strategies

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Quality
- **TypeScript:** Strict type checking enabled
- **ESLint:** Next.js recommended configuration
- **Prettier:** Code formatting (recommended to add)

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables for Production
Ensure all environment variables are properly set:
- Database connection strings
- JWT secrets (use strong, unique keys)
- SMTP configuration
- Application URLs

### Recommended Hosting
- **Vercel:** Optimal for Next.js applications
- **Railway/Heroku:** Good alternatives with PostgreSQL support
- **AWS/Google Cloud:** For enterprise deployments

## 📞 Support & Contact

For technical support or conference inquiries:
- **Email:** support@apbmt2025.org
- **Conference Website:** [APBMT 2025 Official Site]
- **Technical Issues:** Create an issue in this repository

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for the APBMT 2025 Conference. All rights reserved.

## 🙏 Acknowledgments

- **APBMT Organization:** For supporting this digital initiative
- **Medical Community:** For their valuable feedback and requirements
- **Development Team:** For their dedication to excellence

---

**Built with ❤️ for the medical research community**

*Last Updated: June 2025*
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev

