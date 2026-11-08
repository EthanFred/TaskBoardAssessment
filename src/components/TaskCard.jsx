import { useDraggable } from '@dnd-kit/react'

function TaskCard({task, columns, changeTaskStatus, deleteTask})
{
    const {ref, handleRef, isDragging} = useDraggable({id: task.id});

    return(
        <article ref={ref} className={`task-card ${isDragging ? 'dragging' : ''}`}>
            <p>{task.title}</p>

            <button type="button" ref={handleRef} className="drag-handle">
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