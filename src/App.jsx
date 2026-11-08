
import {useState} from 'react';
import './App.css';

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed', title: 'Done' }
];


function App() {

  const [tasks, setTasks] = useState([
    { id: 1, title: 'Laundry', status: 'todo', user_id: null, created_at: new Date().toISOString() },
    { id: 2, title: 'Make Bed', status: 'in-progress', user_id: null, created_at: new Date().toISOString() },
    { id: 3, title: 'Pick Up Room', status: 'completed', user_id: null, created_at: new Date().toISOString() }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  function addTask(event)
  {
    event.preventDefault()

    const newTitle = newTaskTitle.trim();

    if(newTitle === '') return;

    const newTask = {
      id: crypto.randomUUID(),
      title: newTitle,
      status: 'todo',
      user_id: 0,
      created_at: 0
    }

    setTasks((currentTasks) => [...currentTasks, newTask]);
    setNewTaskTitle('');
  }

  function changeTaskStatus(taskId, newStatus)
  {
    setTasks((currentTasks) => currentTasks.map((task) => 
      task.id === taskId ? {...task, status: newStatus}: task));
  }

  function deleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }


  return (
    <main className="app"> 
      <h1> Task Board </h1>
      
      <form onSubmit={addTask} className="task-form">
        <input type="text" placeholder="Enter a new task..." value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} />
        <button type="submit"> Add Task </button>
      </form>

      <div className="board">
        {columns.map((column) => (
          <section className="column" key={column.id}>
            <h2>{column.title}</h2>

            {tasks.filter((task) => task.status === column.id).map((task) => (
              <article className="task-card" key={task.id}>
                <p>{task.title}</p>

                <select value={task.status} onChange={(event) => changeTaskStatus(task.id, event.target.value)}>
                  {columns.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option> 
                  ))} 
                </select>
                
                <button type="button" onClick={() => deleteTask(task.id)}> 
                  Delete
                </button>
              </article> 
            ))}
          </section> 
        ))}
      </div>
    

      <button onClick={() => setTask("Implement drag and drop")}> Change Task </button>
    </main>
    
  );
}

export default App;
