const { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

/**
 * Generates a weekly schedule for tasks based on frequency and priority.
 *
 * @param {Array} tasks - List of tasks from the database.
 * @param {String} startDate - The start date of the week (YYYY-MM-DD).
 * @param {String} endDate - The end date of the week (YYYY-MM-DD).
 * @returns {Object} A schedule object with dates as keys and an array of tasks for each day.
 */
const generateSchedule = (tasks, startDate, endDate) => {
  const schedule = {};
  const dateRange = getDateRange(startDate, endDate);

  // Initialize the schedule with empty arrays for each date
  dateRange.forEach((date) => {
    schedule[date] = [];
  });

  // Sort tasks by priority (High -> Mid -> Low)
  tasks.sort((a, b) => {
    const priorityMap = { high: 1, mid: 2, low: 3 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });

  // Assign tasks to the schedule
  tasks.forEach((task) => {
    const candidateDates = getCandidateDates(task.frequency, startDate, endDate);

    for (const date of candidateDates) {
      if (schedule[date] && schedule[date].length < 3) {
        // Assign the task to this date
        schedule[date].push(task);
        break; // Move to the next task
      }
    }
  });

  return schedule;
};

/**
 * Returns a list of candidate dates for a task based on its frequency.
 *
 * @param {String} frequency - The frequency of the task (daily, weekly, bi-weekly, monthly).
 * @param {String} startDate - The start date of the week (YYYY-MM-DD).
 * @param {String} endDate - The end date of the week (YYYY-MM-DD).
 * @returns {Array} An array of date strings in YYYY-MM-DD format.
 */
const getCandidateDates = (frequency, startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (frequency === 'daily') {
    // Add all dates in the range
    for (let d = start; d <= end; d = addDays(d, 1)) {
      dates.push(format(d, 'yyyy-MM-dd'));
    }
  } else if (frequency === 'weekly') {
    // Add one random weekday within the range
    const weekStart = startOfWeek(start);
    for (let week = weekStart; week <= end; week = addDays(week, 7)) {
      dates.push(format(week, 'yyyy-MM-dd'));
    }
  } else if (frequency === 'bi-weekly') {
    // Add every other week
    const weekStart = startOfWeek(start);
    for (let week = weekStart; week <= end; week = addDays(week, 14)) {
      dates.push(format(week, 'yyyy-MM-dd'));
    }
  } else if (frequency === 'monthly') {
    // Add one random day in each month
    const monthStart = startOfMonth(start);
    for (let month = monthStart; month <= end; month = addDays(endOfMonth(month), 1)) {
      dates.push(format(month, 'yyyy-MM-dd'));
    }
  }

  return dates;
};

/**
 * Generates an array of date strings between a start and end date.
 *
 * @param {String} startDate - The start date (YYYY-MM-DD).
 * @param {String} endDate - The end date (YYYY-MM-DD).
 * @returns {Array} An array of date strings in YYYY-MM-DD format.
 */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = start; d <= end; d = addDays(d, 1)) {
    dates.push(format(d, 'yyyy-MM-dd'));
  }

  return dates;
};

module.exports = {
  generateSchedule,
};
