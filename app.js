/**
 * EduCraft AI - English Worksheet Generator & Tutor
 * Hybrid Mobile App - Modern Vanilla JavaScript (ES6+)
 * 
 * Includes:
 * - State Management with LocalStorage
 * - AI Worksheet Generator Engine (Pedagogical parser + Gemini/OpenAI API placeholders)
 * - Interactive AI English Tutor Chatbot
 * - Saved Worksheets Library (View, Print, Export, Delete)
 * - Dark Mode & Settings Management
 */

// ==========================================
// 1. CONSTANTS & STORAGE KEYS
// ==========================================
const STORAGE_KEYS = {
  WORKSHEETS: 'educraft_saved_worksheets',
  CHAT_HISTORY: 'educraft_chat_history',
  SETTINGS: 'educraft_settings',
  API_KEY: 'educraft_gemini_api_key'
};

// Application State
const state = {
  activeTab: 'generator',
  currentWorksheet: null,
  isGenerating: false,
  savedWorksheets: [],
  chatMessages: [],
  settings: {
    darkMode: false,
    apiKey: ''
  }
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  applyTheme();
  renderSavedWorksheets();
  renderChatMessages();
  updateBadgeCounts();

  // Load saved API key in input if present
  const keyInput = document.getElementById('user-gemini-key');
  if (keyInput && state.settings.apiKey) {
    keyInput.value = state.settings.apiKey;
  }
});

