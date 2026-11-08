import { useDroppable } from '@dnd-kit/react';
import TaskCard from './TaskCard';

function TaskColumn({ column, columns, tasks, changeTaskStatus, deleteTask})
{
    const{ ref, isDropTarget } = useDroppable({id: column.taskStatus});

    const columnTasks = tasks.filter((task) => task.status === column.taskStatus)

    return(
        <section ref={ref} className={`column ${isDropTarget ? 'column-over' : ''}`}>
            <h2>{column.title}</h2>

            {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} columns={columns} 
                    changeTaskStatus={changeTaskStatus} deleteTask={deleteTask} />
            ))}

        </section>
    );

}

export default TaskColumn;