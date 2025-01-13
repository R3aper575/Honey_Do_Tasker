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
      const now = new Date();
  
      // Calculate start of the week (Monday)
      const currentDay = now.getDay() + 1;
      const offsetToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + offsetToMonday);
  
      // Format the start and end of the week
      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = new Date(startOfWeek);
      endDate.setDate(startOfWeek.getDate() + 6);
  
      console.log(`Displaying schedule for the week: ${startDate} to ${endDate}`); // Debug log
  
      const schedule = await window.electronAPI.getWeeklySchedule();
  
      // Define days of the week
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
      // Group tasks by day
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
  
      // Clear the current table
      const scheduleContainer = document.getElementById('schedule-container');
      scheduleContainer.innerHTML = '';
  
      // Populate the schedule with tasks for each day
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
  
        // If no tasks, add a placeholder
        if (tasksByDay[day].length === 0) {
          const noTasksItem = document.createElement('li');
          noTasksItem.textContent = 'No tasks scheduled.';
          taskList.appendChild(noTasksItem);
        }
  
        daySection.appendChild(taskList);
        scheduleContainer.appendChild(daySection);
      });
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
  
    // Get the current date
    const now = new Date();
  
    // Calculate the start of the week (Monday)
    const currentDay = now.getDay() + 1; // Sunday = 0, Monday = 1, ..., Saturday = 6
    const offsetToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday being 0
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + offsetToMonday);
  
    // Calculate the end of the week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
  
    // Format dates as yyyy-MM-dd
    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];
  
    console.log(`Generating schedule for: ${startDate} to ${endDate}`); // Debug log
  
    try {
      const response = await window.electronAPI.generateWeeklySchedule(startDate, endDate);
      alert(response);
      await displayWeeklySchedule();
      console.log('Generate Weekly Schedule completed');
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
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
