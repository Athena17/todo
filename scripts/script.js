class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.draggedTask = null;
        this.initializeElements();
        this.bindEvents();
        this.renderTasks();
        this.setupMidnightReset(); // Set up the midnight reset
    }

    initializeElements() {
        this.taskInput = document.getElementById('todoInput');
        this.addTaskBtn = document.getElementById('addTodo'); // Corrected ID
        this.taskList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.dateDisplay = document.getElementById('dateDisplay');
        this.completedTasksList = document.getElementById('completedTasksList');
        this.completedEmptyState = document.getElementById('completedEmptyState');
    }

    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.updateDateDisplay();
    }

    updateDateDisplay() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const formattedDate = now.toLocaleDateString('en-US', options);
        this.dateDisplay.textContent = formattedDate;
    }

    addTask() {
        const text = this.taskInput.value.trim();
        console.log('Add Task button clicked'); // Debugging
        if (!text) {
            console.log('No task text provided'); // Debugging
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        console.log('Adding task:', task); // Debugging
        this.tasks.unshift(task); // Add to the top of the list
        this.saveTasks();
        this.renderTasks();
        this.taskInput.value = '';
        this.taskInput.focus();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.tasks = this.tasks.filter(t => t.id !== id); // Remove from current position
            this.tasks.unshift(task); // Add to the top of the opposite list
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(id) {
        if (confirm('Delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
        }
    }

    clearAllTasks() {
        this.tasks = [];
        this.saveTasks();
        this.renderTasks();
    }

    getTaskAge(createdAt) {
        const now = new Date();
        const created = new Date(createdAt);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.min(diffDays, 20); // Cap at 20 days for visual purposes
    }

    // Drag and Drop methods
    handleDragStart(e, taskId) {
        this.draggedTask = taskId;
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    }

    handleDragEnd(e) {
        e.target.style.opacity = '1';
        this.draggedTask = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        const todoItem = e.target.closest('.todo-item');
        if (todoItem) {
            todoItem.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const todoItem = e.target.closest('.todo-item');
        if (todoItem) {
            todoItem.classList.remove('drag-over');
        }
    }

    handleDrop(e, targetTaskId) {
        e.preventDefault();
        
        if (!this.draggedTask || this.draggedTask === targetTaskId) return;
        
        const draggedTask = this.tasks.find(t => t.id === this.draggedTask);
        const targetTask = this.tasks.find(t => t.id === targetTaskId);
        
        if (!draggedTask || !targetTask) return;
        
        // Remove the dragged task
        const draggedIndex = this.tasks.findIndex(t => t.id === this.draggedTask);
        const targetIndex = this.tasks.findIndex(t => t.id === targetTaskId);
        
        // If moving between sections
        if (draggedTask.completed !== targetTask.completed) {
            draggedTask.completed = targetTask.completed;
        }
        
        // Move the task
        this.tasks.splice(draggedIndex, 1);
        this.tasks.splice(targetIndex, 0, draggedTask);
        
        this.saveTasks();
        this.renderTasks();
    }

    handleDropAtEnd(e, completed) {
        e.preventDefault();
        
        if (!this.draggedTask) return;
        
        const draggedTask = this.tasks.find(t => t.id === this.draggedTask);
        if (!draggedTask) return;
        
        // Remove the dragged task from its current position
        this.tasks = this.tasks.filter(t => t.id !== this.draggedTask);
        
        // Update completion status if needed
        if (draggedTask.completed !== completed) {
            draggedTask.completed = completed;
        }
        
        // Add to the end of the appropriate list
        this.tasks.push(draggedTask);
        
        this.saveTasks();
        this.renderTasks();
    }

    reorderTasks(draggedId, targetId) {
        const draggedTask = this.tasks.find(t => t.id === draggedId);
        const targetTask = this.tasks.find(t => t.id === targetId);
        
        if (!draggedTask || !targetTask) return;
        
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const targetIndex = this.tasks.findIndex(t => t.id === targetId);
        
        // If moving between sections
        if (draggedTask.completed !== targetTask.completed) {
            draggedTask.completed = targetTask.completed;
        }
        
        // Move the task
        this.tasks.splice(draggedIndex, 1);
        this.tasks.splice(targetIndex, 0, draggedTask);
        
        this.saveTasks();
        this.renderTasks();
    }

    renderTasks() {
        const activeTasks = this.tasks.filter(task => !task.completed);
        const completedTasks = this.tasks.filter(task => task.completed);

        // Render active tasks
        if (activeTasks.length === 0) {
            this.taskList.style.display = 'block';
            this.emptyState.style.display = 'block';
            this.taskList.innerHTML = `
                <div class="drop-zone empty-list" 
                     ondragover="taskManager.handleDragOver(event)"
                     ondragenter="taskManager.handleDragEnter(event)"
                     ondragleave="taskManager.handleDragLeave(event)"
                     ondrop="taskManager.handleDropAtEnd(event, false)"></div>
            `;
        } else {
            this.taskList.style.display = 'block';
            this.emptyState.style.display = 'none';

            this.taskList.innerHTML = activeTasks.map(task => {
                const age = this.getTaskAge(task.createdAt);
                const ageClass = `age-${age}`;
                const capitalizedText = task.text.charAt(0).toUpperCase() + task.text.slice(1);

                return `
                    <div class="todo-item ${ageClass}" 
                         data-id="${task.id}"
                         draggable="true"
                         ondragstart="taskManager.handleDragStart(event, ${task.id})"
                         ondragend="taskManager.handleDragEnd(event)"
                         ondragover="taskManager.handleDragOver(event)"
                         ondragenter="taskManager.handleDragEnter(event)"
                         ondragleave="taskManager.handleDragLeave(event)"
                         ondrop="taskManager.handleDrop(event, ${task.id})">
                        <div class="todo-checkbox" onclick="taskManager.toggleTask(${task.id})"></div>
                        <div class="todo-content">
                            <div class="todo-text">${this.escapeHtml(capitalizedText)}</div>
                        </div>
                        <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete">×</button>
                    </div>
                `;
            }).join('') + `
                <div class="drop-zone" 
                     ondragover="taskManager.handleDragOver(event)"
                     ondragenter="taskManager.handleDragEnter(event)"
                     ondragleave="taskManager.handleDragLeave(event)"
                     ondrop="taskManager.handleDropAtEnd(event, false)"></div>
            `;
        }

        // Render completed tasks
        if (completedTasks.length === 0) {
            this.completedTasksList.style.display = 'block';
            this.completedEmptyState.style.display = 'block';
            this.completedTasksList.innerHTML = `
                <div class="drop-zone empty-list" 
                     ondragover="taskManager.handleDragOver(event)"
                     ondragenter="taskManager.handleDragEnter(event)"
                     ondragleave="taskManager.handleDragLeave(event)"
                     ondrop="taskManager.handleDropAtEnd(event, true)"></div>
            `;
        } else {
            this.completedTasksList.style.display = 'block';
            this.completedEmptyState.style.display = 'none';

            this.completedTasksList.innerHTML = completedTasks.map(task => {
                const age = this.getTaskAge(task.createdAt);
                const ageClass = `age-${age}`;
                const capitalizedText = task.text.charAt(0).toUpperCase() + task.text.slice(1);

                return `
                    <div class="todo-item completed ${ageClass}" 
                         data-id="${task.id}"
                         draggable="true"
                         ondragstart="taskManager.handleDragStart(event, ${task.id})"
                         ondragend="taskManager.handleDragEnd(event)"
                         ondragover="taskManager.handleDragOver(event)"
                         ondragenter="taskManager.handleDragEnter(event)"
                         ondragleave="taskManager.handleDragLeave(event)"
                         ondrop="taskManager.handleDrop(event, ${task.id})">
                        <div class="todo-checkbox checked" onclick="taskManager.toggleTask(${task.id})"></div>
                        <div class="todo-content">
                            <div class="todo-text">${this.escapeHtml(capitalizedText)}</div>
                        </div>
                        <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete">×</button>
                    </div>
                `;
            }).join('') + `
                <div class="drop-zone" 
                     ondragover="taskManager.handleDragOver(event)"
                     ondragenter="taskManager.handleDragEnter(event)"
                     ondragleave="taskManager.handleDragLeave(event)"
                     ondrop="taskManager.handleDropAtEnd(event, true)"></div>
            `;
        }
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupMidnightReset() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0); // Set to midnight
        const timeToMidnight = midnight.getTime() - now.getTime();

        setTimeout(() => {
            this.clearCompletedTasks();
            this.setupMidnightReset(); // Re-setup for the next day
        }, timeToMidnight);
    }

    clearCompletedTasks() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.renderTasks();
    }
}

// Add CSS for delete button
const deleteBtnStyles = document.createElement('style');
deleteBtnStyles.textContent = `
    .delete-btn {
        background: none;
        border: none;
        color: #c0c0c0;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.3s ease;
        flex-shrink: 0;
        font-weight: 300;
    }
    
    .delete-btn:hover {
        color: #8b7355;
    }
`;
document.head.appendChild(deleteBtnStyles);

// Initialize the app
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});

// Add some sample tasks on first visit
if (!localStorage.getItem('tasks')) {
    const sampleTasks = [
        {
            id: Date.now() - 2,
            text: "Welcome to your simple task manager",
            completed: false,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: Date.now() - 1,
            text: "Click the square to mark tasks as complete",
            completed: false,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    localStorage.setItem('tasks', JSON.stringify(sampleTasks));
}
