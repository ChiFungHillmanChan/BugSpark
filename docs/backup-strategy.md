# Database Backup Strategy

## Overview

BugSpark stores all persistent data in PostgreSQL. This document outlines backup procedures for different hosting environments.

## Render PostgreSQL

Render provides automatic daily backups for PostgreSQL databases on paid plans.

- **Automatic backups**: Daily snapshots retained for 7 days (Starter plan) or 30 days (Standard+)
- **Manual backups**: Available through the Render dashboard under your database > Backups
- **Point-in-time recovery**: Available on Standard plan and above
- **Restore**: Create a new database from any backup via the dashboard

### Manual Backup via pg_dump

```bash
pg_dump $DATABASE_URL --format=custom --no-owner > bugspark_backup_$(date +%Y%m%d).dump
```

### Restore from Backup

```bash
pg_restore --no-owner --dbname=$DATABASE_URL bugspark_backup_YYYYMMDD.dump
```

## Supabase

Supabase provides automatic daily backups on Pro plan and above.

- **Automatic backups**: Daily backups retained for 7 days (Pro) or 30 days (Team)
- **Point-in-time recovery**: Available on Team plan (up to 7 days)
- **Access**: Dashboard > Project Settings > Database > Backups

### Manual Backup

```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  --format=custom --no-owner > supabase_backup_$(date +%Y%m%d).dump
```

## Neon

Neon provides branching-based backups and point-in-time restore.

- **Branching**: Create a branch from any point in time (retained per plan)
- **Point-in-time recovery**: Available on all plans (7 days Free, 30 days Pro)
- **Access**: Dashboard > Project > Branches > Create Branch

### Manual Backup

```bash
pg_dump $DATABASE_URL --format=custom --no-owner > neon_backup_$(date +%Y%m%d).dump
```

## Self-Hosted PostgreSQL

For self-hosted deployments, configure automated backups:

### Cron-based pg_dump

```bash
# Add to crontab: daily backup at 2 AM UTC
0 2 * * * pg_dump $DATABASE_URL --format=custom --no-owner | gzip > /backups/bugspark_$(date +\%Y\%m\%d).dump.gz
```

### Retention Policy

```bash
# Remove backups older than 30 days
find /backups -name "bugspark_*.dump.gz" -mtime +30 -delete
```

## S3 File Storage

Screenshots are stored in S3-compatible storage. Back up the bucket:

```bash
aws s3 sync s3://bugspark-uploads ./backup-uploads/ --endpoint-url $S3_ENDPOINT_URL
```

## Verification

Test backup restoration periodically:

1. Restore to a test database
2. Run `alembic current` to verify migration state
3. Spot-check data integrity (user count, report count)
