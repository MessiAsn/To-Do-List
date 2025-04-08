from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sqlite3
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "Pendente"

class TaskInDB(Task):
    id: int
    created_at: str

def get_db_connection():
    conn = sqlite3.connect('tasks.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.get("/tasks/", response_model=list[TaskInDB])
def read_tasks():
    conn = get_db_connection()
    tasks = conn.execute('SELECT * FROM tasks').fetchall()
    conn.close()
    return [dict(task) for task in tasks]

@app.post("/tasks/", response_model=TaskInDB)
def create_task(task: Task):
    conn = get_db_connection()
    created_at = datetime.now().isoformat()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO tasks (title, description, status, created_at)
        VALUES (?, ?, ?, ?)
        ''',
        (task.title, task.description, task.status, created_at)
    )
    conn.commit()
    task_id = cursor.lastrowid
    new_task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    conn.close()
    return dict(new_task)

@app.put("/tasks/{task_id}", response_model=TaskInDB)
def update_task(task_id: int, task: Task):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        UPDATE tasks 
        SET title = ?, description = ?, status = ?
        WHERE id = ?
        ''',
        (task.title, task.description, task.status, task_id)
    )
    conn.commit()
    updated_task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    conn.close()
    if updated_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return dict(updated_task)

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Task deleted successfully"}