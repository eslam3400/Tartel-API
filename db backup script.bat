@echo off
set PGPASSWORD=your_password
set PGUSER=your_username
set PGDATABASE=your_database
set PGBINPATH=C:\Program Files\PostgreSQL\16\bin\
set BACKUPPATH=%~dp0db-backups\
set BACKUPFILE=%BACKUPPATH%%PGDATABASE%_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.backup

echo Starting backup...
"%PGBINPATH%pg_dump" -U %PGUSER% -F c %PGDATABASE% > %BACKUPFILE%
echo Backup complete: %BACKUPFILE%