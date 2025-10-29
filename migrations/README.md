# Database Migrations

## For New Installations

**Use `database-setup.sql` in the project root** - it contains the complete, up-to-date schema with all fields.

## About This Folder

This folder contains historical migration scripts from the project's development. These are kept for:
- Reference and transparency about schema evolution
- Understanding why certain design decisions were made
- Debugging issues in development/staging environments

## If You Need Migrations

If you're upgrading an existing installation and need to apply schema changes, you can:

1. **Compare your current schema** with `database-setup.sql`
2. **Apply differences manually** based on what's missing
3. **Or drop and recreate** (if you don't have production data to preserve)

For production deployments with data to preserve, carefully review any schema differences and create custom migration scripts as needed.

## Migration Files in This Folder

- `add_access_code_fields.sql` - Adds password protection fields (already in database-setup.sql)
