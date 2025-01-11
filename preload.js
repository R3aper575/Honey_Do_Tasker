const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer process securely
contextBridge.exposeInMainWorld('electronAPI', {
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  addTask: (taskData) => ipcRenderer.invoke('add-task', taskData),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId), 
});
