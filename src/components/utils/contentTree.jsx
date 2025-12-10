// components/utils/contentTree.js

// Tipos lógicos de contenedor
export const CONTAINER_TYPES = {
  COURSE: "course",
  FOLDER: "folder",
  SUBJECT: "subject",
};

/**
 * Normaliza Course, Folder y Subject en una sola lista de "containers"
 *
 * @param {Object[]} courses
 * @param {Object[]} folders
 * @param {Object[]} subjects
 * @returns {Object[]} containers
 */
export function buildContainers(courses = [], folders = [], subjects = []) {
  const containers = [];

  // Courses → contenedores raíz
  for (const c of courses) {
    containers.push({
      ...c,
      container_id: c.id,
      type: CONTAINER_TYPES.COURSE,
      parent_id: null, // siempre raíz
    });
  }

  // Folders → pueden colgar de course, folder o subject
  for (const f of folders) {
    let parent_id = null;

    if (f.parent_id) {
      // subcarpeta
      parent_id = f.parent_id;
    } else if (f.subject_id) {
      // carpeta dentro de materia
      parent_id = f.subject_id;
    } else if (f.course_id) {
      // carpeta directa de un curso
      parent_id = f.course_id;
    }

    containers.push({
      ...f,
      container_id: f.id,
      type: CONTAINER_TYPES.FOLDER,
      parent_id,
    });
  }

  // Subjects → pueden colgar de course o de folder
  for (const s of subjects) {
    let parent_id = null;

    if (s.folder_id) {
      parent_id = s.folder_id;
    } else if (s.course_id) {
      parent_id = s.course_id;
    }

    containers.push({
      ...s,
      container_id: s.id,
      type: CONTAINER_TYPES.SUBJECT,
      parent_id,
    });
  }

  return containers;
}

/**
 * Devuelve contenedores raíz (los que no tienen parent_id)
 */
export function getRootContainers(containers = []) {
  return containers.filter((c) => !c.parent_id);
}

/**
 * Devuelve los hijos directos de un contenedor
 */
export function getChildrenContainers(containers = [], parentId) {
  return containers.filter((c) => c.parent_id === parentId);
}

/**
 * Reglas de jerarquía estricta:
 * - Course (Raíz)
 *   -> Subject
 *      -> Folder
 *         -> Quiz
 *         -> Folder (Anidado)
 */
export function canMoveItemToTarget(itemType, targetType) {
  const rules = {
    course: [], // Solo raíz
    subject: ["course"], // Materias solo en cursos
    folder: ["subject", "folder"], // Carpetas en materias o subcarpetas
    quiz: ["folder"], // Quizzes solo en carpetas
  };

  if (!targetType) {
    // Mover a raíz solo permitido para Cursos
    return itemType === "course";
  }

  return rules[itemType]?.includes(targetType) ?? false;
}