// components/utils/moveItems.js

/**
 * Mueve items (folders, subjects, quizzes) actualizando sus relaciones parent/container
 * 
 * @param {Array} items - Array de {type, id}
 * @param {string|null} targetId - ID del contenedor destino (null = raíz)
 * @param {string|null} targetType - Tipo del contenedor destino ('course', 'folder', 'subject')
 * @param {Object} mutationFns - Objetos mutation de react-query para cada tipo
 */
export async function moveItemsInBackend(items, targetId, targetType, mutationFns) {
  const { updateFolder, updateSubject, updateQuiz } = mutationFns;

  for (const item of items) {
    if (item.type === 'quiz') {
      // Quiz puede ir a subject o folder
      const updateData = {};
      if (targetType === 'subject') {
        updateData.subject_id = targetId;
        updateData.folder_id = null;
      } else if (targetType === 'folder') {
        updateData.folder_id = targetId;
        updateData.subject_id = null;
      } else {
        updateData.subject_id = null;
        updateData.folder_id = null;
      }
      await updateQuiz({ 
        id: item.id, 
        data: updateData
      });
    } 
    else if (item.type === 'subject') {
      const updateData = {};
      if (!targetId) {
        // Mover a raíz
        updateData.course_id = null;
        updateData.folder_id = null;
      } else if (targetType === 'course') {
        updateData.course_id = targetId;
        updateData.folder_id = null;
      } else if (targetType === 'folder') {
        updateData.folder_id = targetId;
        updateData.course_id = null;
      }
      await updateSubject({ id: item.id, data: updateData });
    } 
    else if (item.type === 'folder') {
      const updateData = {};
      if (!targetId) {
        // Mover a raíz
        updateData.course_id = null;
        updateData.parent_id = null;
        updateData.subject_id = null;
      } else if (targetType === 'course') {
        updateData.course_id = targetId;
        updateData.parent_id = null;
        updateData.subject_id = null;
      } else if (targetType === 'folder') {
        updateData.parent_id = targetId;
        updateData.course_id = null;
        updateData.subject_id = null;
      } else if (targetType === 'subject') {
        updateData.subject_id = targetId;
        updateData.course_id = null;
        updateData.parent_id = null;
      }
      await updateFolder({ id: item.id, data: updateData });
    }
  }
}