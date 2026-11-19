import { useDraggable } from '@dnd-kit/react'
import { useState, useRef } from 'react';
import MemberAvatar from './MemberAvatar';

function TaskCard({task, columns, changeTaskStatus, deleteTask, updateTask, teamMembers, assignedMembers, saveTaskMembers})
{
    const editDialogRef = useRef(null);

    const [draft, setDraft] = useState({});
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const {ref, handleRef, isDragging} = useDraggable({id: task.id});

    function openEditor() {
        // Load the task's existing information
        setDraft({
            title: task.title,
            description: task.description ?? '',
            priority: task.priority ?? 'medium',
            due_date: task.due_date ?? '',
            status: task.status
        });

        // Load the task's currently assigned team members
        setSelectedMemberIds(assignedMembers.map((member) => member.id));

        setSaveError('');
        editDialogRef.current?.showModal();
    }

    async function saveChanges(event) {
        event.preventDefault();

        const title = draft.title?.trim();
        if(!title){
            setSaveError("A title is required");
            return;
        }

        setSaving(true);
        setSaveError('');

        try{
            const taskSaved = await updateTask(task.id, {
                title: title, description: draft.description?.trim() ?? '', priority: draft.priority,
                due_date: draft.due_date || null, status: draft.status
            });
            if(!taskSaved)
            {
                setSaveError("Failed to save task details");
                return;
            }

            const membersSaved = await saveTaskMembers(task.id, selectedMemberIds);

            if(!membersSaved)
            {
                setSaveError("Saved task details, failed assignments");
                return;
            }

            editDialogRef.current?.close();


        } catch(error) {
            console.error("Failed to save changes: ", error);
            setSaveError("Something went wrong while saving");

        } finally {
            setSaving(false);
        }
    }

    return(
        <>
            <article ref={ref} className={`task-card priority-${task.priority} ${isDragging ? 'dragging' : ''}`}>
                
                <button type='button' ref={handleRef} className='drag-handle' aria-label={`Drag ${task.title}`} title='Drag task' />

                <div className = 'task-card-content'>
                
                    <p>{task.title}</p>

                    {task.description && (<p className="task-description"> {task.description} </p>)}

                    <div className='task-details'>
                        <p> Priority: {task.priority} </p>
                        <p> Due Date: {task.due_date || "No due date assigned"} </p>
                    </div>

                    <div className='assignee-avatars'>
                        {assignedMembers.length === 0 ? 
                            (<span>Unassigned</span>) : 
                            (assignedMembers.map((member) => (<MemberAvatar key={member.id} member={member}/>)))}
                    </div>

                    <select value={task.status} onChange={(event) => changeTaskStatus(task.id, event.target.value)}>
                        {columns.map((option) => (
                            <option key={option.taskStatus} value={option.taskStatus}>
                                {option.title}
                            </option> 
                        ))}
                    </select>

                    <button type="button" onClick={openEditor}>
                        Update Task
                    </button>

                    <button type="button" className="delete-task-button" onClick={() => deleteTask(task.id)}> Delete </button>
                </div>
            </article>
            <dialog ref={editDialogRef} className='task-dialog' aria-label='Update Task'>
                <div className='dialog-header'>
                    <h2>Update Task</h2>
                    <button type='button' className='dialog-close' onClick={() => editDialogRef.current?.close()}>
                        x
                    </button>
                </div>
                <form onSubmit={saveChanges} className='edit-task-form'>
                    <label>
                        Title
                        <input type='text' value={draft.title ?? ''} onChange={(event) => setDraft({...draft, title: event.target.value})} required />
                    </label>
                    <label>
                        Description
                        <textarea value={draft.description ?? ''} onChange={(event) => setDraft({...draft, description: event.target.value})} /> 
                    </label>
                    <label>
                        Priority
                        <select value={draft.priority ?? 'medium'} onChange={(event) => setDraft({...draft, priority: event.target.value})} >
                            <option value='low'>Low</option>
                            <option value='medium'>Medium</option>
                            <option value='high'>High</option>
                        </select>
                    </label>
                    <label>
                        Due Date
                        <input type='date' value={draft.due_date ?? ''} onChange={(event) => setDraft({...draft, due_date: event.target.value})} />
                    </label>
                    <label>
                        Status
                        <select value={draft.status ?? task.status} onChange={(event) => setDraft({...draft, status: event.target.value})} >
                            {columns.map((column) => (
                                <option key={column.taskStatus} value={column.taskStatus}> 
                                    {column.title}
                                </option>
                            ))}
                        </select> 
                    </label>

                    <fieldset className='assignee-picker'>
                        <legend>Assign Team Members</legend>
                        {teamMembers.map((member) => (
                            <label key={member.id} className='assignee-option'>
                                <input type='checkbox' checked={selectedMemberIds.includes(member.id)} 
                                    onChange={(event) => {
                                        if(event.target.checked)
                                        {
                                            setSelectedMemberIds((current) => [...current, member.id]);
                                        } else {
                                            setSelectedMemberIds((current) => current.filter((id) => id !== member.id));
                                        }
                                    }}
                                />
                                <MemberAvatar member={member} />
                                <span>{member.name}</span>
                            </label>
                        ))}
                    </fieldset>

                    {saveError && (<p role='alert'>{saveError}</p>)}

                    <div className='dialog-actions'>
                        <button type='button' className='secondary-button' onClick={() => editDialogRef.current?.close()}>
                            Cancel
                        </button>
                        <button type='submit' disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    );
}

export default TaskCard;