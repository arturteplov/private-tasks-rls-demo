# Private Tasks — Supabase RLS Authorization Demo

## Overview

A self-created demonstration showing how a functioning
React/Supabase application can accidentally expose one user's data
to another when Row Level Security is configured incorrectly.

This is a demonstration project only and contains no real user data.

    React UI
       |
       v
    Supabase client
       |
       v
    Postgres + RLS
       |
       +--> auth.uid() = user_id ? allow : deny

## Technology

- React
- TypeScript
- Vite
- Supabase Auth
- PostgreSQL
- Supabase Row Level Security

## Issue

Authenticated users were able to retrieve tasks
belonging to other accounts.

The application appeared to work normally, but the database
authorization policy was too permissive.

## Reproduction

1. User Alice created a private task.
2. User Bob created a separate private task.
3. Alice signed back in.
4. Alice was able to retrieve Bob's task.

Before the fix:

    Alice ---> tasks table ---> Alice + Bob rows
    Bob   ---> tasks table ---> Alice + Bob rows

## Root Cause

The tasks table had an intentionally permissive RLS policy that
allowed any authenticated user to access every row.

The frontend was not the source of the security issue. The database
itself was returning records belonging to other authenticated users.

## Resolution

The permissive policy was removed and replaced with separate
RLS policies for SELECT, INSERT, UPDATE, and DELETE.

Access is now limited to rows where:

    auth.uid() = user_id

## Verification

After the change:

- Alice can retrieve only Alice's tasks.
- Bob can retrieve only Bob's tasks.
- The frontend continues querying the tasks table without client-side ownership filtering.
- Unauthorized rows are no longer returned by the database.
- Access control is enforced directly by PostgreSQL/Supabase RLS.

After the fix:

    Alice ---> tasks table ---> Alice rows only
    Bob   ---> tasks table ---> Bob rows only

## Security Note

The insecure configuration was used only inside a controlled
demonstration environment with fake accounts and was never deployed publicly.
