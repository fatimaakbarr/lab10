# Lab 10 – PostgreSQL and TypeORM with NestJS

| | |
|---|---|
| **Name** | Fatima Akbar |
| **Registration No.** | 242717 |
| **Section** | C |
| **Course** | CS-301L Full Stack Web Development (Lab) |

NestJS + TypeORM + PostgreSQL API with users, profiles, notes, tags and categories
(Tasks 2–6 built on the Lab 10 manual project).

## Setup

```bash
# 1. Create the database (pgAdmin → Databases → Create, or psql):
psql -U postgres -c "CREATE DATABASE lab10_db;"

# 2. Configure credentials
copy .env.example .env        # Windows   (cp on macOS/Linux)
# then edit .env and set DB_PASSWORD

# 3. Install and run
npm install
npm run start:dev
```

API: `http://localhost:3000`. Tables are created automatically on first start (`synchronize: true`, classroom only).

Optional sample data (12 notes, 3 categories, 3 tags, a user with no notes):
run `seed.sql` in pgAdmin's Query Tool on `lab10_db` **after** the server has started once.

A ready Postman collection is in `lab10.postman_collection.json` (Import → File).
`psql.bat` is a Windows shortcut for `psql -h localhost -U postgres` (e.g. `psql.bat lab10_db -f seed.sql`).

## Project structure

```
src/
  app.module.ts            TypeORM config from .env (ConfigModule)
  main.ts                  global ValidationPipe (whitelist, transform)
  users/                   User entity, CRUD, GET /users/:id/stats (Task 5)
  profiles/                Profile entity (one-to-one with User)
  notes/                   Note entity, CRUD, pagination/search (Tasks 4, 6)
    dto/query-notes.dto.ts QueryNotesDto (Task 6)
  tags/                    Tag entity (many-to-many with Note via note_tags)
  categories/              Category entity + CRUD (Tasks 2, 3)
task1.sql                  Task 1 SQL statements
seed.sql                   optional test data
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST/GET | `/users` | body `{name, email, profile?: {bio, city}}` |
| GET/PATCH/DELETE | `/users/:id` | |
| GET | `/users/:id/stats` | Task 5 – query builder, 404 if missing, zeros if no notes |
| POST/GET | `/categories` | Task 3 – 409 on duplicate name, list ordered by name |
| GET/PATCH/DELETE | `/categories/:id` | GET includes notes; delete sets notes' `categoryId` to NULL |
| POST | `/notes` | `{title, content, userId, tags?: string[], categoryId?}` |
| GET | `/notes` | `?page=1&limit=5&search=&tag=&categoryId=` → `{data,total,page,limit}` |
| GET | `/notes/:id` | increments `views` each call |
| PATCH | `/notes/:id` | `{isPinned?, categoryId? (null removes), title?, content?, tags?}` |
| DELETE | `/notes/:id` | |
| POST/GET | `/tags`, GET/DELETE `/tags/:id` | |

## Screenshots (`screenshots/`)

| Task | File | Shows |
|---|---|---|
| 1 | task1-a.png | psql `SELECT version();` + CHECK (9 credit hours) and UNIQUE errors |
| 1 | task1-b.png | pgAdmin connected to PostgreSQL 18 |
| 1 | task1-c.png | queries (a)-(e) incl. GROUP BY |
| 2 | task2-a.png | `\dt` and `\d notes` (isPinned, views, categoryId FK ON DELETE SET NULL) |
| 3 | task3-a.png, task3-a2.png | POST /categories -> 201 |
| 3 | task3-b.png | duplicate name -> 409 |
| 3 | task3-b2.png | empty name -> 400 (DTO validation) |
| 3 | task3-list.png | GET /categories ordered by name |
| 3 | task3-get1.png | GET /categories/1 with notes relation |
| 3 | task3-c.png | GET /categories/99 -> 404 |
| 3 | task3-patch.png / -409 / -404 | PATCH rename: 200 / 409 / 404 |
| 3 | task3-e.png, task3-f.png | DELETE category -> 200 / 404 |
| 3 | task3-d.png | notes table after delete: categoryId NULL, notes kept |
| 4 | task4-a.png, task4-a2.png | POST /notes with categoryId -> 201 incl. category |
| 4 | task4-b.png | POST /notes categoryId 999 -> 404 |
| 4 | task4-c1-pin.png, task4-c.png | PATCH isPinned true, then GET /notes lists it first |
| 4 | task4-change-category.png, task4-remove-category.png | PATCH categoryId / categoryId null |
| 4 | task4-d1.png, task4-d.png | GET /notes/1 views 1 ... 3 |
| 5 | task5-a.png, task5-b.png, task5-c.png | stats user 1, user without notes (zeros), 404 |
| 6 | task6-seed.png | seed.sql loaded (12 notes) |
| 6 | task6-a.png (+ -top) | GET /notes -> total 12, page 1, limit 5 |
| 6 | task6-b.png (+ -top) | page=2&limit=3 -> notes 4-6, total 12 |
| 6 | task6-c.png (+ -top) | search=nest -> 3 case-insensitive matches |
| 6 | task6-d.png, task6-e.png | tag filter, categoryId filter |
| 6 | task6-f.png, task6-g.png | limit=100 -> 400, page=0 -> 400 |

## Reflection Questions

**1. What problem does an ORM solve, and what is one disadvantage?**
An ORM maps database tables to classes, so we work with objects and repositories instead of
writing raw SQL and manually converting rows. It also handles relations, parameter escaping
and portability between databases. A disadvantage is that it hides the SQL it generates, which
can produce slow queries (e.g. N+1 problems) and makes complex queries harder to optimise.

**2. What is the difference between `repository.create()` and `repository.save()`?**
`create()` only builds an entity instance in memory from a plain object; nothing touches the
database. `save()` actually writes it: it runs an INSERT (or an UPDATE if the entity already has
an id), then returns the entity with generated values such as `id` and default columns.

**3. In a one-to-many relationship, which table holds the foreign key? Which decorator creates the junction table in many-to-many?**
The "many" side holds the foreign key. Here `notes` holds `categoryId` and `userId`
(the `@ManyToOne` side). In a many-to-many relation, `@JoinTable()` (placed on one side)
creates the junction table, e.g. `note_tags`.

**4. Why is `synchronize: true` dangerous in production, and what should you use instead?**
It changes the schema automatically on every start to match the entities, so renaming or
removing a property can drop columns or tables and permanently delete data, with no review or
history. In production you should use TypeORM migrations, which are versioned, reviewed and can
be rolled back.

**5. Why should database credentials be stored in `.env` instead of in the source code?**
Source code is pushed to GitHub and shared, so hard-coded passwords would be leaked to anyone
who can read the repo (and stay in git history). `.env` is git-ignored, and each environment
(local, test, production) can use its own credentials without changing code. `.env.example`
documents the required variables without real values.
