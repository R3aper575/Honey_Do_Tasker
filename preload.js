const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addTask: (task) => ipcRenderer.invoke('add-task', task),
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  generateWeeklySchedule: (startDate, endDate) =>
    ipcRenderer.invoke('generate-weekly-schedule', startDate, endDate),
  getWeeklySchedule: () => ipcRenderer.invoke('get-weekly-schedule'),
  clearSchedule: () => ipcRenderer.invoke('clear-schedule'),
});