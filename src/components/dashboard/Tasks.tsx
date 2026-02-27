import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Plus, CheckCircle2, Circle, Clock, Trash2, Calendar, AlertCircle, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  createdAt: any;
}

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/tasks`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !user) return;

    try {
      if (editingTask) {
        await updateDoc(doc(db, `users/${user.uid}/tasks`, editingTask.id), {
          title: taskTitle,
          priority: taskPriority
        });
      } else {
        await addDoc(collection(db, `users/${user.uid}/tasks`), {
          title: taskTitle,
          status: 'Pending',
          priority: taskPriority,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const resetForm = () => {
    setTaskTitle('');
    setTaskPriority('Medium');
    setEditingTask(null);
    setIsAdding(false);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskPriority(task.priority);
    setIsAdding(true);
  };

  const handleStatusChange = async (task: Task) => {
    if (!user) return;
    
    const nextStatus = 
      task.status === 'Pending' ? 'In Progress' :
      task.status === 'In Progress' ? 'Completed' : 'Pending';

    try {
      await updateDoc(doc(db, `users/${user.uid}/tasks`, task.id), {
        status: nextStatus
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/tasks`, id));
      if (editingTask?.id === id) resetForm();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-stone-600 bg-stone-50 border-stone-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Farm Tasks</h1>
          <p className="text-stone-500 text-sm">Manage daily operations and to-dos</p>
        </div>
        <Button 
          onClick={() => {
            if (isAdding) resetForm();
            else setIsAdding(true);
          }} 
          icon={<Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />}
          variant={isAdding ? "secondary" : "primary"}
        >
          {isAdding ? 'Cancel' : 'New Task'}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveTask}
            className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm overflow-hidden"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                autoFocus
              />
              
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>

              <Button type="submit">
                {editingTask ? 'Update Task' : 'Add Task'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-3 gap-6">
        {['Pending', 'In Progress', 'Completed'].map((status) => (
          <div key={status} className="bg-stone-50/50 rounded-xl p-4 border border-stone-100 min-h-[200px]">
            <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2">
              {status === 'Pending' && <Circle className="w-4 h-4 text-stone-400" />}
              {status === 'In Progress' && <Clock className="w-4 h-4 text-amber-500" />}
              {status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {status}
              <span className="ml-auto bg-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === status).length}
              </span>
            </h3>

            <div className="space-y-3">
              {tasks.filter(t => t.status === status).map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm hover:shadow-md transition-shadow group relative"
                >
                  <div className="flex justify-between items-start gap-2 pr-16">
                    <p className="text-sm font-medium text-stone-900 break-words">{task.title}</p>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1">
                    <button 
                      onClick={() => handleEditClick(task)}
                      className="p-1.5 text-stone-400 hover:text-emerald-600 transition-colors rounded-md hover:bg-stone-100"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-md hover:bg-stone-100"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    
                    <button 
                      onClick={() => handleStatusChange(task)}
                      className="text-xs text-stone-400 hover:text-emerald-600 transition-colors"
                    >
                      {status === 'Completed' ? 'Reopen' : 'Next Stage →'}
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="text-center py-8 text-stone-400 text-sm italic">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
