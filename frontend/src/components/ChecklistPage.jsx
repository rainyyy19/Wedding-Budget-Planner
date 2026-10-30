import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, Trash2, Edit2, Calendar, 
  Sparkles, CheckCircle2, Clock, AlertCircle, Filter
} from 'lucide-react';
import { api, formatDate } from '../services/api';

export default function ChecklistPage({ user, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'completed', 'overdue'

  // Add/Edit task modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'General',
    due_date: '',
    priority: 'medium',
    notes: ''
  });

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId) => {
    try {
      await api.toggleTask(taskId);
      loadTasks();
      onShowToast('Task updated!', 'success');
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      await api.deleteTask(id);
      onShowToast('Task deleted.', 'info');
      loadTasks();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      category: 'General',
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      priority: 'medium',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTask(t);
    setTaskForm({
      title: t.title || '',
      category: t.category || 'General',
      due_date: t.due_date || '',
      priority: t.priority || 'medium',
      notes: t.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title) {
      onShowToast('Task title is required.', 'error');
      return;
    }
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, taskForm);
        onShowToast('Task updated successfully.', 'success');
      } else {
        await api.createTask(taskForm);
        onShowToast('New wedding task created.', 'success');
      }
      setModalOpen(false);
      loadTasks();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleLoadStarters = async () => {
    try {
      // Create initial starter tasks if empty or requested
      const starters = [
        { title: "Finalize and book primary wedding venue", category: "Venue & Banquets", priority: "high", offset: 30 },
        { title: "Schedule food tastings & confirm catering contract", category: "Catering & Bar", priority: "high", offset: 45 },
        { title: "Book lead photographer & cinematography team", category: "Photography & Video", priority: "high", offset: 60 },
        { title: "Order custom bridal outfit and groom attire", category: "Clothing & Jewellery", priority: "high", offset: 90 },
        { title: "Lock floral concept, mandap theme, and decor vendor", category: "Decoration & Floral", priority: "medium", offset: 100 },
        { title: "Book certified bridal hair and makeup artist", category: "Makeup & Hair Styling", priority: "high", offset: 110 },
        { title: "Design invitations and finalize guest address list", category: "Invitations & Stationery", priority: "medium", offset: 120 }
      ];

      for (const st of starters) {
        const d = new Date(Date.now() + st.offset * 86400000).toISOString().split('T')[0];
        await api.createTask({
          title: st.title,
          category: st.category,
          due_date: d,
          priority: st.priority,
          notes: 'Standard wedding planning milestone'
        });
      }
      onShowToast('Starter wedding tasks added!', 'success');
      loadTasks();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // Filter tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'pending') return !t.is_completed;
    if (filterStatus === 'completed') return t.is_completed;
    if (filterStatus === 'overdue') return !t.is_completed && t.due_date && t.due_date < todayStr;
    return true;
  });

  const completedCount = tasks.filter(t => t.is_completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh', padding: '40px 0 80px 0' }}>
      <div className="max-w-5xl">
        
        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-burgundy)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              <CheckSquare size={16} />
              <span>Timeline & Milestones</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', color: 'var(--color-burgundy)' }}>
              Wedding Planning Checklist
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem' }}>
              Stay on schedule with prioritized tasks, contractual obligations, and day-of readiness.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {tasks.length === 0 && (
              <button
                onClick={handleLoadStarters}
                className="btn-gold"
              >
                <Sparkles size={15} />
                <span>Load Starter Tasks</span>
              </button>
            )}
            <button
              onClick={openAddModal}
              className="btn-primary"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* PROGRESS CARD */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '4px' }}>
                {completedCount} of {tasks.length} Milestones Completed
              </span>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)' }}>
                Checklist Completion Progress
              </h3>
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-burgundy)' }}>
              {progressPct}%
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: 'var(--color-ivory)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{
              width: `${progressPct}%`,
              backgroundColor: 'var(--color-success)',
              height: '100%',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="nav-tabs" style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setFilterStatus('all')}
            className={`nav-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
          >
            All Milestones ({tasks.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`nav-tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          >
            To-Do ({tasks.filter(t => !t.is_completed).length})
          </button>
          <button
            onClick={() => setFilterStatus('overdue')}
            className={`nav-tab-btn ${filterStatus === 'overdue' ? 'active' : ''}`}
          >
            Overdue ({tasks.filter(t => !t.is_completed && t.due_date && t.due_date < todayStr).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`nav-tab-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* TASKS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
              <CheckCircle2 size={36} color="var(--color-success)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
                No tasks in this view
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Everything looks tidy! Click "Add Task" or "Load Starter Tasks" to add more.
              </p>
              {tasks.length === 0 && (
                <button onClick={handleLoadStarters} className="btn-gold">
                  <Sparkles size={16} />
                  <span>Load Essential Milestones</span>
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isOverdue = !t.is_completed && t.due_date && t.due_date < todayStr;
              let countdownText = null;
              if (!t.is_completed && t.due_date) {
                const diff = Math.round((new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                if (diff === 0) countdownText = 'Due Today';
                else if (diff > 0 && diff <= 14) countdownText = `Due in ${diff}d`;
              }

              return (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    backgroundColor: t.is_completed ? 'var(--color-ivory)' : '#FFFFFF',
                    border: isOverdue ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                    opacity: t.is_completed ? 0.8 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={!!t.is_completed}
                      onChange={() => handleToggle(t.id)}
                      style={{
                        width: '19px',
                        height: '19px',
                        cursor: 'pointer',
                        accentColor: 'var(--color-burgundy)'
                      }}
                    />

                    <div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: t.is_completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                        textDecoration: t.is_completed ? 'line-through' : 'none',
                        marginBottom: '3px'
                      }}>
                        {t.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                        <span>Category: {t.category}</span>
                        <span>•</span>
                        <span>Due: {formatDate(t.due_date)}</span>
                        {isOverdue && (
                          <span className="badge badge-danger" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                            Overdue
                          </span>
                        )}
                        {!isOverdue && countdownText && (
                          <span className="badge badge-warning" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                            {countdownText}
                          </span>
                        )}
                        {t.is_completed && t.completed_at && (
                          <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                            Completed
                          </span>
                        )}
                      </div>

                      {t.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {t.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge badge-priority-${t.priority === 'high' ? 'must' : t.priority === 'medium' ? 'nice' : 'luxury'}`}>
                      {t.priority}
                    </span>

                    <button
                      onClick={() => openEditModal(t)}
                      style={{ color: 'var(--color-burgundy)', padding: '5px' }}
                      title="Edit Task"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.title)}
                      style={{ color: 'var(--color-text-muted)', padding: '5px' }}
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL: ADD / EDIT TASK */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '28px' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
                {editingTask ? 'Edit Wedding Task' : 'Add New Task'}
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Record milestones, RSVP deadlines, or vendor follow-up appointments.
              </p>

              <form onSubmit={handleSubmitTask}>
                <div className="form-group">
                  <label className="form-label">Task Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Schedule rehearsal dinner walkthrough"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={taskForm.category}
                      onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    >
                      <option value="General">General Milestone</option>
                      <option value="Venue & Banquets">Venue & Banquets</option>
                      <option value="Catering & Bar">Catering & Bar</option>
                      <option value="Decoration & Floral">Decoration & Floral</option>
                      <option value="Clothing & Jewellery">Clothing & Jewellery</option>
                      <option value="Photography & Video">Photography & Video</option>
                      <option value="Makeup & Hair Styling">Makeup & Hair</option>
                      <option value="Invitations & Stationery">Invitations</option>
                      <option value="Guest Accommodation">Accommodation</option>
                      <option value="Entertainment & Music">Music & DJ</option>
                      <option value="Transportation & Logistics">Logistics</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Completion Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="e.g. Contact hotel manager directly before 5pm"
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
