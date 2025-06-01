# Supabase Backend Setup for Accounts

This guide explains how to set up Supabase backend integration for the accounts feature.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Node.js and npm installed

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
# Required for client-side operations (must have NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for server-side operations (no NEXT_PUBLIC_ prefix for security)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important Notes:**

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are needed for client-side authentication and must have the `NEXT_PUBLIC_` prefix
- `SUPABASE_SERVICE_ROLE_KEY` is used only on the server-side for database operations and should NOT have the `NEXT_PUBLIC_` prefix
- Without these exact variable names, you'll get "supabaseKey is required" errors

You can find these values in your Supabase project settings:

- Go to Settings → API
- Copy the Project URL for `NEXT_PUBLIC_SUPABASE_URL`
- Copy the `anon public` key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy the `service_role` key for `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Setup

Run the migration script to create the accounts table:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_create_accounts_table.sql`
4. Run the script

This will create:

- The `accounts` table with all necessary fields
- Proper indexes for performance
- Row Level Security (RLS) policies
- An automatic `updated_at` trigger

### 3. Authentication

The backend integration requires user authentication. Make sure your app has:

- User sign-up/sign-in functionality
- Proper session management
- The user must be logged in to access account endpoints

## Database Schema

The `accounts` table includes all fields from your `mockAccounts`:

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0.00,
  type TEXT NOT NULL CHECK (type IN ('cash', 'savings', 'credit card', 'line of credit', 'loan', 'insurance')),
  credit_limit DECIMAL(12,2),
  on_hold_amount DECIMAL(12,2) DEFAULT 0.00,
  remaining_credit_limit DECIMAL(12,2),
  statement_date INTEGER CHECK (statement_date >= 1 AND statement_date <= 31),
  days_due_after_statement_date INTEGER CHECK (days_due_after_statement_date >= 1 AND days_due_after_statement_date <= 31),
  annual_fee DECIMAL(12,2),
  af_waiver_spending_requirement DECIMAL(12,2),
  exclude_from_balances BOOLEAN DEFAULT FALSE,
  interest_rate DECIMAL(5,2),
  interest_frequency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

## API Endpoints

The following API endpoints are available:

- `GET /api/accounts` - Get all accounts for the authenticated user
- `POST /api/accounts` - Create a new account
- `GET /api/accounts/[id]` - Get a specific account by ID
- `PUT /api/accounts/[id]` - Update a specific account
- `DELETE /api/accounts/[id]` - Delete a specific account

## Features

- **Row Level Security**: Users can only access their own accounts
- **Type Safety**: Full TypeScript support with proper database types
- **Automatic Calculations**: Remaining credit limit is calculated automatically
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Built-in loading and error states in the store
- **Optimistic Updates**: UI updates optimistically for better user experience

## Migration from Mock Data

The store has been updated to:

- Load accounts from the API on component mount
- Use async methods for all CRUD operations
- Handle loading and error states
- Show proper feedback to users

Your existing UI components continue to work without changes, as the Account interface remains the same.

## Testing

After setup, you can:

1. Start your development server: `npm run dev`
2. Navigate to the accounts page
3. Try creating, editing, and deleting accounts
4. Check your Supabase database to see the data persisting

## Troubleshooting

1. **"supabaseKey is required" error**:

   - Make sure you have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env.local` file
   - Restart your development server after adding environment variables
   - Double-check the variable names match exactly (including the `NEXT_PUBLIC_` prefix)

2. **Cookies warning in console**:

   - You may see warnings about `cookies().get()` needing to be awaited
   - This is a compatibility issue between the current Supabase auth helpers version and newer Next.js
   - The warnings can be safely ignored as the functionality works correctly
   - To resolve permanently, you can update to newer Supabase packages when compatible

3. **Authentication errors**: Make sure the user is signed in
4. **Database errors**: Check that the migration script ran successfully
5. **API errors**: Verify your environment variables are correct
6. **CORS errors**: Ensure your Supabase project allows requests from your domain

## Next Steps

Consider adding:

- Account import/export functionality
- Audit logs for account changes
- Bulk operations
- Data validation on the server side
- Background sync for offline support

## Package Updates (Optional)

If you want to resolve the cookies warning, you can try updating your Supabase packages:

```bash
npm install @supabase/auth-helpers-nextjs@latest @supabase/supabase-js@latest
```

Note: This may require resolving dependency conflicts with other packages in your project.
