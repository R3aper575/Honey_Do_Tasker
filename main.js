const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let mainWindow;

// Database setup
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('Connected to SQLite database.');

    db.run(
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        frequency TEXT NOT NULL DEFAULT 'daily',
        priority TEXT NOT NULL DEFAULT 'mid'
      )`,
      (err) => {
        if (err) {
          console.error('Error creating tasks table:', err.message);
        } else {
          console.log('Tasks table is ready.');
        }
      }
    );
  }
});

// Add-task handler with frequency and priority
ipcMain.handle('add-task', (event, taskData) => {
  const { name, frequency, priority } = taskData;
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO tasks (name, frequency, priority) VALUES (?, ?, ?)',
      [name, frequency, priority],
      function (err) {
        if (err) {
          console.error('Error adding task:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
});

// Fetch tasks handler
ipcMain.handle('get-tasks', (event) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks', [], (err, rows) => {
      if (err) {
        console.error('Error fetching tasks:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// Delete-task handler
ipcMain.handle('delete-task', (event, taskId) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
      if (err) {
        console.error('Error deleting task:', err.message);
        reject(err);
      } else {
        console.log(`Task with ID ${taskId} deleted.`);
        resolve();
      }
    });
  });
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Link to preload.js
      contextIsolation: true, // Ensure secure context isolation
    },
  });

  mainWindow.loadFile('index.html');
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
