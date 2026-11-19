import { useDroppable } from '@dnd-kit/react';
import TaskCard from './TaskCard';

function TaskColumn({ column, columns, tasks, changeTaskStatus, deleteTask, updateTask, teamMembers, taskAssignees, saveTaskMembers})
{
    const{ ref, isDropTarget } = useDroppable({id: column.taskStatus});

    const columnTasks = tasks.filter((task) => task.status === column.taskStatus)

    return(
        <section ref={ref} className={`column ${isDropTarget ? 'column-over' : ''}`}>
            <h2>{column.title} ({columnTasks.length})</h2>

            {columnTasks.map((task) => {
                const assignedMembers = teamMembers.filter((member) => 
                taskAssignees.some((assignment) => assignment.task_id === task.id && assignment.member_id === member.id));

                return (
                    <TaskCard key={task.id} task={task} columns={columns} changeTaskStatus={changeTaskStatus}
                        deleteTask={deleteTask} updateTask={updateTask} teamMembers={teamMembers}
                        assignedMembers={assignedMembers}saveTaskMembers={saveTaskMembers}
                    />
                );  
            })}
        </section>
    );
}

export default TaskColumn;