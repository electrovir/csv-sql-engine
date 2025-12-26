import {executeSql, sql} from '../index.js';

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
