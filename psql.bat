@echo off
REM Opens psql as postgres. Usage: psql.bat            (default DB)
REM                               psql.bat lab10_db   (specific DB)
REM Run task1.sql:  psql.bat postgres -f task1.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres %*
