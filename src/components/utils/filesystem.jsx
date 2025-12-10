/**
 * Filesystem Helpers para el modelo jerárquico de la app
 * Estructura: Curso > Carpeta > Materia > Quiz
 * - Courses pueden contener Folders y Subjects
 * - Folders pueden contener Subjects y otras Folders (anidadas)
 * - Subjects contienen Quizzes
 */

/**
 * Determina si un item puede moverse a un destino
 */
export function canMoveItemToTarget(itemType, targetType) {
  const validMoves = {
    folder: ['course', 'folder'],      // Folder -> Course o Folder
    subject: ['course', 'folder'],     // Subject -> Course o Folder
    quiz: ['subject']                  // Quiz -> Subject
  };
  
  return validMoves[itemType]?.includes(targetType) || false;
}

/**
 * Prepara los datos de actualización para mover un item
 */
export function prepareMoveData(itemType, targetId, targetType) {
  const updateData = {};
  
  if (itemType === 'folder') {
    if (targetType === 'course') {
      updateData.course_id = targetId;
      updateData.parent_id = null;
    } else if (targetType === 'folder') {
      updateData.parent_id = targetId;
    }
  }
  
  if (itemType === 'subject') {
    if (targetType === 'course') {
      updateData.course_id = targetId;
      updateData.folder_id = null;
    } else if (targetType === 'folder') {
      updateData.folder_id = targetId;
    }
  }
  
  if (itemType === 'quiz') {
    if (targetType === 'subject') {
      updateData.subject_id = targetId;
    }
  }
  
  return updateData;
}

/**
 * Valida que un item no se mueva a sí mismo o a sus descendientes
 */
export function isValidMove(itemId, targetId) {
  return itemId !== targetId;
}