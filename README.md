# csv-sql-engine

An API for executing SQL statements on a collection of CSV files. Handles SQLite syntax.

Supports only basic version of the following operations:

-   creating tables
-   dropping tables
-   adding columns
-   dropping columns
-   renaming columns
-   inserting rows
-   deleting rows
-   updating rows
-   selecting data

Caveats:

-   Default column values are only applied when adding a _new column_ to an existing table. (Not when adding new rows.)
-   Database constraints (column data types, relational ids, not null, etc.) are not enforced on read or write.
-   Auto-incrementing ids do not auto increment.
-   Every value is written and read as a string.
-   Probably not performant on large CSV files.
-   Joins are not yet supported.

## Install

```sh
npm i csv-sql-engine
```

## Examples

<!-- example-link: ./src/engine/engine.example.ts -->

```TypeScript
import {executeSql, sql} from 'csv-sql-engine';

/** Creates a new file at `./my-csv-files/users.csv`. */
await executeSql(
    sql`
        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
        INSERT INTO users VALUES (1, "example@example.com", "example");
    `,
    {
        csvDirPath: './my-csv-files/',
    },
);
```
