ManagePay - Payment Management System

ManagePay is a comprehensive payment management system built with modern web technologies to handle transactions, user management, and payment processing.

Environment:
- Copy `.env.example` to `.env.local`
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings
- Enable email/password authentication in Supabase Auth

Docker / Coolify:
- Build with the included `Dockerfile`.
- Expose port `3000`.
- Set these variables in Coolify: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `RESEND_API_KEY`.
- Add the `NEXT_PUBLIC_*` values as build variables too, because Next.js embeds public variables during `npm run build`.

Features:
- User Authentication & Authorization - Secure login system with role-based access
- Payment Processing - Handle various payment methods and transactions
- Dashboard Analytics - Visual insights into financial data and transactions
- User Management - Admin panel for managing users and permissions
- Responsive Design - Mobile-friendly interface built with Tailwind CSS
- Real-time Updates - Live transaction tracking and status updates
