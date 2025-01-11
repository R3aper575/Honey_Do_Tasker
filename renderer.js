document.addEventListener('DOMContentLoaded', () => {
    const taskNameInput = document.getElementById('task-name');
    const taskFrequencyInput = document.getElementById('task-frequency');
    const taskPriorityInput = document.getElementById('task-priority');
    const addTaskButton = document.getElementById('add-task');
    const taskTableBody = document.querySelector('#task-table tbody');
  
    // Function to fetch tasks and update the table
    const updateTaskTable = async () => {
      try {
        const tasks = await window.electronAPI.getTasks();
        taskTableBody.innerHTML = '';
  
        tasks.forEach((task) => {
          const row = document.createElement('tr');
  
          // Task Name Cell
          const nameCell = document.createElement('td');
          nameCell.textContent = task.name;
          row.appendChild(nameCell);
  
          // Frequency Cell
          const frequencyCell = document.createElement('td');
          frequencyCell.textContent = task.frequency;
          row.appendChild(frequencyCell);
  
          // Priority Cell
          const priorityCell = document.createElement('td');
          priorityCell.textContent = task.priority;
          row.appendChild(priorityCell);
  
          // Actions Cell
          const actionCell = document.createElement('td');
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.addEventListener('click', async () => {
            // Delete task and refresh the table
            await window.electronAPI.deleteTask(task.id);
            await updateTaskTable();
          });
          actionCell.appendChild(deleteButton);
          row.appendChild(actionCell);
  
          taskTableBody.appendChild(row);
        });
      } catch (error) {
        console.error('Error updating task table:', error);
      }
    };
  
    // Add Task Button Click Event
    addTaskButton.addEventListener('click', async () => {
      const taskName = taskNameInput.value.trim();
      const taskFrequency = taskFrequencyInput.value;
      const taskPriority = taskPriorityInput.value;
  
      if (taskName) {
        try {
          await window.electronAPI.addTask({
            name: taskName,
            frequency: taskFrequency,
            priority: taskPriority,
          });
          taskNameInput.value = '';
          await updateTaskTable();
        } catch (error) {
          console.error('Error adding task:', error);
        }
      } else {
        alert('Task name cannot be empty!');
      }
    });
  
    // Load the initial task list
    updateTaskTable();
  });
  