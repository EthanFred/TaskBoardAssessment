
import { useState, useEffect } from 'react';
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

  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    async function loadTasks()
    {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if(authError || !authData.user)
      {
        console.error("Guest login required.");
        return;
      }

      const {data, error} = await supabase.from('tasks').select('*')
        .order('created_at', {ascending: true});

      if(error)
      {
        console.error('Failed to load tasks:', error)
        return;
      }

      setTasks(data);
    }

    loadTasks();
  }, []);

  async function addTask(event)
  {
    event.preventDefault()

    const newTitle = newTaskTitle.trim();

    if(newTitle === '') return;

    const {data,error} = await supabase.from('tasks').insert({
      title: newTitle, status: 'todo'
    }).select().single();

    if(error)
    {
      console.error("Failed to insert new task:", error);
      return;
    }

    setTasks((currentTasks) => [...currentTasks, data]);
    setNewTaskTitle('');
  }

  async function changeTaskStatus(taskId, newStatus)
  {

    const {data,error} = await supabase.from('tasks').update({status: newStatus})
      .eq('id', taskId).select().single();

    if(error)
    {
      console.error("Failed to update task status:", error)
    }
    setTasks((currentTasks) => currentTasks.map((task) => 
      task.id === taskId ? data : task));
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
    }

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
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

  return (
    <main className="app"> 
      <h1> Task Board </h1>
      
      <form onSubmit={addTask} className="task-form">
        <input type="text" placeholder="Enter a new task..." value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} />
        <button type="submit"> Add Task </button>
      </form>

      <button type="button" onClick={testGuestLogin}>
        Test Guest Login
      </button>

      <div className="board">
        <DragDropProvider onDragEnd={dragEnd}>
          <div className='board'>
            {columns.map((column) => (
              <TaskColumn  key={column.taskStatus} column={column} columns={columns} tasks={tasks} 
                changeTaskStatus={changeTaskStatus} deleteTask={deleteTask} />
            ))}
          </div>
        </DragDropProvider>
      </div>
    

      
    </main>
    
  );
}

export default App;
