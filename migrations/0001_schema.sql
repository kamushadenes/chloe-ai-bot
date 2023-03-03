CREATE TABLE messages
(
    timestamp INTEGER NOT NULL,
    userId    INTEGER NOT NULL,
    role      TEXT    NOT NULL,
    content   TEXT    NOT NULL,
    summary   TEXT    NOT NULL
);

CREATE TABLE modes
(
    userId              INTEGER PRIMARY KEY,
    mode                TEXT NOT NULL,
    actCharacter        TEXT NULL,
    actSeries           TEXT NULL,
    interviewerPosition TEXT NULL
);-- Migration number: 0001 	 2023-03-03T13:28:27.837Z
