import { useDraggable } from '@dnd-kit/react'
import { useState } from 'react';
import MemberAvatar from './MemberAvatar';

import { Badge } from '@/components/ui/badge';
import {Card, CardHeader, CardTitle, CardContent, CardFooter} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { NativeSelect, NativeSelectOption} from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';


function TaskCard({task, columns, changeTaskStatus, deleteTask, updateTask, teamMembers, assignedMembers, saveTaskMembers})
{
    const [editOpen, setEditOpen] = useState(false);

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
        setEditOpen(true);
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

            setEditOpen(false);


        } catch(error) {
            console.error("Failed to save changes: ", error);
            setSaveError("Something went wrong while saving");

        } finally {
            setSaving(false);
        }
    }

    return(
        <>
            <Card ref={ref} size='sm' className={`task-card priority-${task.priority} ${isDragging ? 'dragging' : ''}`}>
                <button type='button' ref={handleRef} className='drag-handle' aria-label={`Drag ${task.title}`} title='Drag task' />

                <CardHeader className='gap-2 pt-3 pb-2'>
                    <div className='flex items-start justify-between gap-2'>
                        <CardTitle className='text-base'>
                            {task.title}
                        </CardTitle>

                        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}>
                            {task.priority}
                        </Badge>
                    </div>

                    {task.description && (<p className="task-description"> {task.description} </p>)}
                </CardHeader>

                <CardContent className='space-y-3 pb-3'>
                    <p className='text-xs text-muted-foreground'>Due Date: {task.due_date || 'No due date assigned'} </p>
                    <div className='assignee-avatars'>
                        {assignedMembers.length === 0 ? 
                            (<span className='text-sm text-muted-foreground'>Unassigned</span>) : 
                            (assignedMembers.map((member) => (<MemberAvatar key={member.id} member={member}/>)))}
                    </div>

                </CardContent>

                <CardFooter className='flex flex-col items-stretch gap-2 border-t pt-3 pb-3'>
                    
                    <div className='flex w-full gap-2'>
                        <Button type='button' variant='outline' className='shadcn-button flex-1' onClick={openEditor}>
                            Update
                        </Button>
                        <Button type='button' variant='destructive' className='shadcn-button flex-1' onClick={() => deleteTask(task.id)}>
                            Delete
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className='max-h-[86vh] overflow-y-auto sm:max-w-xl'>
                    <DialogHeader>
                        <DialogTitle>Update Task</DialogTitle>
                        <DialogDescription>Edit task details and assigne team members.</DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={saveChanges} className='edit-task-form board-dialog-form'>
                        <label>
                            Title
                            <Input type='text' value={draft.title ?? ''} onChange={(event) => setDraft({...draft, title: event.target.value})} required />
                        </label>
                        <label>
                            Description
                            <Textarea value={draft.description ?? ''} onChange={(event) => setDraft({...draft, description: event.target.value})} /> 
                        </label>
                        <label>
                            Priority
                            <NativeSelect value={draft.priority ?? 'medium'} onChange={(event) => setDraft({...draft, priority: event.target.value})} >
                                <NativeSelectOption value='low'>Low</NativeSelectOption>
                                <NativeSelectOption value='medium'>Medium</NativeSelectOption>
                                <NativeSelectOption value='high'>High</NativeSelectOption>
                            </NativeSelect>
                        </label>
                        <label>
                            Due Date
                            <Input type='date' value={draft.due_date ?? ''} onChange={(event) => setDraft({...draft, due_date: event.target.value})} />
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
                                <div key={member.id} className='assignee-option'>
                                    <Checkbox id={`member-${task.id}-${member.id}`} checked={selectedMemberIds.includes(member.id)} onCheckedChanged={(checked) =>{
                                        if(checked)
                                        {
                                            setSelectedMemberIds((current) => [...current, member.id]);
                                        } else {
                                            setSelectedMemberIds((current) => current.filter((id) => id !== member.id));
                                        }
                                    }}/>
                                    <label htmlFor={`member-${task.id}-${member.id}`} className='flex items-center gap-3 cursor-pointer'>
                                        <MemberAvatar member={member} />
                                        <span>{member.name}</span>
                                    </label>
                                </div>
                            ))}
                        </fieldset>

                        {saveError && (<p role='alert'>{saveError}</p>)}

                        <DialogFooter>
                            <Button type='button' variant='outline' className='shadcn-button' onClick={() => setEditOpen(false)} disabled={saving}> Cancel </Button>
                            <Button type='submit' className='shadcn-button' disabled={saving}> {saving ? "Saving..." : "Save Changes"} </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default TaskCard;