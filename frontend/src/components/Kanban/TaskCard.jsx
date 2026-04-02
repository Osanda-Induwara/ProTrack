/**
 * =====================================================
 * Task Card Component
 * =====================================================
 * 
 * WHY: Individual task card on Kanban board.
 * Shows task title, assignee, due date, tags.
 * Draggable between columns.
 */

import React from 'react';
import '../../styles/Kanban.css';

const TaskCard = ({ task, onDragStart, onClick }) => {
  // Format due date nicely
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <h3>{task.title}</h3>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {/* TAGS */}
      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* FOOTER: Assignee, Due Date, Comments */}
      <div className="task-footer">
        {task.assignee && (
          <span className="assignee" title={`Assigned to ${task.assignee.name}`}>
            👤 {task.assignee.name}
          </span>
        )}

        {task.dueDate && (
          <span className="due-date" title="Due date">
            📅 {formatDate(task.dueDate)}
          </span>
        )}

        {task.comments && task.comments.length > 0 && (
          <span className="comment-count" title="Comments">
            💬 {task.comments.length}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