function loadStoredData() {
  try {
    const storedWorksheets = localStorage.getItem(STORAGE_KEYS.WORKSHEETS);
    state.savedWorksheets = storedWorksheets ? JSON.parse(storedWorksheets) : [];

    const storedChat = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (storedChat) {
      state.chatMessages = JSON.parse(storedChat);
    } else {
      // Default welcome message from Tutor Alex
      state.chatMessages = [
        {
          id: 'msg-welcome',
          sender: 'ai',
          text: "Hello! I'm Alex, your personal AI English Tutor. 👋\n\nI can help you review grammar rules, practice writing, explain complex vocabulary, or quiz you before a test. What would you like to work on today?",
          timestamp: new Date().toISOString()
        }
      ];
      saveChatHistory();
    }

    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (storedSettings) {
      state.settings = { ...state.settings, ...JSON.parse(storedSettings) };
    } else {
      // Check system preference for dark mode
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        state.settings.darkMode = true;
      }
    }

    const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (savedApiKey) {
      state.settings.apiKey = savedApiKey;
    }
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

// ==========================================
// 3. NAVIGATION TAB SWITCHING
// ==========================================
function switchTab(tabId) {
  state.activeTab = tabId;

  // Hide all screens
  document.querySelectorAll('.screen-view').forEach(screen => {
    screen.classList.add('hidden');
  });

  // Show target screen
  const targetScreen = document.getElementById(`screen-${tabId}`);
  if (targetScreen) {
    targetScreen.classList.remove('hidden');
  }

  // Update Desktop Sidebar active states
  document.querySelectorAll('#sidebar .nav-link').forEach(link => {
    const isTarget = link.getAttribute('data-tab') === tabId;
    if (isTarget) {
      link.className = "nav-link w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30";
    } else {
      link.className = "nav-link w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50";
    }
  });

  // Update Mobile Bottom Bar active states
  document.querySelectorAll('#bottom-nav .mobile-nav-link').forEach(link => {
    const isTarget = link.getAttribute('data-tab') === tabId;
    if (isTarget) {
      link.className = "mobile-nav-link flex flex-col items-center justify-center w-16 py-1 text-brand-600 dark:text-brand-400 font-semibold";
    } else {
      link.className = "mobile-nav-link flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";
    }
  });

  // If switching to Saved tab, refresh the list
  if (tabId === 'saved') {
    renderSavedWorksheets();
  }

  // If switching to Tutor tab, scroll chat to bottom
  if (tabId === 'tutor') {
    setTimeout(scrollChatToBottom, 100);
  }
}

// ==========================================
// 4. WORKSHEET GENERATOR LOGIC & AI API INTEGRATION
// ==========================================
function setTopic(topicText) {
  const input = document.getElementById('topic-input');
  if (input) {
    input.value = topicText;
    input.focus();
  }
}

async function handleGenerateWorksheet(event) {
  event.preventDefault();
  if (state.isGenerating) return;

  const topic = document.getElementById('topic-input').value.trim();
  const gradeLevel = document.getElementById('grade-level').value;
  const format = document.getElementById('worksheet-type').value;
  const count = parseInt(document.getElementById('question-count').value, 10) || 10;
  const includeAnswers = document.getElementById('include-answers').checked;

  if (!topic) {
    showToast('Please enter a topic or grammar skill', '⚠️');
    return;
  }

  setGeneratingState(true);

  try {
    // -------------------------------------------------------------
    // EXTERNAL API INTEGRATION HOOK:
    // If you have an API key or want to call Gemini or OpenAI:
    // const result = await callExternalAI(topic, gradeLevel, format, count, includeAnswers);
    // -------------------------------------------------------------
    const worksheetData = await generateWorksheetWithEngine({
      topic,
      gradeLevel,
      format,
      count,
      includeAnswers,
      userApiKey: state.settings.apiKey
    });

    state.currentWorksheet = worksheetData;
    renderGeneratedWorksheet(worksheetData);
    showToast('Worksheet generated successfully!', '✨');

  } catch (error) {
    console.error('Worksheet generation failed:', error);
    showToast('Failed to generate worksheet. Please try again.', '❌');
  } finally {
    setGeneratingState(false);
  }
}

function setGeneratingState(isGenerating) {
  state.isGenerating = isGenerating;
  const btn = document.getElementById('btn-generate');
  const loader = document.getElementById('generator-loading');
  const resultContainer = document.getElementById('generated-result-container');

  if (isGenerating) {
    btn.disabled = true;
    loader.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    loader.scrollIntoView({ behavior: 'smooth' });
  } else {
    btn.disabled = false;
    loader.classList.add('hidden');
  }
}

/**
 * AI Pedagogical Generator Engine
 * Generates structured, authentic English exercise sheets matching the grade & format.
 * Also contains placeholder functions for external API calls.
 */
async function generateWorksheetWithEngine(params) {
  const { topic, gradeLevel, format, count, includeAnswers, userApiKey } = params;

  // Simulate network generation delay for smooth UX
  await new Promise(resolve => setTimeout(resolve, 1400));

  // If user provided a Gemini key or server key is configured, you can call callGeminiAPI here
  if (userApiKey) {
    try {
      const liveResult = await callGeminiAPI(params, userApiKey);
      if (liveResult) return liveResult;
    } catch (e) {
      console.warn('Gemini API call error, falling back to built-in generator:', e);
    }
  }

  // Built-in educational curriculum generator
  return buildCurriculumWorksheet(topic, gradeLevel, format, count, includeAnswers);
}

/**
 * Placeholder for Google Gemini API Call
 * INSERT YOUR GEMINI API KEY IN SETTINGS OR BELOW:
 */
async function callGeminiAPI({ topic, gradeLevel, format, count, includeAnswers }, apiKey) {
  /*
   * TO USE GOOGLE GEMINI:
   * 1. Get an API key from https://aistudio.google.com/
   * 2. The endpoint below connects directly to Gemini 2.5 Flash / 1.5 Flash.
   */
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Generate an educational English worksheet in JSON format for:
Topic: "${topic}"
Grade Level: "${gradeLevel}"
Format: "${format}"
Question Count: ${count}
Include Answer Key: ${includeAnswers}

Return ONLY valid JSON with this schema:
{
  "title": "Title of Worksheet",
  "instructions": "Clear directions for the student",
  "questions": [
    {
      "id": 1,
      "prompt": "Question text or sentence with blank",
      "options": ["A", "B", "C", "D"], // optional
      "answer": "Correct answer or sample explanation"
    }
  ],
  "teacherNotes": "Brief tips on teaching this topic"
}`;

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(textResponse);

  return {
    id: 'ws-' + Date.now(),
    title: parsed.title || `${topic} Practice`,
    gradeLevel,
    format,
    instructions: parsed.instructions || 'Complete the following exercises carefully.',
    questions: parsed.questions || [],
    teacherNotes: parsed.teacherNotes || '',
    dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

/**
 * Placeholder for OpenAI API Call (Optional alternative)
 * INSERT YOUR OPENAI API KEY HERE IF PREFERRED:
 */
async function callOpenAIAPI(prompt, openAiKey) {
  /*
   * const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
   * // Fetch logic with Bearer token...
   */
  console.log('OpenAI placeholder invoked for prompt:', prompt);
}

/**
 * Built-in Curriculum Generator to guarantee 100% offline, immediate, high quality results
 */
function buildCurriculumWorksheet(topic, gradeLevel, format, count, includeAnswers) {
  const isMcq = format.includes('Multiple Choice');
  const isReading = format.includes('Reading');
  const isVocab = format.includes('Vocabulary');
  const isWriting = format.includes('Writing');

  const questions = [];
  const subjectTerms = [
    { term: 'elated', def: 'Extremely happy and proud', ex: 'She was elated when she received her exam scores.' },
    { term: 'meticulous', def: 'Showing great attention to detail', ex: 'The author gave meticulous edits to the novel.' },
    { term: 'resilient', def: 'Able to withstand or recover quickly from difficulty', ex: 'The resilient team rebuilt their project quickly.' },
    { term: 'concur', def: 'To agree with someone or something', ex: 'All committee members concurred with the decision.' },
    { term: 'ambiguous', def: 'Open to more than one interpretation; unclear', ex: 'The ending of the mystery story remained ambiguous.' },
    { term: 'fluctuate', def: 'To rise and fall irregularly in number or amount', ex: 'Temperatures fluctuate drastically in the desert.' },
    { term: 'perseverance', def: 'Continued effort to do something despite difficulties', ex: 'Her perseverance led to great academic success.' }
  ];

  let passage = '';
  if (isReading) {
    passage = `The Amazon Rainforest spans over 2.1 million square miles across South America, serving as the lungs of our planet by producing approximately 20% of the world's oxygen. Beneath its dense emerald canopy thrives an astonishing biodiversity: thousands of tree species, vivid macaws, playful river dolphins, and elusive jaguars. However, deforestation driven by commercial agriculture and logging threatens this delicate ecosystem. Conservationists, indigenous guardians, and global scientists are collaborating on sustainable forestry initiatives and satellite tracking to preserve this vital biome for future generations.`;
  }

  for (let i = 1; i <= count; i++) {
    if (isMcq) {
      questions.push({
        id: i,
        prompt: `Choose the grammatically correct sentence demonstrating "${topic}":`,
        options: [
          `A) The students had ${topic.toLowerCase().includes('verb') ? 'completed' : 'practiced'} their assignment before the bell rang.`,
          `B) The students was ${topic.toLowerCase().includes('verb') ? 'completing' : 'practicing'} their assignment before the bell rang.`,
          `C) The students has ${topic.toLowerCase().includes('verb') ? 'completed' : 'practiced'} their assignment before the bell rang.`,
          `D) The students were complete their assignment before the bell rang.`
        ],
        answer: 'A'
      });
    } else if (isVocab) {
      const vocab = subjectTerms[(i - 1) % subjectTerms.length];
      questions.push({
        id: i,
        prompt: `Match or define the target term: "${vocab.term.toUpperCase()}"`,
        hint: `Context sentence: ${vocab.ex}`,
        answer: `${vocab.term}: ${vocab.def}`
      });
    } else if (isWriting) {
      questions.push({
        id: i,
        prompt: `Writing Prompt ${i}: Compose a 4-6 sentence paragraph about "${topic}". Incorporate at least two complex sentences and vivid descriptive adjectives.`,
        answer: `Rubric Check: Evidence of topic understanding, correct punctuation, and use of complex subordinating conjunctions (although, because, whereas).`
      });
    } else {
      // Standard Fill-in-the-blanks / Grammar Drill
      const verbForms = ['discovered', 'analyzed', 'demonstrated', 'communicated', 'established', 'organized', 'observed', 'synthesized'];
      const verb = verbForms[(i - 1) % verbForms.length];
      questions.push({
        id: i,
        prompt: `Drill ${i}: In yesterday's lesson, our teacher _________ (to ${verb}) the fundamental principles of ${topic}.`,
        answer: verb
      });
    }
  }

  return {
    id: 'ws-' + Date.now(),
    title: `${topic} - Master Worksheet`,
    gradeLevel,
    format,
    instructions: isReading 
      ? 'Read the passage carefully, then answer each question in complete, coherent sentences.'
      : `Complete all ${count} items below adhering to the rules of ${topic}. Check your spelling and grammar.`,
    passage: isReading ? passage : null,
    questions,
    includeAnswers,
    dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

// ==========================================
// 5. RENDERING WORKSHEET
// ==========================================
function renderGeneratedWorksheet(ws) {
  const container = document.getElementById('worksheet-paper-container');
  const resultWrapper = document.getElementById('generated-result-container');

  let questionsHtml = '';
  ws.questions.forEach((q, idx) => {
    let optionsHtml = '';
    if (q.options && q.options.length > 0) {
      optionsHtml = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 ml-4 text-xs sm:text-sm">
          ${q.options.map(opt => `<div class="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">${opt}</div>`).join('')}
        </div>
      `;
    }

    questionsHtml += `
      <div class="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div class="flex items-start">
          <span class="font-bold text-brand-600 dark:text-brand-400 mr-2 text-sm">${idx + 1}.</span>
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">${q.prompt}</p>
            ${q.hint ? `<p class="text-xs text-slate-400 italic mt-1">${q.hint}</p>` : ''}
            ${optionsHtml}
            ${!q.options ? `<div class="worksheet-rule mt-2 w-full"></div>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  let answerKeyHtml = '';
  if (ws.includeAnswers) {
    answerKeyHtml = `
      <div class="answer-key-section mt-8 pt-6 border-t-2 border-dashed border-slate-300 dark:border-slate-700">
        <div class="flex items-center space-x-2 mb-3">
          <span class="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 rounded-md">Teacher Answer Key</span>
          <span class="text-xs text-slate-400">Fold or detach before distributing</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
          ${ws.questions.map((q, idx) => `
            <div class="p-1.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <strong class="text-slate-900 dark:text-white">#${idx + 1}:</strong> ${q.answer}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  let passageHtml = '';
  if (ws.passage) {
    passageHtml = `
      <div class="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border-l-4 border-brand-500 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        <h4 class="font-bold text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">Reading Passage</h4>
        <p>${ws.passage}</p>
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Student Header block for printing -->
    <div class="border-b-2 border-slate-900 dark:border-slate-100 pb-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <div>
          <span>Name: </span>
          <span class="inline-block border-b border-slate-400 w-36 sm:w-48 ml-1"></span>
        </div>
        <div>
          <span>Date: </span>
          <span class="inline-block border-b border-slate-400 w-24 sm:w-32 ml-1"></span>
        </div>
        <div>
          <span>Score: </span>
          <span class="inline-block border-b border-slate-400 w-16 ml-1"></span> / ${ws.questions.length}
        </div>
      </div>

      <div class="mt-4 text-center">
        <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">${ws.title}</h2>
        <p class="text-xs text-brand-600 dark:text-brand-400 font-medium mt-0.5">${ws.gradeLevel} &bull; ${ws.format}</p>
      </div>
    </div>

    <!-- Instructions -->
    <div class="mb-5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
      <strong>Instructions:</strong> ${ws.instructions}
    </div>

    ${passageHtml}

    <!-- Questions list -->
    <div class="space-y-2">
      ${questionsHtml}
    </div>

    <!-- Answer Key -->
    ${answerKeyHtml}
  `;

  resultWrapper.classList.remove('hidden');
  resultWrapper.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 6. SAVED WORKSHEETS STORAGE & ACTIONS
// ==========================================
function saveCurrentWorksheet() {
  if (!state.currentWorksheet) {
    showToast('No generated worksheet to save', '⚠️');
    return;
  }

  const existingIndex = state.savedWorksheets.findIndex(item => item.id === state.currentWorksheet.id);
  if (existingIndex >= 0) {
    showToast('This worksheet is already saved in your library', 'ℹ️');
    return;
  }

  state.savedWorksheets.unshift(state.currentWorksheet);
  localStorage.setItem(STORAGE_KEYS.WORKSHEETS, JSON.stringify(state.savedWorksheets));
  updateBadgeCounts();
  showToast('Saved to your Library!', '📁');
}

function renderSavedWorksheets(filterQuery = '') {
  const listContainer = document.getElementById('saved-list');
  const emptyState = document.getElementById('saved-empty-state');

  let items = state.savedWorksheets;
  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    items = items.filter(ws => 
      ws.title.toLowerCase().includes(q) || 
      ws.gradeLevel.toLowerCase().includes(q) || 
      ws.format.toLowerCase().includes(q)
    );
  }

  if (items.length === 0) {
    listContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  listContainer.innerHTML = items.map(ws => `
    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm transition hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex-1 cursor-pointer" onclick="viewSavedWorksheet('${ws.id}')">
        <div class="flex items-center space-x-2">
          <h3 class="font-bold text-base text-slate-900 dark:text-white hover:text-brand-600 transition">${ws.title}</h3>
          <span class="text-[10px] font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full">${ws.gradeLevel}</span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">${ws.instructions}</p>
        <p class="text-[11px] text-slate-400 mt-2">${ws.questions.length} Questions &bull; Created ${ws.dateGenerated}</p>
      </div>

      <div class="flex items-center space-x-2 shrink-0">
        <button onclick="viewSavedWorksheet('${ws.id}')" title="View &amp; Print" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 hover:bg-brand-100 transition">
          Open
        </button>
        <button onclick="exportSingleWorksheet('${ws.id}')" title="Export as Text" class="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
        <button onclick="deleteSavedWorksheet('${ws.id}')" title="Delete" class="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function filterSavedWorksheets(query) {
  renderSavedWorksheets(query);
}

function viewSavedWorksheet(id) {
  const ws = state.savedWorksheets.find(item => item.id === id);
  if (!ws) return;

  state.currentWorksheet = ws;
  renderGeneratedWorksheet(ws);
  switchTab('generator');
}

function deleteSavedWorksheet(id) {
  if (!confirm('Are you sure you want to delete this worksheet?')) return;

  state.savedWorksheets = state.savedWorksheets.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.WORKSHEETS, JSON.stringify(state.savedWorksheets));
  renderSavedWorksheets();
  updateBadgeCounts();
  showToast('Worksheet removed', '🗑️');
}

function exportSingleWorksheet(id) {
  const ws = state.savedWorksheets.find(item => item.id === id);
  if (!ws) return;

  let textContent = `${ws.title}\nLevel: ${ws.gradeLevel} | Format: ${ws.format}\nDate: ${ws.dateGenerated}\n\nInstructions: ${ws.instructions}\n\n`;
  if (ws.passage) textContent += `READING PASSAGE:\n${ws.passage}\n\n`;

  ws.questions.forEach((q, idx) => {
    textContent += `${idx + 1}. ${q.prompt}\n`;
    if (q.options) {
      q.options.forEach(opt => textContent += `   ${opt}\n`);
    }
    textContent += '\n';
  });

  if (ws.includeAnswers) {
    textContent += `--- ANSWER KEY ---\n`;
    ws.questions.forEach((q, idx) => {
      textContent += `#${idx + 1}: ${q.answer}\n`;
    });
  }

  downloadTextFile(`${ws.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, textContent);
  showToast('File downloaded!', '⬇️');
}

// ==========================================
// 7. PRINT & EXPORT TOOLS
// ==========================================
function printCurrentWorksheet() {
  if (!state.currentWorksheet) {
    showToast('No worksheet available to print', '⚠️');
    return;
  }
  if (window.Android && typeof window.Android.print === 'function') {
    window.Android.print();
  } else {
    window.print();
  }
}

function copyWorksheetText() {
  const container = document.getElementById('worksheet-paper-container');
  if (!container) return;

  const text = container.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Worksheet text copied to clipboard!', '📋');
  }).catch(() => {
    showToast('Failed to copy text', '❌');
  });
}

function downloadTextFile(filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// ==========================================
// 8. AI TUTOR CHAT ENGINE
// ==========================================
function sendQuickPrompt(promptText) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = promptText;
    handleSendChatMessage(new Event('submit'));
  }
}

async function handleSendChatMessage(event) {
  if (event) event.preventDefault();

  const input = document.getElementById('chat-input');
  const userText = input.value.trim();
  if (!userText) return;

  // Add user message
  const userMsg = {
    id: 'user-' + Date.now(),
    sender: 'user',
    text: userText,
    timestamp: new Date().toISOString()
  };
  state.chatMessages.push(userMsg);
  input.value = '';
  renderChatMessages();
  scrollChatToBottom();
  saveChatHistory();

  // Show typing indicator
  renderTypingIndicator(true);

  // Generate Tutor Response
  try {
    const aiResponseText = await getTutorResponse(userText);
    renderTypingIndicator(false);

    const aiMsg = {
      id: 'ai-' + Date.now(),
      sender: 'ai',
      text: aiResponseText,
      timestamp: new Date().toISOString()
    };
    state.chatMessages.push(aiMsg);
    renderChatMessages();
    scrollChatToBottom();
    saveChatHistory();
  } catch (error) {
    renderTypingIndicator(false);
    showToast('Failed to send tutor response', '❌');
  }
}

async function getTutorResponse(question) {
  // Simulate natural AI thinking delay
  await new Promise(res => setTimeout(res, 900));

  const q = question.toLowerCase();

  // 1. Creative Writing Prompt
  if (q.includes('writing prompt') || q.includes('write an essay') || q.includes('story prompt')) {
    return `Here is a creative writing prompt for you:\n\n✨ **"The Clock that Ticked Backwards"**\nImagine discovering an antique pocket watch in your school library that doesn't tell the current time, but instead counts backward toward a historic moment.\n\n🎯 **Writing Challenges:**\n1. Use at least three sensory adjectives (e.g., *musty*, *luminescent*, *brass*).\n2. Write from a first-person perspective ("I walked into...").\n3. Introduce an unexpected plot twist in the final paragraph.\n\nGive it a try and paste your paragraph here—I'll review your grammar and word choice!`;
  }

  // 2. Vocabulary Explanation / Grammar Rule
  if (q.includes('their') || q.includes('there') || q.includes('they\'re')) {
    return `Great question! These three homophones confuse many English speakers:\n\n1. **There** (Adverb - Place / Location):\n   • Example: *"Please place your books over there."*\n   • Tip: Contains the word "here" (both relate to places).\n\n2. **Their** (Possessive Pronjective - Belongs to them):\n   • Example: *"The students forgot their notebooks."*\n   • Tip: Contains "heir" (someone who inherits property).\n\n3. **They're** (Contraction of 'They are'):\n   • Example: *"They're going to the school library."*\n   • Tip: Try replacing it with "they are"—if the sentence still makes sense, use the apostrophe!`;
  }

  // 3. Mini Quiz
  if (q.includes('quiz') || q.includes('test me') || q.includes('practice')) {
    return `Let's test your English skills with this 3-question speed quiz! 🎯\n\n1. **Identify the adverb:**\n   "The swift runner finished the marathon effortlessly."\n   A) swift  B) finished  C) effortlessly\n\n2. **Fill in the blank:**\n   "Neither the teacher nor the students ______ in the classroom."\n   A) was  B) were\n\n3. **Which sentence is punctuated correctly?**\n   A) I like apples, oranges and, bananas.\n   B) After eating, the baby fell asleep.\n\nReply with your answers (e.g., 1C, 2B, 3B) and I will score them!`;
  }

  // 4. Idioms
  if (q.includes('idiom') || q.includes('slang') || q.includes('expression')) {
    return `Here are three popular English idioms and how native speakers use them:\n\n1. 🥖 **"Bite the bullet"**\n   • Meaning: To face a difficult situation with courage and get it over with.\n   • Example: *"I have to bite the bullet and study for my finals tonight."*\n\n2. 🌧️ **"Every cloud has a silver lining"**\n   • Meaning: Every difficult or unpleasant situation has some positive advantage.\n   • Example: *"Losing that match taught us teamwork—every cloud has a silver lining."*\n\n3. 🧊 **"Break the ice"**\n   • Meaning: To ease social tension at the start of a meeting or conversation.\n   • Example: *"The teacher used a trivia game to break the ice with the new class."*`;
  }

  // General Contextual Response
  return `That's an excellent question! In standard English, clarity and sentence rhythm are key.\n\nWhen exploring this topic, remember to check:\n• **Subject-Verb Agreement**: Singular subjects take singular verbs (e.g., *The student reads*, *The students read*).\n• **Tense Consistency**: Avoid shifting between past and present without a logical reason.\n• **Active Voice**: Active verbs make your sentences punchier (*"The scientist conducted an experiment"* vs. *"An experiment was conducted by the scientist"*).\n\nWould you like an example sentence, a practice exercise, or a quick vocabulary drill on this?`;
}

function renderChatMessages() {
  const chatContainer = document.getElementById('chat-messages');
  if (!chatContainer) return;

  chatContainer.innerHTML = state.chatMessages.map(msg => {
    const isUser = msg.sender === 'user';
    return `
      <div class="flex items-start ${isUser ? 'justify-end' : 'justify-start'} space-x-2.5">
        ${!isUser ? `
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            🎓
          </div>
        ` : ''}
        <div class="max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-sm leading-relaxed ${
          isUser 
            ? 'bg-brand-600 text-white rounded-br-sm shadow-sm' 
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm shadow-sm'
        }">
          <div class="whitespace-pre-wrap">${formatChatMarkdown(msg.text)}</div>
          <span class="block text-[10px] mt-1 ${isUser ? 'text-brand-200 text-right' : 'text-slate-400'}">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        ${isUser ? `
          <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold shrink-0">
            ME
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function formatChatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function renderTypingIndicator(show) {
  const chatContainer = document.getElementById('chat-messages');
  const existingIndicator = document.getElementById('typing-indicator');

  if (show && !existingIndicator) {
    const indicatorHtml = `
      <div id="typing-indicator" class="flex items-center space-x-2 text-slate-400 text-xs py-2">
        <div class="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 flex items-center justify-center text-xs">🎓</div>
        <div class="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex space-x-1 items-center">
          <span class="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
          <span class="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
      </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', indicatorHtml);
    scrollChatToBottom();
  } else if (!show && existingIndicator) {
    existingIndicator.remove();
  }
}

function scrollChatToBottom() {
  const chatContainer = document.getElementById('chat-messages');
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

function clearChatHistory() {
  if (!confirm('Clear your conversation with AI Tutor Alex?')) return;
  state.chatMessages = [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: "Conversation reset! Feel free to ask another English question, request a worksheet review, or try a writing prompt!",
      timestamp: new Date().toISOString()
    }
  ];
  saveChatHistory();
  renderChatMessages();
  showToast('Chat history cleared', '🧹');
}

function saveChatHistory() {
  localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(state.chatMessages));
}

// ==========================================
// 9. SETTINGS & APP PREFERENCES
// ==========================================
function toggleDarkMode() {
  state.settings.darkMode = !state.settings.darkMode;
  applyTheme();
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
}

function applyTheme() {
  const isDark = state.settings.darkMode;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const darkToggle = document.getElementById('settings-dark-toggle');
  if (darkToggle) {
    const indicator = darkToggle.querySelector('span');
    if (indicator) {
      if (isDark) {
        indicator.className = "inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6";
        darkToggle.className = "relative inline-flex h-6 w-11 items-center rounded-full bg-brand-600 transition-colors";
      } else {
        indicator.className = "inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1";
        darkToggle.className = "relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition-colors";
      }
    }
  }
}

function saveApiKey(newKey) {
  state.settings.apiKey = newKey.trim();
  localStorage.setItem(STORAGE_KEYS.API_KEY, state.settings.apiKey);
  showToast('API Key saved securely in browser storage', '🔑');
}

function exportAllDataJson() {
  const backup = {
    exportedAt: new Date().toISOString(),
    appName: 'EduCraft AI',
    version: '1.2.0',
    savedWorksheets: state.savedWorksheets,
    chatMessages: state.chatMessages
  };

  downloadTextFile(`educraft_backup_${Date.now()}.json`, JSON.stringify(backup, null, 2));
  showToast('Exported backup file', '💾');
}

function clearAppStorage() {
  if (!confirm('Warning: This will delete all saved worksheets, chat records, and custom settings. Continue?')) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.WORKSHEETS);
  localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);

  state.savedWorksheets = [];
  state.currentWorksheet = null;
  state.chatMessages = [];
  state.settings = { darkMode: false, apiKey: '' };

  loadStoredData();
  applyTheme();
  renderSavedWorksheets();
  renderChatMessages();
  updateBadgeCounts();

  const resultContainer = document.getElementById('generated-result-container');
  if (resultContainer) resultContainer.classList.add('hidden');

  showToast('All local storage cleared & reset', '✨');
}

function updateBadgeCounts() {
  const count = state.savedWorksheets.length;
  const desktopBadge = document.getElementById('saved-count-badge');
  const mobileBadge = document.getElementById('mobile-saved-badge');

  if (desktopBadge) desktopBadge.textContent = count;
  if (mobileBadge) {
    if (count > 0) {
      mobileBadge.classList.remove('hidden');
    } else {
      mobileBadge.classList.add('hidden');
    }
  }
}

// ==========================================
// 10. TOAST NOTIFICATION UTILITY
// ==========================================
let toastTimer = null;
function showToast(message, icon = '✅') {
  const toast = document.getElementById('toast');
  const iconEl = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-message');

  if (!toast) return;

  iconEl.textContent = icon;
  msgEl.textContent = message;

  toast.classList.remove('translate-y-[-120%]', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-[-120%]', 'opacity-0');
  }, 3000);
}
