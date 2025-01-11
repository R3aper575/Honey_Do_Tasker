document.addEventListener('DOMContentLoaded', () => {
  const taskNameInput = document.getElementById('task-name');
  const taskFrequencyInput = document.getElementById('task-frequency');
  const taskPriorityInput = document.getElementById('task-priority');
  const addTaskButton = document.getElementById('add-task');
  const generateScheduleButton = document.getElementById('generate-schedule');
  const clearScheduleButton = document.getElementById('clear-schedule');
  const taskTableBody = document.querySelector('#task-table tbody');
  
  // Ensure initial states are correct
  taskNameInput.disabled = false;
  addTaskButton.disabled = false;

  // Helper function to log the status of inputs and buttons
  const logInputStatus = (context = '') => {
    console.log(`[LOG - ${context}] Task Name Input Disabled: ${taskNameInput.disabled}`);
    console.log(`[LOG - ${context}] Add Task Button Disabled: ${addTaskButton.disabled}`);
  };

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
          await window.electronAPI.deleteTask(task.id);
          await updateTaskTable();
          logInputStatus('After Delete Task'); // Log status
        });
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        taskTableBody.appendChild(row);
      });

      logInputStatus('After Update Task Table');
    } catch (error) {
      console.error('Error updating task table:', error);
    }
  };

  // Function to display the current week's schedule
  const displayWeeklySchedule = async () => {
    try {
      const schedule = await window.electronAPI.getWeeklySchedule();

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const tasksByDay = {};
      daysOfWeek.forEach((day) => {
        tasksByDay[day] = [];
      });

      schedule.forEach((entry) => {
        const dayOfWeek = new Date(entry.scheduled_date).toLocaleString('en-US', { weekday: 'long' });
        if (tasksByDay[dayOfWeek]) {
          tasksByDay[dayOfWeek].push(entry);
        }
      });

      const scheduleContainer = document.getElementById('schedule-container');
      scheduleContainer.innerHTML = '';

      daysOfWeek.forEach((day) => {
        const daySection = document.createElement('div');
        daySection.classList.add('day-section');

        const dayHeading = document.createElement('h3');
        dayHeading.textContent = day;
        daySection.appendChild(dayHeading);

        const taskList = document.createElement('ul');
        tasksByDay[day].forEach((task) => {
          const taskItem = document.createElement('li');
          taskItem.textContent = `${task.name} (${task.frequency}, ${task.priority}) - ${task.status}`;
          taskList.appendChild(taskItem);
        });

        if (tasksByDay[day].length === 0) {
          const noTasksItem = document.createElement('li');
          noTasksItem.textContent = 'No tasks scheduled.';
          taskList.appendChild(noTasksItem);
        }

        daySection.appendChild(taskList);
        scheduleContainer.appendChild(daySection);
      });

      logInputStatus('After Display Weekly Schedule');
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      alert('Failed to fetch weekly schedule. Check the console for details.');
    }
  };

  // Add Task Button Click Event
  const handleAddTask = async () => {
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
    logInputStatus('After Add Task');
  };

  addTaskButton.addEventListener('click', handleAddTask);

  generateScheduleButton.addEventListener('click', async () => {
    console.log('Generate Weekly Schedule clicked');
    try {
      const response = await window.electronAPI.generateWeeklySchedule('2025-01-01', '2025-01-07');
      alert(response);
      await displayWeeklySchedule();
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
    taskNameInput.disabled = false; // Ensure input is enabled
    taskNameInput.focus(); // Reset focus to the input
    console.log('Generate Weekly Schedule completed');
  });
  
  clearScheduleButton.addEventListener('click', async () => {
    console.log('Clear Weekly Schedule clicked');
    try {
      const response = await window.electronAPI.clearSchedule();
      alert(response);
      await displayWeeklySchedule();
    } catch (error) {
      console.error('Error clearing schedule:', error);
    }
    taskNameInput.disabled = false; // Ensure input is enabled
    taskNameInput.focus(); // Reset focus to the input
    console.log('Clear Weekly Schedule completed');
  });
  
  // Load the initial task list and schedule
  updateTaskTable();
  displayWeeklySchedule();
  logInputStatus('After DOM Content Loaded');
});
