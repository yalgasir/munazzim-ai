function isCompleted(task: Record<string, unknown>): boolean {
  return task.status === 'Done' || task.isCompleted === true;
}

export function workspaceFacts(appointments: unknown[], tasks: unknown[]): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);
  const taskRows = tasks
    .filter((task): task is Record<string, unknown> => Boolean(task) && typeof task === 'object');
  const appointmentRows = appointments
    .filter((appointment): appointment is Record<string, unknown> => Boolean(appointment) && typeof appointment === 'object');
  const completedTasks = taskRows.filter(isCompleted).length;
  const pendingTasks = taskRows.length - completedTasks;
  const taskCompletionRate = taskRows.length === 0
    ? null
    : Math.round((completedTasks / taskRows.length) * 100);
  const overdueTasks = taskRows.filter((task) =>
    !isCompleted(task) && typeof task.date === 'string' && task.date < today
  ).length;
  const attendedAppointments = appointmentRows.filter(
    (appointment) => appointment.attendanceStatus === 'Attended'
  ).length;
  const missedAppointments = appointmentRows.filter(
    (appointment) => appointment.attendanceStatus === 'Missed'
  ).length;
  const upcomingAppointments = appointmentRows.filter(
    (appointment) => appointment.attendanceStatus !== 'Attended' && appointment.attendanceStatus !== 'Missed'
  ).length;

  return {
    date: today,
    totals: {
      tasks: taskRows.length,
      completedTasks,
      pendingTasks,
      taskCompletionRate,
      overdueTasks,
      appointments: appointmentRows.length,
      attendedAppointments,
      missedAppointments,
      upcomingAppointments,
    },
    tasks: taskRows.map((task) => ({
      title: String(task.title ?? task.description ?? 'Untitled'),
      status: String(task.status ?? 'Pending'),
      date: task.date ?? null,
      time: task.time ?? null,
      priority: task.priority ?? null,
    })),
    appointments: appointmentRows.map((appointment) => ({
      title: String(appointment.title ?? 'Untitled'),
      date: appointment.date ?? null,
      startTime: appointment.startTime ?? null,
      endTime: appointment.endTime ?? null,
      attendanceStatus: appointment.attendanceStatus ?? 'Upcoming',
    })),
  };
}
