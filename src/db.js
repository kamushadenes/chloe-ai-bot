async function insertMessage(env, userId, role, text, summary) {
    return await env.DB.prepare(
        "INSERT INTO messages(timestamp, userId, role, content, summary) VALUES (?, ?, ?, ?, ?)"
    )
        .bind(Date.now(), userId, role, text, summary)
        .run();
}

async function reset(env, userId) {
    return await env.DB.prepare(
        "DELETE FROM messages WHERE userId = ?"
    )
        .bind(userId)
        .run();
}

async function getMessages(env, userId) {
    return await env.DB.prepare(
        "SELECT * FROM messages WHERE userId = ? ORDER BY timestamp DESC LIMIT 10"
    )
        .bind(userId)
        .all();
}

async function getMode(env, userId) {
    return await env.DB.prepare(
        "SELECT * FROM modes WHERE userId = ?"
    )
        .bind(userId)
        .first();
}

async function setMode(env, userId, mode, args) {
    switch (mode) {
        case 'act':
            return await env.DB.prepare(
                "INSERT INTO modes(userId, mode, actCharacter, actSeries) VALUES (?, ?, ?, ?) " +
                "ON CONFLICT (userId) DO UPDATE SET mode = ?, actCharacter = ?, actSeries = ?"
            )
                .bind(userId, mode, args[0], args[1], mode, args[0], args[1])
                .run();
        case 'interviwer':
            return await env.DB.prepare(
                "INSERT INTO modes(userId, mode, interviewerPosition) VALUES (?, ?, ?) " +
                "ON CONFLICT (userId) DO UPDATE SET mode = ?, interviewerPosition = ?"
            )
                .bind(userId, mode, args[0], mode, args[0])
                .run();
    }

    return await env.DB.prepare(
        "INSERT INTO modes(userId, mode) VALUES (?, ?) " +
        "ON CONFLICT (userId) DO UPDATE SET mode = ?"
    )
        .bind(userId, mode, mode)
        .run();
}

export {getMessages, insertMessage, reset, getMode, setMode};