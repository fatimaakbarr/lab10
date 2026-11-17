-- =========================================================
-- Optional sample data for testing Tasks 4-6 (12 notes)
-- Run AFTER starting the server once (so TypeORM creates the tables),
-- in pgAdmin Query Tool on lab10_db, or:  psql -U postgres -d lab10_db -f seed.sql
-- WARNING: wipes existing users/notes/tags/categories.
-- =========================================================

TRUNCATE note_tags, notes, profiles, users, tags, categories RESTART IDENTITY CASCADE;

INSERT INTO users (name, email) VALUES
    ('Ali',  'ali@example.com'),
    ('Sara', 'sara@example.com');   -- Sara has no notes (stats must be zeros)

INSERT INTO profiles (bio, city, "userId") VALUES
    ('BSSE student', 'Islamabad', 1);

INSERT INTO categories (name) VALUES ('Personal'), ('Study'), ('Work');

INSERT INTO tags (name) VALUES ('nestjs'), ('postgres'), ('react');

-- createdAt spaced one minute apart so "newest first" is predictable
INSERT INTO notes (title, content, "userId", "categoryId", "isPinned", views, "createdAt") VALUES
    ('Learning NestJS',          'Modules, controllers, services', 1, 2, false, 0, now() - interval '12 min'),
    ('Postgres basics',          'psql, \dt, \d',                  1, 2, false, 0, now() - interval '11 min'),
    ('Grocery list',             'Milk, eggs',                     1, 1, false, 0, now() - interval '10 min'),
    ('NEST guards',              'CanActivate',                    1, 2, false, 0, now() - interval '9 min'),
    ('Sprint planning',          'Tickets for next week',          1, 3, false, 0, now() - interval '8 min'),
    ('React hooks',              'useState, useEffect',            1, 2, false, 0, now() - interval '7 min'),
    ('TypeORM relations',        'OneToMany / ManyToOne in nest',  1, 2, false, 0, now() - interval '6 min'),
    ('Gym routine',              'Mon/Wed/Fri',                    1, 1, false, 0, now() - interval '5 min'),
    ('Client meeting',           'Discuss API contract',           1, 3, false, 0, now() - interval '4 min'),
    ('Uncategorised idea',       'No category on purpose',         1, NULL, false, 0, now() - interval '3 min'),
    ('Nest pipes',               'ValidationPipe, ParseIntPipe',   1, 2, false, 0, now() - interval '2 min'),
    ('Weekend plan',             'Visit family',                   1, 1, false, 0, now() - interval '1 min');

INSERT INTO note_tags ("noteId", "tagId") VALUES
    (1, 1), (2, 2), (4, 1), (6, 3), (7, 1), (7, 2), (11, 1);
