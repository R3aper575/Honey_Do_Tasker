const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { generateSchedule } = require('./scheduler');
const { startOfWeek, endOfWeek, format } = require('date-fns');

let mainWindow;

// Database setup
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('Connected to SQLite database.');

    // Create the `tasks` table
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

    // Create the `schedule` table
    db.run(
      `CREATE TABLE IF NOT EXISTS schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        scheduled_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )`,
      (err) => {
        if (err) {
          console.error('Error creating schedule table:', err.message);
        } else {
          console.log('Schedule table is ready.');
        }
      }
    );
  }
});

// Add-task handler with frequency and priority
ipcMain.handle('add-task', (event, taskData) => {
  console.log('Adding task:', taskData); // Debug log
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
          console.log(`Task added with ID: ${this.lastID}`); // Debug log
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

ipcMain.handle('get-weekly-schedule', async () => {
  try {
    const now = new Date();
    const startDate = format(startOfWeek(now), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(now), 'yyyy-MM-dd');

    const schedule = await new Promise((resolve, reject) => {
      const query = `
        SELECT s.scheduled_date, t.name, t.frequency, t.priority, s.status
        FROM schedule s
        JOIN tasks t ON s.task_id = t.id
        WHERE s.scheduled_date BETWEEN ? AND ?
        ORDER BY s.scheduled_date, t.priority
      `;
      db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
          console.error('Error fetching weekly schedule from database:', err.message);
          reject(err);
        } else {
          resolve(rows.length ? rows : []);
        }
      });
    });

    return schedule;
  } catch (error) {
    console.error('Error fetching weekly schedule in main process:', error);
    throw error;
  }
});

ipcMain.handle('generate-weekly-schedule', async (event, startDate, endDate) => {
  try {
    console.log(`Generating schedule for ${startDate} to ${endDate}`);

    // Fetch all tasks
    const tasks = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM tasks', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (tasks.length === 0) {
      console.warn('No tasks available for schedule generation.');
      return 'No tasks available to generate a schedule.';
    }

    // Fetch existing schedule for the given week
    const existingSchedule = await new Promise((resolve, reject) => {
      const query = `
        SELECT task_id, scheduled_date
        FROM schedule
        WHERE scheduled_date BETWEEN ? AND ?
      `;
      db.all(query, [startDate, endDate], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Map existing schedule for quick lookup
    const scheduledTasksMap = new Set(
      existingSchedule.map((entry) => `${entry.task_id}_${entry.scheduled_date}`)
    );

    // Generate the schedule
    const schedule = generateSchedule(tasks, startDate, endDate);

    // Insert only unscheduled tasks into the schedule table
    const insertQuery = `INSERT INTO schedule (task_id, scheduled_date, status) VALUES (?, ?, ?)`;

    await new Promise((resolve, reject) => {
      db.serialize(() => {
        for (const [date, tasks] of Object.entries(schedule)) {
          tasks.forEach((task) => {
            const taskKey = `${task.id}_${date}`;
            if (!scheduledTasksMap.has(taskKey)) {
              db.run(insertQuery, [task.id, date, 'pending'], (err) => {
                if (err) reject(err);
              });
            }
          });
        }
        resolve();
      });
    });

    console.log('Schedule generated successfully.');
    return 'Schedule generated and saved successfully';
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
});

// Clear schedule functionality
ipcMain.handle('clear-schedule', async () => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM schedule', (err) => {
      if (err) {
        console.error('Error clearing schedule:', err.message);
        reject(err);
      } else {
        console.log('Schedule cleared successfully.');
        resolve('Schedule cleared successfully');
      }
    });
  });
});

// Create the browser window
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

// App lifecycle events
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
