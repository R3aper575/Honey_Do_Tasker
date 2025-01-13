const { format } = require('date-fns');

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generateSchedule(tasks, startDate, endDate) {
  // Get the start and end dates as Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Create an array of all days in the week (Monday to Sunday)
  const weekDays = [];
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    weekDays.push(format(new Date(date), 'yyyy-MM-dd'));
  }

  // Shuffle tasks to introduce randomness
  shuffleArray(tasks);

  // Initialize the schedule
  const schedule = {};
  weekDays.forEach((day) => (schedule[day] = []));

  // Sequentially assign tasks based on frequency
  let dayIndex = 0;
  tasks.forEach((task) => {
    switch (task.frequency) {
      case 'daily':
        // Assign the task to every day of the week
        weekDays.forEach((day) => {
          schedule[day].push(task);
        });
        break;

      case 'weekly':
        // Assign the task to one day in the week, sequentially
        schedule[weekDays[dayIndex]].push(task);
        dayIndex = (dayIndex + 1) % weekDays.length; // Move to the next day
        break;

      case 'bi-weekly':
        // Assign the task to two days in the week, sequentially
        for (let i = 0; i < 2; i++) {
          schedule[weekDays[dayIndex]].push(task);
          dayIndex = (dayIndex + 1) % weekDays.length; // Move to the next day
        }
        break;

      case 'monthly':
        // Assign the task to one day in the week, sequentially
        schedule[weekDays[dayIndex]].push(task);
        dayIndex = (dayIndex + 1) % weekDays.length; // Move to the next day
        break;

      default:
        console.warn(`Unknown frequency '${task.frequency}' for task '${task.name}'.`);
    }
  });

  return schedule;
}

module.exports = { generateSchedule };
