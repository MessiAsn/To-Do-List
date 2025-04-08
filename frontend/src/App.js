// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const response = await fetch('http://localhost:8000/tasks/');
    const data = await response.json();
    setTasks(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskData = { title, description, status };

    if (editingId) {
      await fetch(`http://localhost:8000/tasks/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
    } else {
      await fetch('http://localhost:8000/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
    }

    resetForm();
    fetchTasks();
  };

  const handleEdit = (task) => {
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setEditingId(task.id);
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:8000/tasks/${id}`, {
      method: 'DELETE',
    });
    fetchTasks();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('Pendente');
    setEditingId(null);
  };

  return (
    <div className="container">
      <h1>TaskMaster</h1>
      
      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Pendente">Pendente</option>
          <option value="Em Andamento">Em Andamento</option>
          <option value="Concluída">Concluída</option>
        </select>
        <button type="submit">{editingId ? 'Atualizar' : 'Adicionar'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancelar</button>}
      </form>

      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <div className="task-meta">
              <span className={`status ${task.status.replace(' ', '-')}`}>
                {task.status}
              </span>
              <span className="created-at">
                {new Date(task.created_at).toLocaleString()}
              </span>
            </div>
            <div className="task-actions">
              <button onClick={() => handleEdit(task)}>Editar</button>
              <button onClick={() => handleDelete(task.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;