import { useDraggable } from '@dnd-kit/react'

function TaskCard({task, columns, changeTaskStatus, deleteTask, updateTask, currentUser, profile})
{
    const {ref, handleRef, isDragging} = useDraggable({id: task.id});

    const myName = profile?.display_name || 'Guest';

    const assigneeName = !task.assignee_id ? 'Unassigned' : task.assignee_id === currentUser?.id ? myName : 'Other user';

    return(
        <article ref={ref} className={`task-card priority-${task.priority} ${isDragging ? 'dragging' : ''}`}>
            <p>{task.title}</p>

            {task.description && (
                <p className="taskDescription"> {task.description} </p>
            )}

            <div className='taskDetails'>
                <p> Priority: {task.priority} </p>
                <p> Due Date: {task.due_date || "No due date assigned"} </p>
                <p> Assigned to: {assigneeName} </p>
            </div>

            <button type="button" ref={handleRef} className="drag-handle" aria-label={`Drag ${task.title}`} title='Drag task'>
                Drag
            </button>

            <select value={task.status} onChange = {(event) => changeTaskStatus(task.id, event.target.value)}> 
                {columns.map((option) => (
                    <option key={option.taskStatus} value={option.taskStatus}> {option.title} </option>
                ))}
            </select>

            <button type="button" onClick={() => deleteTask(task.id)}> Delete </button>
        </article>
    );
}

export default TaskCard;