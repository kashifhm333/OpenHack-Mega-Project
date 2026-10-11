import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Enable Cross-Origin Resource Sharing (CORS) for Vite frontend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// In-memory fallback tasks
let inMemoryTasks = [
  {
    id: '1',
    title: 'Set up CI/CD pipeline on GitHub Actions',
    description: 'Configure automated linting, test suite execution, and Docker build on main branch push.',
    category: 'DevOps',
    priority: 'high',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: '2',
    title: 'Implement JWT authentication & refresh tokens',
    description: 'Protect private endpoints and store secure HTTP-only cookies on the client side.',
    category: 'Development',
    priority: 'medium',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: '3',
    title: 'Database connection pool optimization',
    description: 'Tune max connection limits and add query logging for slow transactions.',
    category: 'Notes',
    priority: 'low',
    completed: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

// MongoDB Mongoose Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  priority: { type: String, default: 'medium' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Transform _id to id for client compatibility
taskSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const TaskModel = mongoose.model('Task', taskSchema);

let isMongoConnected = false;

// Connect to MongoDB if MONGO_URI is provided
if (MONGO_URI) {
  console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/:[^:]*@/, ':****@')}`);
  mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(async () => {
      isMongoConnected = true;
      console.log('✅ Connected to MongoDB successfully!');
      // Seed initial tasks if database is empty
      const count = await TaskModel.countDocuments();
      if (count === 0) {
        console.log('Seeding initial tasks into MongoDB...');
        await TaskModel.insertMany(
          inMemoryTasks.map(({ id, ...task }) => task)
        );
      }
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB connection error (using in-memory store):', err.message);
      isMongoConnected = false;
    });
} else {
  console.log('ℹ️ MONGO_URI not provided. Running with in-memory storage.');
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    api: 'Task Management & Notes Dashboard API',
    database: isMongoConnected ? 'connected' : 'in-memory (no MongoDB connection)',
  });
});

// GET /api/tasks - Retrieve all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    if (isMongoConnected) {
      const dbTasks = await TaskModel.find().sort({ createdAt: -1 });
      return res.json(dbTasks);
    }
    res.json(inMemoryTasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.json(inMemoryTasks);
  }
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const taskData = {
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category || 'General',
    priority: priority || 'medium',
    completed: false,
    createdAt: new Date(),
  };

  try {
    if (isMongoConnected) {
      const created = await TaskModel.create(taskData);
      return res.status(201).json(created);
    }

    const newTask = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: taskData.createdAt.toISOString(),
    };
    inMemoryTasks.unshift(newTask);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id - Update or toggle task completion
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected) {
      const updated = await TaskModel.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.json(updated);
    }

    const taskIndex = inMemoryTasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    inMemoryTasks[taskIndex] = {
      ...inMemoryTasks[taskIndex],
      ...req.body,
      id,
    };

    res.json(inMemoryTasks[taskIndex]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task by ID
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected) {
      const deleted = await TaskModel.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.json({ message: 'Task deleted successfully', id });
    }

    const initialLength = inMemoryTasks.length;
    inMemoryTasks = inMemoryTasks.filter((t) => t.id !== id);

    if (inMemoryTasks.length === initialLength) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully', id });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Task API Server running at http://localhost:${PORT}`);
  console.log(`👉 Endpoints: GET /api/health, GET /api/tasks, POST /api/tasks, PATCH /api/tasks/:id, DELETE /api/tasks/:id`);
});

