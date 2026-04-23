const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'qualiqa.db');

let db = null;
let SQL = null;

async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Save DB periodically and on exit
setInterval(saveDb, 5000);
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(); });
process.on('SIGTERM', () => { saveDb(); process.exit(); });

async function initializeDatabase() {
  const database = await getDb();

  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      proposal_number TEXT,
      developer_name TEXT,
      qa_name TEXT,
      manager_name TEXT,
      scope_summary TEXT,
      attachment_path TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'pending_approval',
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sprint_id INTEGER REFERENCES sprints(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      expected_result TEXT,
      actual_result TEXT,
      status TEXT DEFAULT 'pending',
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS bugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      sprint_id INTEGER REFERENCES sprints(id) ON DELETE CASCADE,
      serial_number TEXT,
      description TEXT,
      evidence_url TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add status column to bugs if it doesn't exist (migration)
  try {
    database.run('ALTER TABLE bugs ADD COLUMN status TEXT DEFAULT "pending"');
  } catch (e) {
    // Column already exists or table doesn't exist yet
  }

  saveDb();
  console.log('✅ Banco de dados inicializado com sucesso');
}

// Helper: convert sql.js result set to array of objects
function resultToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function queryAll(sql, params = []) {
  try {
    const result = db.exec(sql, params);
    return resultToObjects(result);
  } catch (err) {
    console.error('queryAll error:', err.message, '\nSQL:', sql, '\nParams:', params);
    throw err;
  }
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function runSql(sql, params = []) {
  try {
    db.run(sql, params);
    const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
    const lastId = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : null;
    const changes = db.getRowsModified();
    saveDb();
    return { lastInsertRowid: lastId, changes };
  } catch (err) {
    console.error('runSql error:', err.message, '\nSQL:', sql, '\nParams:', params);
    throw err;
  }
}

module.exports = { getDb, initializeDatabase, queryAll, queryOne, runSql, saveDb };
