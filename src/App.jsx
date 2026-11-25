
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { DragDropProvider } from '@dnd-kit/react';
import TaskColumn from './components/TaskColumn';
import { supabase } from './lib/supabaseClient';
import TeamPanel from './components/TeamPanel';

import { Button } from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';



const columns = [
  { taskStatus: 'todo', title: 'To Do' },
  { taskStatus: 'in-progress', title: 'In Progress' },
  { taskStatus: 'in-review', title: 'In Review'},
  { taskStatus: 'completed', title: 'Done' }
];


function App() {

  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  const [teamMembers, setTeamMembers] = useState([]);
  const [taskAssignees, setTaskAssignees] = useState([]);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  useEffect(() => {

    let ignore = false;

    async function initializeApp()
    {
      try {
        const {data: sessionData, error: sessionError} = await supabase.auth.getSession();

        if(ignore) return;
        if(sessionError) throw sessionError;

        if(!sessionData.session)
        {
          const {error: loginError} = await supabase.auth.signInAnonymously();

          if(loginError) throw loginError;
        }

        if (ignore) return;

        // Get the authenticated user
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!userData.user) throw new Error('User not found');

        // Get this user's profile
        const { data: profileData, error: profileError } = 
          await supabase.from('profiles').select('id, display_name').eq('id', userData.user.id).single();

        if (profileError) throw profileError;

        if (!ignore) {
          setCurrentUser(userData.user);
          setProfile(profileData);
          setNameInput(profileData.display_name);
        }

        if(ignore) return;
      
        const { data: data, error: error } = await supabase.from('tasks').select('*').order('created_at', {ascending: true});

        if (error) throw error;

        if(!ignore) setTasks(data);

        const[membersResult, assignmentsResult] = await Promise.all([
          supabase.from('team_members').select('*').order('created_at', {ascending: true}),
          supabase.from('task_assignees').select('task_id, member_id')
        ])

        if(membersResult.error) throw membersResult.error;
        if(assignmentsResult.error) throw assignmentsResult.error;

        if(!ignore)
        {
          setTeamMembers(membersResult.data);
          setTaskAssignees(assignmentsResult.data)
        }
      } catch (error) {

        if(!ignore) 
        {
          console.error("Initialization Failed", error);
          setErrorMessage(error.message || "Something went wrong");
        }
      } finally {
        if(!ignore) setIsLoading(false);
      }
    }
    initializeApp();
    return () => { ignore = true; };
  }, []);

  async function addTask(event)
  {
    event.preventDefault()

    const title = newTitle.trim();

    if(title === '') return;
    

    const {data,error} = await supabase.from('tasks').insert({
      title: title, 
      description: newDescription,
      priority: newPriority,
      due_date: newDueDate || null,
      status: 'todo'
    }).select().single();

    if(error)
    {
      console.error("Failed to insert new task:", error);
      return;
    }

    setTasks((currentTasks) => [...currentTasks, data]);

    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate('');
    setTaskDialogOpen(false);
  }

  async function changeTaskStatus(taskId, newStatus)
  {

    const {data,error} = await supabase.from('tasks').update({status: newStatus})
      .eq('id', taskId).select().single();

    if(error)
    {
      console.error("Failed to update task status:", error)
      return;
    }
    setTasks((currentTasks) => currentTasks.map((task) => 
      task.id === taskId ? data : task));
  }

  async function updateTask(taskId, changes)
  {
    const {data, error} = await supabase.from('tasks').update(changes).eq('id', taskId).select().single();

    if(error)
    {
      console.error("Failed to update task:", error);
      return false;
    }

    setTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? data : task));
    return true;
  }

  function dragEnd(event)
  {
    if(event.canceled) return;

    const {source, target} = event.operation;

    if(!source || !target) return;

    const destinationColumn = columns.find((column) => column.taskStatus === target.id);

    if(!destinationColumn) return;

    changeTaskStatus(source.id, destinationColumn.taskStatus);
  }

  async function deleteTask(taskId) 
  {
    const {data,error} = await supabase.from('tasks').delete().eq('id', taskId);

    if(error)
    {
      console.error("Error deleting task:", error);
      return;
    }

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  async function saveDisplayInfo(event)
  {
    event.preventDefault();

    const name = nameInput.trim();

    if(name.length === 0 || name.length > 40)
    {
      setNameError("Name must be between 1 and 40 characters");
      return;
    }

    const {data, error} = await supabase.from('profiles').update({display_name: name}).eq('id', currentUser.id).select().single();

    if(error)
    {
      console.error("Failed to update user name:", error);
      setNameError("Unable to save user name");
      return;
    }

    setProfile(data);
    setNameInput(data.display_name);
    setNameError('');
  }

  async function addTeamMember(name, avatar, color){
    
    const{data, error} = await supabase.from('team_members').insert({name: name.trim(), avatar: avatar.trim() || null, color: color}).select().single();

    if(error)
    {
      console.error("Failed to add team member: ", error);
      return false;
    }

    setTeamMembers((currentMembers) => [...currentMembers, data]);
    return true;
    
  }

  async function saveTaskMembers(taskId, memberIds)
  {
    const existingIds = taskAssignees.filter((row) => row.task_id === taskId).map((row) => row.member_id);

    const toAdd = memberIds.filter((id) => !existingIds.includes(id));
    const toRemove = existingIds.filter((id) => !memberIds.includes(id));

    if(toRemove.length > 0)
    {
      const {error} = await supabase.from('task_assignees').delete().eq('task_id', taskId).in('member_id', toRemove);
      if(error)
      {
        console.error("Cannot remove member from task");
        return false;
      }
    }
    if(toAdd.length > 0)
    {
      const newAssignments = toAdd.map((memberId) => ({ task_id: taskId, member_id: memberId }));
      const {error} = await supabase.from('task_assignees').insert(newAssignments);
      if(error)
      {
        console.error("Cannot add member to task");
        return false;
      }
    }

    setTaskAssignees((current) => [
      ...current.filter((row) => row.task_id !== taskId), 
      ...memberIds.map((memberId) => ({ task_id: taskId, member_id: memberId}))
    ]);
    return true;
  }
  /*async function testGuestLogin() {
    const { data: existing, error: lookupError } =
      await supabase.auth.getUser();

    if (lookupError && lookupError.name !== 'AuthSessionMissingError') {
      console.error(lookupError);
      return;
    }

    if (existing?.user) {
      console.log('Existing user:', existing.user.id);
      return;
    }

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('Guest login failed:', error);
      return;
    }

    console.log('Guest user ID:', data.user.id);
  }*/

  if (isLoading) {
    return (
      <main className="app">
        <h1>Task Board</h1>
        <p>Loading your tasks...</p>
      </main>
    );
  }
  
  if(errorMessage)
  {
    return (
      <main className="app">
        <h1>Task Board</h1>
        <p>Something went wrong: {errorMessage}</p>
      </main>
    );
  }

  return (
    
    <main className="app"> 
      <header className='app-header'>
        <div>
          <h1>Task Board </h1>
        </div>
        <Button type='button' className='shadcn-button' variant='outline' onClick={() => setTaskDialogOpen(true)}> Add Task </Button>
      </header>

      <form onSubmit={saveDisplayInfo} className="profile-form">
        <label htmlFor="display-name"> Your Display Name </label>
        <Input id='display-name' type='text' value={nameInput} onChange={(event) => setNameInput(event.target.value)} 
          placeholder='Enter your name' maxLength={40} required />
        <Button type='submit' className='shadcn-button'> Save Name </Button>

        {nameError ? (<p role="alert">{nameError}</p>) : null}
      </form>
      
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new task to your board.</DialogDescription>
          </DialogHeader>
      
          <form onSubmit={addTask} className="board-dialog-form">

            <label>
              Task Title
              <Input type="text" placeholder='Enter a title...' value={newTitle} onChange={(event) => setNewTitle(event.target.value)} required/>
            </label>
            <label>
              Description
              <Textarea placeholder='Enter a description...' value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows={3} />
            </label>
            <label>
              Priority
              <NativeSelect value={newPriority} onChange={(event) => setNewPriority(event.target.value)}>
                <NativeSelectOption value='low'>Low</NativeSelectOption>
                <NativeSelectOption value='medium'>Medium</NativeSelectOption>
                <NativeSelectOption value='high'>High</NativeSelectOption>
              </NativeSelect>
            </label>
            <label>
              Due Date
              <Input type='date' value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} />
            </label>

            <DialogFooter>
              <Button type='button' variant='outline' className='shadcn-button' onClick={() => setTaskDialogOpen(false)}> Cancel </Button>
              <Button type='submit' className='shadcn-button'>Add Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <TeamPanel members={teamMembers} addTeamMember={addTeamMember}>

      </TeamPanel>
      <DragDropProvider onDragEnd={dragEnd}>
        <div className='board'>
          {columns.map((column) => (
            <TaskColumn  key={column.taskStatus} column={column} columns={columns} tasks={tasks} 
              changeTaskStatus={changeTaskStatus} deleteTask={deleteTask} updateTask={updateTask} 
              teamMembers={teamMembers} taskAssignees={taskAssignees} saveTaskMembers={saveTaskMembers}/>
          ))}
        </div>
      </DragDropProvider>
    

      
    </main>
    
  );
}

export default App;
