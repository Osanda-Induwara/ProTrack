/**
 * =====================================================
 * Column Component (Kanban Column/Status)
 * =====================================================
 * 
 * WHY: Represents one column on the Kanban board.
 * Example: "To Do", "In Progress", "Done"
 * 
 * EACH COLUMN:
 * - Displays tasks with that status
 * - Accepts drag-drop
 * - Shows task count
 */

import React from 'react';
import TaskCard from './TaskCard';
import '../../styles/Kanban.css';

const Column = ({
  columnName,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
  onTaskClick
}) => {
  return (
    <div className="kanban-column">
      <div className="column-header">
        <h2>{columnName}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>

      {/* DROP ZONE FOR DRAGGING TASKS */}
      <div
        className="column-content"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {tasks.length === 0 ? (
          <div className="empty-column">No tasks yet</div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onDragStart={() => onDragStart(task)}
              onClick={() => onTaskClick(task)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Column;
