async function insertMessage(env, userId, role, text, summary) {
  return env.DB.prepare(
    'INSERT INTO messages(timestamp, userId, role, content, summary) '
    + 'VALUES (?, ?, ?, ?, ?)',
  ).bind(Date.now(), userId, role, text, summary).run();
}

async function reset(env, userId) {
  return env.DB.prepare(
    'DELETE FROM messages WHERE userId = ?',
  ).bind(userId).run();
}

async function getMessages(env, userId) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM messages WHERE userId = ? ORDER BY timestamp ASC',
  ).bind(userId).all();

  return results;
}

async function deleteMessage(env, timestamp, userId) {
  return env.DB.prepare(
    'DELETE FROM messages WHERE timestamp = ? AND userId = ?',
  ).bind(timestamp, userId).run();
}

async function getMode(env, userId) {
  return env.DB.prepare(
    'SELECT * FROM modes WHERE userId = ?',
  ).bind(userId).first();
}

async function getAllUsers(env) {
  const { results } = await env.DB.prepare(
    'SELECT DISTINCT userId FROM messages',
  ).all();

  return results;
}

async function setMode(env, userId, mode, args) {
  switch (mode) {
    case 'act':
      return env.DB.prepare(
        'INSERT INTO modes(userId, mode, actCharacter, actSeries) '
        + 'VALUES (?, ?, ?, ?) '
        + 'ON CONFLICT (userId) DO UPDATE SET '
        + 'mode = ?, actCharacter = ?, actSeries = ?',
      ).bind(userId, mode, args[0], args[1], mode, args[0], args[1]).run();
    case 'interviwer':
      return env.DB.prepare(
        'INSERT INTO modes(userId, mode, interviewerPosition) '
        + 'VALUES (?, ?, ?) '
        + 'ON CONFLICT (userId) DO UPDATE SET '
        + 'mode = ?, interviewerPosition = ?',
      ).bind(userId, mode, args[0], mode, args[0]).run();
    default:
      return env.DB.prepare(
        'INSERT INTO modes(userId, mode) VALUES (?, ?) '
        + 'ON CONFLICT (userId) DO UPDATE SET mode = ?',
      ).bind(userId, mode, mode).run();
  }
}

export {
  getMessages,
  insertMessage,
  reset,
  getMode,
  setMode,
  getAllUsers,
  deleteMessage,
};
