import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "691f6f77a60b12648bd395c6",
  requiresAuth: false // Auth disabled for local dev as requested
});

// Mock user for local development AND Vercel Demo
if (import.meta.env.DEV || typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
  base44.auth.me = async () => ({
    id: "mock-user-id",
    email: "dev@local.com",
    first_name: "Developer",
    last_name: "Local",
    profile_picture_url: null,
    username: "dev_local",
    role: "admin"
  });

  // Helper for mock entities (Stateful + LocalStorage Data Persistence)
  const mockEntity = (name, initialData = []) => {
    // Helper to get fresh data from LS
    const getData = () => {
      const stored = localStorage.getItem(`mock_${name}`);
      if (stored) return JSON.parse(stored);
      // Initialize if empty
      localStorage.setItem(`mock_${name}`, JSON.stringify(initialData));
      return initialData;
    };

    // Helper to save to LS
    const saveData = (data) => {
      localStorage.setItem(`mock_${name}`, JSON.stringify(data));
    };

    // Initialize on load
    if (!localStorage.getItem(`mock_${name}`)) {
      saveData(initialData);
    }

    return {
      list: async (sortStr) => {
        let res = getData();
        if (sortStr) {
          const desc = sortStr.startsWith('-');
          const field = desc ? sortStr.substring(1) : sortStr;
          res.sort((a, b) => {
            if (a[field] < b[field]) return desc ? 1 : -1;
            if (a[field] > b[field]) return desc ? -1 : 1;
            return 0;
          });
        }
        return res;
      },
      filter: async (criteria) => {
        const data = getData();
        return data.filter(item => {
          return Object.keys(criteria).every(key => item[key] == criteria[key]);
        });
      },
      create: async (item) => {
        const data = getData();
        const newItem = { id: `${name}-${Date.now()}`, ...item, created_date: new Date().toISOString() };
        data.push(newItem);
        saveData(data);
        return newItem;
      },
      update: async (id, updates) => {
        let data = getData();
        data = data.map(d => d.id === id ? { ...d, ...updates } : d);
        saveData(data);
        return data.find(d => d.id === id) || null;
      },
      delete: async (id) => {
        let data = getData();
        data = data.filter(d => d.id !== id);
        saveData(data);
        return { id, deleted: true };
      },
      get: async (id) => getData().find(i => i.id === id) || null
    };
  };

  base44.entities = {
    Course: mockEntity("course", [
      { id: "c1", name: "Primer Semestre", order: 1, icon: "1️⃣" },
      { id: "c2", name: "Segundo Semestre", order: 2, icon: "2️⃣" },
      { id: "c3", name: "Tercer Semestre", order: 3, icon: "3️⃣" },
      { id: "c4", name: "Cuarto Semestre", order: 4, icon: "4️⃣" }
    ]),
    Subject: mockEntity("subject", [
      // 1er Semestre
      { id: "s1", name: "Anatomía I", course_id: "c1", order: 1, icon: "💀" },
      { id: "s2", name: "Histología I", course_id: "c1", order: 2, icon: "🔬" },
      { id: "s3", name: "Bioquímica", course_id: "c1", order: 3, icon: "🧪" },
      { id: "s4", name: "Biofísica", course_id: "c1", order: 4, icon: "⚛️" },
      // 2do Semestre
      { id: "s5", name: "Anatomía II", course_id: "c2", order: 1, icon: "💀" },
      { id: "s6", name: "Histología II", course_id: "c2", order: 2, icon: "🔬" },
      { id: "s7", name: "Fisiología I", course_id: "c2", order: 3, icon: "🧠" },
      { id: "s8", name: "Embriología", course_id: "c2", order: 4, icon: "👶" }
    ]),
    Folder: mockEntity("folder", [
      // Folders for s1 (Anatomía I)
      { id: "f1", name: "Primer Parcial", subject_id: "s1", order: 1 },
      { id: "f2", name: "Segundo Parcial", subject_id: "s1", order: 2 },
      { id: "f3", name: "Tercer Parcial", subject_id: "s1", order: 3 },
      { id: "f4", name: "Cuarto Parcial", subject_id: "s1", order: 4 },
      // Folders for s5 (Anatomía II)
      { id: "f5", name: "Primer Parcial", subject_id: "s5", order: 1 },
      { id: "f6", name: "Segundo Parcial", subject_id: "s5", order: 2 }
    ]),
    Quiz: mockEntity("quiz", [
      {
        id: "q1",
        title: "Bones & Joints Intro",
        subject_id: "s1",
        folder_id: "f1",
        questions: [
          {
            question: "¿Cuál es el hueso más largo del cuerpo humano?",
            answerOptions: [
              { text: "Fémur", isCorrect: true, rationale: "El fémur es el hueso del muslo y el más largo del esqueleto." },
              { text: "Tibia", isCorrect: false, rationale: "La tibia es grande, pero más corta que el fémur." },
              { text: "Húmero", isCorrect: false },
              { text: "Radio", isCorrect: false }
            ],
            hint: "Está en la pierna."
          },
          {
            question: "¿Cuántas costillas tiene el ser humano promedio?",
            answerOptions: [
              { text: "24", isCorrect: true, rationale: "12 pares de costillas." },
              { text: "12", isCorrect: false },
              { text: "32", isCorrect: false }
            ]
          }
        ]
      },
      { id: "q2", title: "Cell Structure", subject_id: "s2", questions: [] }
    ]),
    QuizAttempt: mockEntity("attempt", []),
    UserStats: mockEntity("stats", [
      { id: "st1", user_email: "dev@local.com", points: 1250, level: 5, streak_days: 3, quizzes_completed: 12 },
      { id: "st2", user_email: "alice@local.com", points: 980, level: 3, streak_days: 1, quizzes_completed: 8 },
      { id: "st3", user_email: "bob@local.com", points: 2100, level: 8, streak_days: 12, quizzes_completed: 25 }
    ]),
    QuizSettings: mockEntity("settings", []),
    User: mockEntity("user", [
      { id: "u1", email: "dev@local.com", username: "dev_local", role: "admin" },
      { id: "u2", email: "alice@local.com", username: "alice_med", role: "student" },
      { id: "u3", email: "bob@local.com", username: "bob_dr", role: "student" }
    ]),
    OnlineUser: mockEntity("online_user", [
      { id: "ou1", username: "alice_med", status: "online", current_activity: "Estudiando Anatomía" },
      { id: "ou2", username: "bob_dr", status: "idle", current_activity: "En pausa" }
    ]),
    Challenge: mockEntity("challenge", []),
    AssignedTask: mockEntity("task", [])
  };

  // Mock updateMe
  base44.auth.updateMe = async (data) => {
    return {
      id: "mock-user-id",
      email: "dev@local.com",
      first_name: "Developer",
      last_name: "Local",
      profile_picture_url: null,
      username: "dev_local",
      role: "admin",
      ...data
    };
  };

  // Mock integrations
  base44.integrations = {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        // Simulate AI generation delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const isTopic = prompt.includes('Genera un cuestionario');

        if (isTopic) {
          return {
            title: "Quiz Generado (Mock)",
            questions: Array(5).fill(0).map((_, i) => ({
              question: `Pregunta simulada ${i + 1} sobre el tema?`,
              answerOptions: [
                { text: "Respuesta Correcta", isCorrect: true, rationale: "Porque sí" },
                { text: "Respuesta Incorrecta A", isCorrect: false, rationale: "Porque no" },
                { text: "Respuesta Incorrecta B", isCorrect: false, rationale: "Tampoco" },
                { text: "Respuesta Incorrecta C", isCorrect: false, rationale: "Menos" }
              ],
              hint: "Pista simulada"
            }))
          };
        } else {
          // JSON/Text mode mock
          return {
            title: "Quiz desde Texto (Mock)",
            questions: [
              {
                question: "Pregunta extraída del texto",
                answerOptions: [
                  { text: "Verdadero", isCorrect: true, rationale: "Basado en el texto" },
                  { text: "Falso", isCorrect: false, rationale: "No aparece en el texto" }
                ],
                hint: "Lee el texto"
              }
            ]
          };
        }
      }
    }
  };
}
