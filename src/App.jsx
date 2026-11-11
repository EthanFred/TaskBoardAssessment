
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { DragDropProvider } from '@dnd-kit/react';
import TaskColumn from './components/TaskColumn';
import { supabase } from './lib/supabaseClient';


const columns = [
  { taskStatus: 'todo', title: 'To Do' },
  { taskStatus: 'in-progress', title: 'In Progress' },
  { taskStatus: 'completed', title: 'Done' }
];


function App() {

  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [assignToMe, setAssignToMe] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  const taskDialogRef = useRef(null);

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

    const{data:userData, error:userError} = await supabase.auth.getUser();

    if (userError || !userData.user) {
    console.error('Unable to identify user:', userError);
    return;
  }

    const {data,error} = await supabase.from('tasks').insert({
      title: title, 
      description: newDescription,
      priority: newPriority,
      due_date: newDueDate || null,
      assignee_id: assignToMe ? userData.user.id : null,
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
    setAssignToMe(true);
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
      console.error("Failed to update task");
      return;
    }

    setTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? data : task));
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
      console.error("Failed to update user name");
      setNameError("Unable to save user name");
      return;
    }

    setProfile(data);
    setNameInput(data.display_name);
    setNameError('');
  }

  async function testGuestLogin() {
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
  }

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
        <button type='button' className='new-task-button' onClick={() => taskDialogRef.current.showModal()}> Add Task </button>
      </header>

      <form onSubmit={saveDisplayInfo} className="profile-form">
        <label htmlFor="display-name"> Your Display Name </label>
        <input id='display-name' type='text' value={nameInput} onChange={(event) => setNameInput(event.target.value)} 
          placeholder='Enter your name' maxLength={40} required />
        <button type='submit'> Save Name </button>

        {nameError ? (<p role="alert">{nameError}</p>) : null}
      </form>
      
      <dialog ref={taskDialogRef} className='task-dialog' aria-labelledby='new-task-heading'>
        <div className='dialog-header'>
          <h2 id="new-task-heading"> Create Task </h2>
          <button type='button' className='dialog-close' onClick={() => taskDialogRef.current.close()} aria-label="Close"> x </button>
        </div>
      
        <form onSubmit={addTask} className="task-form">
          <label className="full-width">
            Task Title
            <input type="text" placeholder='Enter a title...' value={newTitle} onChange={(event) => setNewTitle(event.target.value)} required autoFocus/>
          </label>
          <label className='full-width'>
            Description
            <textarea placeholder='Enter a description...' value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows='3' />
          </label>
          <label>
            Priority
            <select value={newPriority} onChange={(event) => setNewPriority(event.target.value)}>
              <option value='low'>Low</option>
              <option value='medium'>Medium</option>
              <option value='high'>High</option>
            </select>
          </label>
          <label>
            <input type='date' value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} />
          </label>
          <label className="assign-checkbox full-width">
            <input type="checkbox" checked={assignToMe} onChange={(event) => setAssignToMe(event.target.checked)}/>
            Assign to {profile?.display_name || 'me'}
          </label>
          <div className='dialog-actions full-width'>
            <button type='button' className='secondary-button' onClick={() => taskDialogRef.current.close()}> Cancel </button>
            <button type="submit" className='full-width'> Add Task </button>
          </div>
        </form>
      </dialog>

      <DragDropProvider onDragEnd={dragEnd}>
        <div className='board'>
          {columns.map((column) => (
            <TaskColumn  key={column.taskStatus} column={column} columns={columns} tasks={tasks} 
              changeTaskStatus={changeTaskStatus} deleteTask={deleteTask} updateTask={updateTask} 
              currentUser={currentUser} profile={profile}/>
          ))}
        </div>
      </DragDropProvider>
    

      
    </main>
    
  );
}

export default App;
