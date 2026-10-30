# Backup and restore

## PostgreSQL

- Daily logical backup (`pg_dump`) of application database  
- Store encrypted off-site; test restore quarterly  

## SQLite dev

- Copy `api/quantumwalk-dev.db` for local experiments only  

## User circuits

- Owned rows in `circuits` table — include in DB backup  
- Export API available post sign-in (product feature)  

Hub document tables (proposed): backup once wired.
