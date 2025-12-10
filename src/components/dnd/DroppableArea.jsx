import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

export default function DroppableArea({ droppableId, type, children, className = '' }) {
  return (
    <Droppable droppableId={droppableId} type={type}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${className} ${snapshot.isDraggingOver ? 'bg-indigo-50 ring-2 ring-indigo-200 ring-inset rounded-lg' : ''}`}
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}