
import {useState} from 'react';
import './App.css';

function App() {

  const [task, setTask] = useState("Create task board");

  return (
    <main> 
      <h1> Task Board </h1>
      <p>{task}</p>
    

    <button onClick={() => setTask("Implement drag and drop")}> Change Task </button>
    </main>
    
  );
}

export default App
