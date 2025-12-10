import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

export default function DraggableItem({ id, index, children, isAdmin }) {
  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative group ${snapshot.isDragging ? 'z-50 opacity-90' : ''}`}
        >
          <div
            {...provided.dragHandleProps}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          {children}
        </div>
      )}
    </Draggable>
  );
}