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
  currentDomain: 'reading',
  currentGrammarTarget: 'tenses',
  currentGrammarMode: 'balanced',
  currentWorksheet: null,
  isGenerating: false,
  savedWorksheets: [],
  chatMessages: [],
  settings: {
    darkMode: false,
    colorTheme: 'indigo',
    apiKey: ''
  }
};

// Premium Academic Color Themes
const PREMIUM_THEMES = {
  indigo: {
    name: 'Oxford Indigo',
    vibe: 'Royal Academic',
    primary: '#4f46e5',
    accent: '#7c3aed'
  },
  emerald: {
    name: 'Emerald Ivy',
    vibe: 'Cambridge Prep',
    primary: '#059669',
    accent: '#0d9488'
  },
  amethyst: {
    name: 'Royal Amethyst',
    vibe: 'Imperial Literature',
    primary: '#9333ea',
    accent: '#c026d3'
  },
  amber: {
    name: 'Bourbon Amber',
    vibe: 'Vintage Academy',
    primary: '#d97706',
    accent: '#ea580c'
  },
  ocean: {
    name: 'Nordic Ocean',
    vibe: 'Arctic Precision',
    primary: '#0284c7',
    accent: '#0891b2'
  },
  rose: {
    name: 'Rose & Merlot',
    vibe: 'Editorial Luxury',
    primary: '#e11d48',
    accent: '#db2777'
  }
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  applyTheme();
  initDomainAndGrammarControls();
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
          text: "Hello! I'm Alex, your personal AI English Tutor. 👋\n\nI'm here to chat freely with you about English literature, grammar, writing, vocabulary, or any language topic you'd like to discuss. What shall we talk about today?",
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
// 4. ELA DOMAINS & VARIABLE GRAMMAR CONFIGURATION
// ==========================================
const ELA_DOMAINS = {
  reading: {
    id: 'reading',
    name: 'Reading & Comprehension',
    badge: 'Reading & Analysis',
    placeholder: 'e.g., Deep Sea Ocean Trenches & Marine Ecosystems',
    formats: [
      { value: 'Passage & Text-Dependent Questions', label: 'Passage & Analytical Short-Answers' },
      { value: 'Passage & Multiple Choice (MCQ)', label: 'Passage & Multiple Choice (MCQ)' },
      { value: 'Close Reading & Text Evidence', label: 'Close Reading & Text Evidence' },
      { value: 'Main Idea, Fact vs Opinion & Inferences', label: 'Main Idea, Fact vs Opinion & Inferences' }
    ],
    presets: [
      'Deep Sea Trenches & Marine Ecosystems',
      'The Ethics of Artificial Intelligence',
      'The Ancient Silk Road & Cultural Exchange',
      'Renewable Energy & Climate Solutions'
    ]
  },
  language: {
    id: 'language',
    name: 'Language & Vocabulary',
    badge: 'Language & Vocabulary',
    placeholder: 'e.g., Context Clues, Figurative Metaphors, Tier 2 Diction',
    formats: [
      { value: 'Context Clues & Diction Analysis', label: 'Context Clues & Diction Analysis' },
      { value: 'Figurative Language & Imagery', label: 'Figurative Language (Metaphor, Simile, Personification)' },
      { value: 'Idioms, Collocations & Phrasal Verbs', label: 'Idioms, Collocations & Phrasal Verbs' },
      { value: 'Greek & Latin Roots Morphology', label: 'Greek & Latin Roots Morphology Breakdown' },
      { value: 'Connotation vs Denotation Matching', label: 'Connotation, Denotation & Semantic Nuance' }
    ],
    presets: [
      'Figurative Metaphors & Poetic Imagery',
      'Tier 2 Academic Vocabulary in Context',
      'Idiomatic Expressions & Phrasal Verbs',
      'Greek & Latin Prefixes & Word Roots'
    ]
  },
  writing: {
    id: 'writing',
    name: 'Writing & Composition',
    badge: 'Writing & Composition',
    placeholder: 'e.g., Argumentative: Space Exploration vs Ocean Discovery',
    formats: [
      { value: 'Argumentative Essay with Evidence Rubric', label: 'Argumentative / Persuasive Essay with Rubric' },
      { value: 'Narrative Creative Story Scene & Dialogue', label: 'Narrative Creative Story Scene & Dialogue' },
      { value: 'Sentence Combining & Syntactic Expansion', label: 'Sentence Combining & Syntactic Expansion' },
      { value: 'Expository Explanatory Process Essay', label: 'Expository Explanatory Essay with Guidance' }
    ],
    presets: [
      'Argumentative: Space Exploration vs Ocean Discovery',
      'Narrative: An Unexpected Discovery in the Fog',
      'Persuasive: The Value of Free Public Libraries',
      'Expository: How Architecture Reflects Culture'
    ]
  },
  integrated: {
    id: 'integrated',
    name: 'Integrated ELA (Reading + Language + Writing)',
    badge: 'Tripartite ELA Master',
    placeholder: 'e.g., The Psychology of Curiosity & Discovery',
    formats: [
      { value: 'Tripartite Master: Reading + Language + Guided Writing with Rubric', label: 'Complete Tripartite Master (Passage + Language + Writing & Rubric)' }
    ],
    presets: [
      'The Psychology of Curiosity & Discovery',
      'Ecosystem Resilience & Urban Rewilding',
      'The Evolution of Storytelling from Folktales to Digital'
    ]
  }
};

const VARIABLE_GRAMMAR_TARGETS = {
  none: {
    name: 'None (Pure ELA)',
    hint: 'No grammar constraint — focus exclusively on reading, vocabulary, and writing craft.'
  },
  tenses: {
    name: 'Verb Tenses & Aspect (Past, Present, Perfect)',
    hint: 'Passage features varied tenses; vocabulary and writing require deliberate tense shifts (Past Simple vs Present Perfect).'
  },
  conditionals: {
    name: 'Conditionals & Hypotheticals (Zero - 3rd)',
    hint: 'Reading and writing emphasize cause-effect conditions and hypothetical reasoning (If clauses, unless, would have).'
  },
  passive_voice: {
    name: 'Active vs. Passive Voice & Inversion',
    hint: 'Scientific/literary passive voice identification in reading; students must use and analyze agentless passive voice.'
  },
  relative_clauses: {
    name: 'Relative & Complex Subordinate Clauses',
    hint: 'Essential vs non-essential relative clauses (who, which, that, whose) and subordinating conjunctions in reading and writing.'
  },
  modals: {
    name: 'Modal Verbs (Deduction, Obligation & Nuance)',
    hint: 'Analysis of epistemic modality (must have been, could, might) and persuasive obligation modals in text and response.'
  },
  subject_verb: {
    name: 'Subject-Verb Concord & Quantifiers',
    hint: 'Challenging indefinite pronouns, compound subjects, and collective nouns embedded in exercises.'
  },
  reported_speech: {
    name: 'Direct vs. Reported / Indirect Speech',
    hint: 'Quotation attribution, backshifting, and reporting verbs (asserted, maintained, questioned) practiced in dialogue and analysis.'
  },
  sentence_structure: {
    name: 'Sentence Types (Compound, Complex, Coordination)',
    hint: 'Coordination (FANBOYS), subordination, and periodic sentences woven into comprehension and writing expansion drills.'
  },
  punctuation_mechanics: {
    name: 'Punctuation, Semicolons & Transitions',
    hint: 'Mastery of semicolons, colons, em-dashes, and transitional adverbs (however, furthermore, nevertheless).'
  },
  custom: {
    name: 'Custom Target Grammar Rule',
    hint: 'User-specified target rule dynamically injected into reading text, exercises, and the writing rubric.'
  }
};

/**
 * Initialize Left Dashboard ELA Domain and Variable Grammar Controls
 */
function initDomainAndGrammarControls() {
  selectContentDomain(state.currentDomain || 'reading');
  handleGrammarTargetChange();
}

/**
 * Switch Content Domain on Left Dashboard (Reading / Language / Writing / Integrated)
 */
function selectContentDomain(domainId) {
  if (!ELA_DOMAINS[domainId]) domainId = 'reading';
  state.currentDomain = domainId;
  const config = ELA_DOMAINS[domainId];

  // Update button styles
  ['reading', 'language', 'writing'].forEach(id => {
    const btn = document.getElementById(`domain-btn-${id}`);
    if (btn) {
      if (id === domainId) {
        btn.className = "domain-btn py-2 px-1.5 rounded-lg text-center transition flex flex-col items-center justify-center gap-0.5 text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-800 shadow-xs font-bold";
      } else {
        btn.className = "domain-btn py-2 px-1.5 rounded-lg text-center transition flex flex-col items-center justify-center gap-0.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
      }
    }
  });

  // Integrated link styling
  const intBtn = document.getElementById('domain-btn-integrated');
  if (intBtn) {
    if (domainId === 'integrated') {
      intBtn.className = "text-[11px] font-bold text-accent-600 dark:text-accent-400 flex items-center space-x-1 underline";
    } else {
      intBtn.className = "text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center space-x-1 transition group";
    }
  }

  // Update labels & hints
  const label = document.getElementById('active-domain-label');
  if (label) label.textContent = config.name;

  const topicInput = document.getElementById('topic-input');
  if (topicInput) {
    topicInput.placeholder = config.placeholder;
  }

  // Populate dynamic formats
  const formatSelect = document.getElementById('worksheet-type');
  if (formatSelect) {
    formatSelect.innerHTML = config.formats.map((f, idx) => 
      `<option value="${f.value}" ${idx === 0 ? 'selected' : ''}>${f.label}</option>`
    ).join('');
  }

  // Populate dynamic presets
  const presetsContainer = document.getElementById('domain-presets-container');
  if (presetsContainer) {
    presetsContainer.innerHTML = config.presets.map(preset => 
      `<button type="button" onclick="setTopic('${preset.replace(/'/g, "\\'")}')" class="chip px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/40 transition">${preset}</button>`
    ).join('');
  }

  updateGrammarHint();
}

/**
 * Handle Grammar Target Selector Change
 */
function handleGrammarTargetChange() {
  const select = document.getElementById('grammar-variable-target');
  if (!select) return;

  const val = select.value;
  state.currentGrammarTarget = val;

  const customContainer = document.getElementById('custom-grammar-container');
  if (customContainer) {
    if (val === 'custom') {
      customContainer.classList.remove('hidden');
      const customInput = document.getElementById('custom-grammar-input');
      if (customInput) customInput.focus();
    } else {
      customContainer.classList.add('hidden');
    }
  }

  const badge = document.getElementById('grammar-status-badge');
  if (badge) {
    if (val === 'none') {
      badge.textContent = 'Grammar Neutral';
      badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    } else {
      badge.textContent = 'Variable Active';
      badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20';
    }
  }

  updateGrammarHint();
}

/**
 * Randomly cycle/vary the target grammar dimension
 */
function randomizeGrammarFocus() {
  const grammarKeys = [
    'tenses',
    'conditionals',
    'passive_voice',
    'relative_clauses',
    'modals',
    'subject_verb',
    'reported_speech',
    'sentence_structure',
    'punctuation_mechanics'
  ];

  // Pick a random key different from current
  const available = grammarKeys.filter(k => k !== state.currentGrammarTarget);
  const picked = available[Math.floor(Math.random() * available.length)];

  const select = document.getElementById('grammar-variable-target');
  if (select) {
    select.value = picked;
    handleGrammarTargetChange();
  }

  const targetName = VARIABLE_GRAMMAR_TARGETS[picked]?.name || picked;
  showToast(`🎲 Variable Grammar set to: ${targetName}`, '✨');
}

/**
 * Update Live Explanatory Hint for Variable Grammar
 */
function updateGrammarHint() {
  const hintEl = document.getElementById('grammar-focus-hint');
  if (!hintEl) return;

  const targetKey = state.currentGrammarTarget || 'tenses';
  const mode = document.getElementById('grammar-variable-mode')?.value || 'balanced';
  const domainKey = state.currentDomain || 'reading';

  if (targetKey === 'none') {
    hintEl.textContent = `Pure ${ELA_DOMAINS[domainKey]?.name || 'ELA'} mode: Content is generated without any grammar-rule bias.`;
    return;
  }

  let grammarName = VARIABLE_GRAMMAR_TARGETS[targetKey]?.name || targetKey;
  if (targetKey === 'custom') {
    const customVal = document.getElementById('custom-grammar-input')?.value.trim();
    grammarName = customVal ? `"${customVal}"` : 'Custom Grammar Target';
  }

  let modeDesc = 'integrated across passage analysis, contextual vocabulary, and writing constraints.';
  if (mode === 'embedded') {
    modeDesc = 'subtly woven into text reading nuances and the writing evaluation rubric.';
  } else if (mode === 'intensive') {
    modeDesc = 'highlighted for rigorous structural analysis, syntax conversion, and targeted rubric grading.';
  }

  hintEl.textContent = `Variable Target: ${grammarName} will be ${modeDesc}`;
}

/**
 * Quick jump for mobile (< 768px)
 */
function scrollToLeftDashboard() {
  const el = document.getElementById('left-dashboard-board');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToWorksheetPreview() {
  const el = document.getElementById('worksheet-canvas-column');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setTopic(topicText) {
  const input = document.getElementById('topic-input');
  if (input) {
    input.value = topicText;
    input.focus();
  }
}

/**
 * Main Form Submission Handler on Left Dashboard Board
 */
async function handleGenerateWorksheet(event) {
  event.preventDefault();
  if (state.isGenerating) return;

  const topic = document.getElementById('topic-input').value.trim();
  const gradeLevel = document.getElementById('grade-level').value;
  const format = document.getElementById('worksheet-type').value;
  const count = parseInt(document.getElementById('question-count').value, 10) || 8;
  const includeAnswers = document.getElementById('include-answers').checked;

  const domain = state.currentDomain || 'reading';
  const grammarTarget = document.getElementById('grammar-variable-target').value;
  const grammarMode = document.getElementById('grammar-variable-mode').value;
  const customGrammar = document.getElementById('custom-grammar-input')?.value.trim() || '';

  let grammarLabel = '';
  if (grammarTarget !== 'none') {
    if (grammarTarget === 'custom' && customGrammar) {
      grammarLabel = customGrammar;
    } else {
      grammarLabel = VARIABLE_GRAMMAR_TARGETS[grammarTarget]?.name || grammarTarget;
    }
  }

  if (!topic) {
    showToast('Please enter a topic or text theme on the left dashboard', '⚠️');
    return;
  }

  setGeneratingState(true);

  try {
    const worksheetData = await generateWorksheetWithEngine({
      domain,
      topic,
      gradeLevel,
      format,
      count,
      includeAnswers,
      grammarTarget,
      grammarMode,
      grammarLabel,
      userApiKey: state.settings.apiKey
    });

    state.currentWorksheet = worksheetData;
    renderGeneratedWorksheet(worksheetData);
    showToast('ELA Worksheet generated successfully!', '✨');

    // On mobile screens, automatically smooth scroll to the canvas
    if (window.innerWidth < 768) {
      setTimeout(scrollToWorksheetPreview, 300);
    }

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
  const emptyCanvas = document.getElementById('generator-empty-canvas');

  if (isGenerating) {
    btn.disabled = true;
    loader.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    if (emptyCanvas) emptyCanvas.classList.add('hidden');
    loader.scrollIntoView({ behavior: 'smooth' });
  } else {
    btn.disabled = false;
    loader.classList.add('hidden');
  }
}

/**
 * Helper to get the active Gemini API key from settings or the Android bridge
 */
function getActiveApiKey() {
  const isRealKey = (k) => k && typeof k === 'string' && k.trim() && !k.includes('MY_GEMINI_API_KEY') && k.length > 10;

  if (state.settings && state.settings.apiKey && isRealKey(state.settings.apiKey)) {
    return state.settings.apiKey.trim();
  }
  if (window.Android && typeof window.Android.getGeminiApiKey === 'function') {
    try {
      const nativeKey = window.Android.getGeminiApiKey();
      if (isRealKey(nativeKey)) {
        return nativeKey.trim();
      }
    } catch (e) {
      console.warn('Could not read Gemini API key from native bridge:', e);
    }
  }
  return '';
}

/**
 * AI Pedagogical Generator Engine
 * Generates structured, authentic English exercise sheets matching the domain, grade & variable grammar.
 */
async function generateWorksheetWithEngine(params) {
  // Simulate network generation delay for smooth UX
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Determine active API key
  const activeKey = params.userApiKey || getActiveApiKey();

  // If active Gemini key exists, call callGeminiAPI
  if (activeKey) {
    try {
      const liveResult = await callGeminiAPI(params, activeKey);
      if (liveResult) return liveResult;
    } catch (e) {
      console.warn('Gemini API call error, falling back to built-in generator:', e);
    }
  }

  // Built-in curriculum generator
  return buildCurriculumWorksheet(params);
}

/**
 * External Gemini API Integration Hook with ELA & Variable Grammar Support
 */
async function callGeminiAPI(params, apiKey) {
  const { domain, topic, gradeLevel, format, count, includeAnswers, grammarTarget, grammarLabel, grammarMode } = params;
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Generate an authentic, high-quality ELA (English Language Arts) worksheet in JSON format. You MUST strictly adhere to all user specifications below:

CRITICAL SPECIFICATIONS:
- Content Pillar / Domain: "${domain}" (Must strictly generate a ${domain} worksheet)
- Topic / Central Theme: "${topic}" (MUST be directly about ${topic}. The passage, vocabulary, questions, and writing tasks MUST focus entirely on this exact topic: ${topic})
- Grade Level / Target Audience: "${gradeLevel}" (Vocabulary, sentence complexity, and question rigor MUST precisely match ${gradeLevel})
- Format / Exercise Type: "${format}" (Questions MUST reflect this exact format)
- Question / Item Count: ${count} (The "questions" array MUST contain EXACTLY ${count} items, numbered 1 to ${count})
- Variable Grammar Focus: "${grammarLabel || 'None'}" (Mode: ${grammarMode || 'balanced'}) (If specified, integrate questions or required writing rules targeting ${grammarLabel || 'this grammar focus'})
- Include Answer Key: ${includeAnswers} (Every question MUST include a detailed "answer" string)

PEDAGOGICAL REQUIREMENTS BY DOMAIN:
- If domain is Reading: Include a 3-paragraph reading passage set in numbered paragraphs ([1], [2], [3]) strictly about "${topic}". Follow with exactly ${count} deep comprehension questions. If grammar focus is active, include at least one question analyzing syntax or grammar in the passage.
- If domain is Language: Provide exactly ${count} language/vocabulary exercises strictly tailored to "${topic}" and the format "${format}" with clear hints.
- If domain is Writing: Provide a stimulating writing prompt on "${topic}", clear constraints, a required variable grammar rule for "${grammarLabel || 'grammar'}", and a 4-part scoring rubric. Also include ${count} pre-writing or drafting questions.
- If domain is Integrated: Provide a reading passage on "${topic}", language questions, and a writing task with rubric totaling ${count} items.

Return ONLY valid JSON with this exact schema (no additional markdown or conversational text):
{
  "title": "Title reflecting ${topic}",
  "domain": "${domain}",
  "instructions": "Clear directions tailored to ${gradeLevel} students for ${topic}",
  "passage": "Full reading passage about ${topic} if domain is Reading or Integrated, else null",
  "questions": [
    {
      "id": 1,
      "prompt": "Question text directly about ${topic}",
      "options": ["Option A", "Option B", "Option C", "Option D"], // optional
      "hint": "Helpful pedagogical clue or grammar guidance",
      "answer": "Detailed answer or sample response"
    }
  ],
  "writingTask": {
    "prompt": "Writing prompt directly about ${topic}",
    "grammarRequirement": "Specific instruction for incorporating ${grammarLabel || 'variable grammar'}",
    "rubric": [
      { "criterion": "Ideas & Content", "description": "Clear thesis and supporting evidence on ${topic}" },
      { "criterion": "Grammar Mastery", "description": "Accurate use of ${grammarLabel || 'standard grammar'}" }
    ]
  },
  "teacherNotes": "Brief pedagogical notes for teaching ${topic} to ${gradeLevel} students"
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
  let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('No content returned by Gemini');
  }
  // Clean markdown fencing if returned
  textResponse = textResponse.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(textResponse);

  return {
    id: 'ws-' + Date.now(),
    title: parsed.title || `${topic} - ${domain.toUpperCase()}`,
    domain,
    gradeLevel,
    format,
    grammarTarget,
    grammarLabel,
    grammarMode,
    instructions: parsed.instructions || 'Complete the following exercises carefully.',
    passage: parsed.passage || null,
    questions: parsed.questions || [],
    writingTask: parsed.writingTask || null,
    teacherNotes: parsed.teacherNotes || '',
    includeAnswers,
    dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

/**
 * Built-in Curriculum Generator to guarantee 100% offline, immediate, high-craft results
 * Specially designed for Reading/Language/Writing with Variable Grammar
 */
function buildCurriculumWorksheet(params) {
  const { domain = 'reading', topic, gradeLevel, format, count = 8, includeAnswers = true, grammarTarget = 'none', grammarLabel = '', grammarMode = 'balanced' } = params;

  const isReading = domain === 'reading' || domain === 'integrated';
  const isLanguage = domain === 'language' || domain === 'integrated';
  const isWriting = domain === 'writing' || domain === 'integrated';

  let passage = null;
  const questions = [];
  let writingTask = null;

  // 1. GENERATE PASSAGE (For Reading & Integrated)
  if (isReading) {
    if (topic.toLowerCase().includes('deep sea') || topic.toLowerCase().includes('ocean') || topic.toLowerCase().includes('marine')) {
      passage = `[1] Descending into the ocean's abyssal depths reveals an extreme realm of near-freezing water and crushing hydrostatic pressure, where sunlight has never penetrated. Despite these seemingly uninhabitable conditions, marine biologists have documented thriving biological communities that cluster around hydrothermal vents. In these volcanic fissures, chemosynthetic bacteria synthesize sulfur-laden minerals into sustenance, forming the bedrock of a food web that sustains ghost crabs, bioluminescent lanternfish, and giant tube worms.

[2] Adaptation in the hadal zone demands profound physiological marvels. Most deep-sea species possess gelatinous bodies deficient in air cavities, which prevents catastrophic implosion under pressure. If a surface fish were transplanted into the Mariana Trench, its cellular membranes would rupture almost instantly. Furthermore, organisms such as the anglerfish deploy bioluminescent photophores not merely for illumination, but as strategic lures to entice unsuspecting prey in the perpetual blackness.

[3] Human activity now encroaches even upon these remote sanctuaries. Industrial bottom-trawling and prospective deep-seabed mineral mining threaten to disrupt fragile seafloor sediments that have settled over millions of years. As oceanographers deploy autonomous submersibles to map uncharted trenches, international conservation treaties must be enacted swiftly to safeguard these mysterious ecological frontiers before irreversible devastation occurs.`;
    } else {
      // General authentic theme passage
      passage = `[1] The exploration of ${topic} represents one of the most intellectually compelling frontiers in modern knowledge. As researchers and observers delve deeper into its intricate dynamics, foundational principles that were once considered unassailable have undergone profound re-examination. What began as an isolated curiosity has blossomed into a vital interdisciplinary domain, offering fresh perspectives on how societies and environments continually evolve.

[2] A critical examination reveals that subtle factors exert disproportionate influence over outcomes. When conditions are meticulously cataloged, researchers consistently discover underlying patterns that illuminate complex interdependencies. For instance, if foundational elements are altered even slightly, the cascading ramifications can redefine the entire trajectory. Observers must therefore remain vigilant, distinguishing between superficial correlations and substantive causal mechanisms.

[3] Looking toward the future, stewardship and thoughtful application will determine whether these discoveries benefit humanity as a whole. While technological tools facilitate unprecedented diagnostic precision, the human element—characterized by critical analysis, ethical discernment, and collaborative inquiry—remains indispensable. Ultimately, mastering the nuances of ${topic} empowers learners to participate meaningfully in dialogues that shape our collective tomorrow.`;
    }
  }

  // 2. GENERATE QUESTIONS ACCORDING TO DOMAIN
  if (domain === 'reading') {
    const readingQuestionBlueprints = [
      {
        prompt: `Based on Paragraph 1, what central claim or mechanism regarding "${topic}" does the author introduce? Cite specific text evidence.`,
        hint: `Look at the key concepts introduced in Paragraph 1 regarding ${topic}.`,
        answer: `Sample Answer: The author establishes that ${topic} involves fundamental principles that shape research and understanding in Paragraph 1.`
      },
      {
        prompt: `In Paragraph 2, how does the author elaborate on the underlying dynamics of "${topic}"?`,
        hint: `Focus on cause-and-effect relationships or subtle influencing factors in Paragraph 2.`,
        answer: `Sample Answer: The author demonstrates that subtle underlying factors in ${topic} produce cascading ramifications across the system.`
      },
      {
        prompt: `Analyze the author's primary conclusion in Paragraph 3 regarding "${topic}". What future actions or ethical considerations are recommended?`,
        hint: `Identify the shift towards stewardship, critical analysis, and collaborative inquiry.`,
        answer: `Sample Answer: The author concludes that mastering ${topic} requires human critical analysis, ethical discernment, and collaborative inquiry.`
      },
      {
        prompt: `Vocabulary in Context: Examine the passage about "${topic}". Select a key domain-specific term, define it in context, and explain its significance.`,
        hint: `Use surrounding context clues in the reading passage to determine nuance.`,
        answer: `Sample Answer: Key term definition and contextual analysis grounded directly in the text about ${topic}.`
      }
    ];

    // If grammar variable is active, add targeted syntactic analysis question
    if (grammarTarget !== 'none') {
      readingQuestionBlueprints.push({
        prompt: `Syntactic Analysis (${grammarLabel || 'Grammar Target'}): Identify a sentence in Paragraph 2 or 3 demonstrating ${grammarLabel || 'the target grammar'}. Explain how this grammatical construction clarifies the author's purpose.`,
        hint: `Notice how the sentence structures emphasize cause, condition, or passivity.`,
        answer: `Sample Answer: In Paragraph 2: "If a surface fish were transplanted... its cellular membranes would rupture." This conditional sentence underscores the harsh reality of extreme oceanic pressure.`
      });
    }

    // Fill up to count
    const extraPrompts = [
      `Distinguish between the central idea of the passage and a supporting technical detail.`,
      `How does the author's organizational structure (description followed by problem/solution) enhance comprehension?`,
      `Evaluate whether the conclusion reached in the final paragraph is supported by sound factual evidence or rhetorical persuasion.`,
      `Write a concise 3-sentence summary encapsulating the passage's primary claims.`,
      `What questions remain unanswered by the text that a scientific investigator might pursue next?`,
      `Identify one instance of figurative language or sensory imagery in the passage and explain its effect on the reader.`
    ];

    let qId = 1;
    readingQuestionBlueprints.forEach(bp => {
      if (qId <= count) {
        questions.push({ id: qId++, ...bp });
      }
    });

    while (qId <= count) {
      const promptText = extraPrompts[(qId - 1) % extraPrompts.length];
      questions.push({
        id: qId++,
        prompt: promptText,
        hint: `Reference specific paragraphs and line context.`,
        answer: `Sample Answer: Comprehensive analysis demonstrating mastery of text evidence and critical reasoning.`
      });
    }

  } else if (domain === 'language') {
    const vocabData = [
      { word: 'ABYSSAL', def: 'Relating to the ocean depths where sunlight never penetrates', root: 'Greek "abyssos" (bottomless)', ex: 'The submarine descended into abyssal trenches.' },
      { word: 'METICULOUS', def: 'Showing extreme care and attention to fine details', root: 'Latin "metus" (care/fearful caution)', ex: 'She made meticulous observations of the bacterial culture.' },
      { word: 'PERPETUAL', def: 'Continuing forever or indefinitely without interruption', root: 'Latin "perpetuus" (continuous)', ex: 'Organisms thrive in perpetual darkness.' },
      { word: 'RESILIENT', def: 'Able to recover swiftly from adversity or physical stress', root: 'Latin "resilire" (to leap back)', ex: 'The deep-sea ecosystem proved surprisingly resilient.' },
      { word: 'ENCROACH', def: 'To advance gradually beyond usual or acceptable limits', root: 'Old French "encrochier" (to seize)', ex: 'Industrial developments encroach upon wild habitats.' },
      { word: 'SYNTHESIZE', def: 'To combine constituent parts into a unified whole', root: 'Greek "syntithenai" (to put together)', ex: 'Bacteria synthesize minerals to generate organic nutrients.' }
    ];

    for (let i = 1; i <= count; i++) {
      const item = vocabData[(i - 1) % vocabData.length];
      if (format.includes('Figurative')) {
        questions.push({
          id: i,
          prompt: `Identify the figurative device in the sentence below and explain the comparison being drawn:\n"The ocean trenches stood as silent cathedrals carved by the slow hand of geological time."`,
          hint: `Look for metaphor, personification, or hyperbole.`,
          answer: `Device: Metaphor. The ocean trenches are directly compared to "silent cathedrals" to convey grandeur, sacred reverence, and ancient solemnity.`
        });
      } else if (format.includes('Roots') || format.includes('Morphology')) {
        questions.push({
          id: i,
          prompt: `Morphological Analysis: Examine the word "${item.word}". Identify its root (${item.root}) and explain how knowing this root helps decode unfamiliar words in scientific reading.`,
          hint: `Root: ${item.root}`,
          answer: `Root explanation: ${item.def}. Related English derivatives share the common underlying semantic concept.`
        });
      } else {
        // Context Clues & Diction Analysis
        questions.push({
          id: i,
          prompt: `Context Clues: In the context of ${topic}, define the term "${item.word}" and construct an original academic sentence illustrating its precise meaning.`,
          hint: `Contextual Definition: ${item.def}`,
          answer: `Definition: ${item.def}. Sample Sentence: "${item.ex}"`
        });
      }
    }

    // If variable grammar is active, append a syntactic transformation task
    if (grammarTarget !== 'none' && questions.length > 0) {
      questions[questions.length - 1] = {
        id: questions.length,
        prompt: `Variable Grammar Synthesis (${grammarLabel}): Rewrite the sentence below using ${grammarLabel}.\nOriginal: "Scientists discovered hydrothermal vents in 1977, and they revolutionized oceanography."`,
        hint: `Apply ${grammarLabel} while maintaining semantic accuracy.`,
        answer: `Sample Transformation: "Hydrothermal vents were discovered in 1977 by scientists, revolutionizing the field of oceanography."`
      };
    }

  } else if (domain === 'writing') {
    // Dedicated Writing Worksheet with Guided Prompts, Constraints & Variable Grammar Requirement
    writingTask = {
      prompt: `Prompt: Compose a well-structured composition exploring "${topic}". State a clear thesis or compelling premise, support your ideas with vivid supporting details, and demonstrate deliberate syntactic variety.`,
      targetLength: '3 to 5 detailed paragraphs (250–400 words)',
      grammarRequirement: grammarTarget !== 'none'
        ? `Mandatory Variable Grammar Requirement: You must integrate at least TWO sentences demonstrating ${grammarLabel} in your composition. Underline each target sentence in your final response.`
        : `Syntactic Goal: Employ varied sentence lengths and clear transitional adverbs between paragraphs.`,
      rubric: [
        { criterion: 'Content & Thesis', description: 'Clear central idea, compelling insight, and robust supporting elaboration.' },
        { criterion: 'Organization & Cohesion', description: 'Logical flow, coherent paragraph transitions, and effective opening/closing.' },
        { criterion: 'Diction & Voice', description: 'Sophisticated academic vocabulary, precise verbs, and tone tailored to audience.' },
        { criterion: grammarTarget !== 'none' ? `Grammar (${grammarLabel})` : 'Mechanics & Syntax', description: grammarTarget !== 'none' ? `Accurate, deliberate application of ${grammarLabel} with underlined sentences.` : 'Error-free punctuation, sentence boundary clarity, and syntactic variety.' }
      ]
    };

    // Pre-writing and drafting questions
    questions.push({
      id: 1,
      prompt: `Pre-Writing Brainstorm: Formulate your central thesis statement or guiding narrative hook for your composition on "${topic}".`,
      hint: `Ensure your statement is specific, arguable, and engaging.`,
      answer: `Teacher Check: Clear, focused thesis that guides the entire composition without ambiguity.`
    });

    questions.push({
      id: 2,
      prompt: `Syntactic Planning (${grammarLabel || 'Sentence Craft'}): Draft one practice sentence demonstrating ${grammarLabel || 'a complex sentence'} that you will integrate into your body paragraph.`,
      hint: `Check that your practice sentence conforms to ${grammarLabel || 'standard conventions'}.`,
      answer: `Teacher Check: Verify accurate syntax for ${grammarLabel || 'the planned structure'}.`
    });

    questions.push({
      id: 3,
      prompt: `Essay / Narrative Drafting Workspace: Write your complete composition below adhering to all prompt criteria and grammar requirements.`,
      hint: `Target Length: 250-400 words. Remember to underline your target grammar sentences.`,
      answer: `Score according to the 4-Criterion Holistic Rubric printed below.`
    });

  } else {
    // INTEGRATED ELA: Reading + Language + Writing Master
    const readingQuestions = [
      {
        id: 1,
        prompt: `Reading Analysis: What central conflict or natural phenomenon is depicted in the text? Cite evidence from Paragraph 1.`,
        hint: `Reference specific textual phrases.`,
        answer: `Sample Answer: The text contrasts the seemingly uninhabitable conditions of the deep ocean with the thriving, chemosynthetic communities that inhabit it.`
      },
      {
        id: 2,
        prompt: `Inference & Text Evidence: How do the adaptations described in Paragraph 2 demonstrate evolutionary resilience?`,
        hint: `Note the specific biological trade-offs.`,
        answer: `Sample Answer: Gelatinous bodies and bioluminescence allow organisms to withstand extreme hydrostatic pressure and navigate total darkness.`
      }
    ];

    const languageQuestions = [
      {
        id: 3,
        prompt: `Language & Diction: Locate an academic or scientific term in the passage. Define it and explain how it elevates the academic tone.`,
        hint: `Consider words like "chemosynthetic", "bioluminescence", or "encroaches".`,
        answer: `Sample Answer: "Chemosynthetic" elevates tone by providing precise biological terminology for non-photosynthetic metabolic processes.`
      },
      {
        id: 4,
        prompt: `Variable Grammar Application (${grammarLabel || 'Sentence Structure'}): Identify a sentence in Paragraph 3 that demonstrates ${grammarLabel || 'complex structure'}. Explain its grammatical structure.`,
        hint: `Analyze clauses, voice, or modal verbs.`,
        answer: `Sample Answer: In Paragraph 3, passive and conditional constructions emphasize the collective urgency of conservation.`
      }
    ];

    writingTask = {
      prompt: `Synthesis Writing Task: Using insights from the reading passage and your language analysis, write a 2-paragraph response discussing the importance of investigating "${topic}". Incorporate at least two target sentences using ${grammarLabel || 'varied sentence structures'}.`,
      targetLength: '2 substantial paragraphs (150–250 words)',
      grammarRequirement: grammarTarget !== 'none'
        ? `Variable Grammar Constraint: Underline two sentences that utilize ${grammarLabel}.`
        : `Ensure clear sentence variety and robust transitional words.`,
      rubric: [
        { criterion: 'Text Synthesis', description: 'Accurate integration of passage concepts and vocabulary.' },
        { criterion: 'Grammar Mastery', description: `Accurate application of ${grammarLabel || 'standard conventions'}.` }
      ]
    };

    questions.push(...readingQuestions, ...languageQuestions);
    questions.push({
      id: 5,
      prompt: `Integrated Writing Response: Compose your response combining text evidence, academic diction, and your variable grammar target.`,
      hint: `Underline your target grammar sentences.`,
      answer: `Evaluate according to synthesis accuracy and grammar rubric criteria.`
    });
  }

  return {
    id: 'ws-' + Date.now(),
    title: `${topic} - ${domain.toUpperCase()} ELA Master`,
    domain,
    gradeLevel,
    format,
    grammarTarget,
    grammarLabel,
    grammarMode,
    instructions: isReading 
      ? 'Read the passage carefully, then answer each question in complete, coherent sentences.'
      : isWriting
      ? 'Complete the guided pre-writing exercises, then draft your composition adhering strictly to the prompt criteria and variable grammar requirement.'
      : `Complete all items below adhering to the rules of ${topic}. Check your spelling and grammar.`,
    passage: isReading ? passage : null,
    questions,
    writingTask,
    includeAnswers,
    dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

// ==========================================
// 5. RENDERING WORKSHEET CANVAS
// ==========================================
function renderGeneratedWorksheet(ws) {
  const container = document.getElementById('worksheet-paper-container');
  const resultWrapper = document.getElementById('generated-result-container');

  // Domain Badge Styling
  const domainNames = {
    reading: '📖 Reading & Comprehension',
    language: '🗣️ Language & Vocabulary',
    writing: '✍️ Writing & Composition',
    integrated: '🌟 Integrated ELA Master'
  };
  const domainLabel = domainNames[ws.domain] || ws.domain || 'ELA Practice';

  // Variable Grammar Pill
  let grammarPillHtml = '';
  if (ws.grammarTarget && ws.grammarTarget !== 'none') {
    grammarPillHtml = `
      <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-950/50 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800 text-xs font-semibold mt-2">
        <span>🧩</span>
        <span>Variable Grammar Focus:</span>
        <strong class="text-accent-900 dark:text-white font-bold">${ws.grammarLabel || ws.grammarTarget}</strong>
        <span class="text-[10px] text-accent-600 dark:text-accent-400">(${ws.grammarMode || 'balanced'})</span>
      </div>
    `;
  }

  // Reading Passage Block
  let passageHtml = '';
  if (ws.passage) {
    passageHtml = `
      <div class="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border-l-4 border-brand-500 text-sm leading-relaxed text-slate-800 dark:text-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-bold text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-1.5">
            <span>📖</span>
            <span>Reading Passage: Text Evidence</span>
          </h4>
          <span class="text-[10px] text-slate-400 font-medium">Paragraphs numbered [1], [2], [3]</span>
        </div>
        <div class="space-y-3 font-serif text-[13.5px] sm:text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
          ${ws.passage}
        </div>
      </div>
    `;
  }

  // Writing Task & Rubric Block (if writing or integrated)
  let writingBlockHtml = '';
  if (ws.writingTask) {
    let rubricRows = '';
    if (ws.writingTask.rubric && ws.writingTask.rubric.length > 0) {
      rubricRows = `
        <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Teacher Scoring Rubric:</h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            ${ws.writingTask.rubric.map(r => `
              <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong class="text-brand-700 dark:text-brand-300 block mb-0.5">${r.criterion}</strong>
                <span class="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">${r.description}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    writingBlockHtml = `
      <div class="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 shadow-xs">
        <div class="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
          <span>✍️</span>
          <span>Writing Task &amp; Syntactic Guidelines</span>
        </div>
        <p class="text-sm text-slate-900 dark:text-slate-100 font-medium mb-3 leading-relaxed">
          ${ws.writingTask.prompt}
        </p>
        
        <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 text-xs space-y-1">
          <div class="flex items-start space-x-1.5">
            <span class="font-bold text-brand-600 dark:text-brand-400 shrink-0">🎯 Requirement:</span>
            <span class="text-slate-800 dark:text-slate-200 font-medium">${ws.writingTask.grammarRequirement}</span>
          </div>
          ${ws.writingTask.targetLength ? `<div class="text-slate-500 text-[11px]">Target Length: ${ws.writingTask.targetLength}</div>` : ''}
        </div>

        ${rubricRows}
      </div>
    `;
  }

  // Questions List
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
            ${q.hint ? `<p class="text-xs text-slate-500 dark:text-slate-400 italic mt-1.5 flex items-center space-x-1"><span class="not-italic text-amber-500">💡</span> <span>${q.hint}</span></p>` : ''}
            ${optionsHtml}
            ${!q.options ? `
              <div class="space-y-2 mt-3 w-full">
                <div class="worksheet-rule w-full"></div>
                <div class="worksheet-rule w-full"></div>
                <div class="worksheet-rule w-4/5"></div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  });

  // Teacher Answer Key Block
  let answerKeyHtml = '';
  if (ws.includeAnswers) {
    answerKeyHtml = `
      <div class="answer-key-section mt-8 pt-6 border-t-2 border-dashed border-slate-300 dark:border-slate-700">
        <div class="flex items-center space-x-2 mb-3">
          <span class="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 rounded-md">Teacher Answer Key &amp; Rubric Guide</span>
          <span class="text-xs text-slate-400">Fold or detach before distributing to students</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          ${ws.questions.map((q, idx) => `
            <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <strong class="text-slate-900 dark:text-white">Item #${idx + 1}:</strong> 
              <span class="text-slate-600 dark:text-slate-300">${q.answer}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Construct Full Paper HTML
  container.innerHTML = `
    <!-- Student & Classroom Header block for printing & formal view -->
    <div class="border-b-2 border-slate-900 dark:border-slate-100 pb-4 mb-6">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <div class="flex items-center">
          <span class="font-bold text-slate-900 dark:text-slate-100">Name:</span>
          <span class="inline-block flex-1 border-b-2 border-slate-400 dark:border-slate-500 ml-1.5 min-w-[80px]"></span>
        </div>
        <div class="flex items-center">
          <span class="font-bold text-slate-900 dark:text-slate-100">Date:</span>
          <span class="inline-block flex-1 border-b-2 border-slate-400 dark:border-slate-500 ml-1.5 min-w-[60px]"></span>
        </div>
        <div class="flex items-center">
          <span class="font-bold text-slate-900 dark:text-slate-100">Teacher:</span>
          <span class="inline-block flex-1 border-b-2 border-slate-400 dark:border-slate-500 ml-1.5 min-w-[80px]"></span>
        </div>
        <div class="flex items-center justify-end">
          <span class="font-bold text-slate-900 dark:text-slate-100">Score:</span>
          <span class="inline-block border-b-2 border-slate-400 dark:border-slate-500 w-12 ml-1 text-center"></span>
          <span class="text-slate-500 ml-0.5">/ ${ws.questions ? ws.questions.length : '10'}</span>
        </div>
      </div>

      <div class="mt-4 text-center">
        <div class="inline-block mb-1">
          <span class="text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
            ${domainLabel}
          </span>
        </div>
        <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">${ws.title}</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">${ws.gradeLevel} &bull; ${ws.format}</p>
        ${grammarPillHtml}
      </div>
    </div>

    <!-- Instructions -->
    <div class="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
      <span class="text-base shrink-0 leading-none">📌</span>
      <div>
        <strong>Instructions:</strong> ${ws.instructions}
      </div>
    </div>

    ${passageHtml}
    ${writingBlockHtml}

    <!-- Questions list -->
    <div class="space-y-2">
      ${questionsHtml}
    </div>

    <!-- Answer Key -->
    ${answerKeyHtml}
  `;

  const emptyCanvas = document.getElementById('generator-empty-canvas');
  if (emptyCanvas) emptyCanvas.classList.add('hidden');

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
/**
 * Directly triggers the browser's native print-to-PDF dialog.
 * Bypasses app container wrappers and uses the @page CSS styling to preserve A4 layout.
 */
function triggerDirectBrowserPrintPDF() {
  if (!state.currentWorksheet) {
    showToast('No worksheet available to print', '⚠️');
    return;
  }
  
  showToast('Opening Print to PDF dialog...', '🖨️');

  // Small timeout to allow toast and UI reflow to settle before the blocking browser print dialog opens
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      console.error('Direct print failed, falling back to Android bridge if available:', e);
      if (window.Android && typeof window.Android.print === 'function') {
        window.Android.print();
      } else {
        showToast('Print dialog could not be opened', '❌');
      }
    }
  }, 80);
}

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
  const activeKey = getActiveApiKey();

  // If Gemini API Key is available, call Gemini in real time
  if (activeKey) {
    try {
      const liveResponse = await callGeminiChatAPI(question, activeKey);
      if (liveResponse && liveResponse.trim()) {
        return liveResponse.trim();
      }
    } catch (e) {
      console.warn('Live Gemini chat call error, using tutor pedagogical engine:', e);
    }
  }

  // Graceful pedagogical fallback when offline or without API key
  await new Promise(res => setTimeout(res, 650));
  return getSimulatedTutorResponse(question);
}

/**
 * Real-time Gemini API conversation engine for English Tutor Alex
 */
async function callGeminiChatAPI(userQuestion, apiKey) {
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Build context from the user's current worksheet and curriculum settings
  let contextInfo = '';
  if (state.currentWorksheet) {
    contextInfo = `Current Active Worksheet Context:
- Title: "${state.currentWorksheet.title || 'Untitled'}"
- Content Domain: "${state.currentWorksheet.domain || state.currentDomain || 'Reading'}"
- Grade Level: "${state.currentWorksheet.gradeLevel || 'Grade 6-8'}"
- Grammar Focus: "${state.currentWorksheet.grammarLabel || 'Standard English'}"`;
    if (state.currentWorksheet.passage) {
      contextInfo += `\n- Reading Passage Excerpt: "${state.currentWorksheet.passage.substring(0, 300)}..."`;
    }
  } else if (state.currentDomain) {
    contextInfo = `Current Domain Focus: ${state.currentDomain}`;
  }

  const systemInstruction = `You are Alex, a passionate, lively, and deeply supportive Senior English Teacher & Department Head with decades of experience inspiring students.

Your Persona & Teaching Philosophy:
1. **Lively & Supportive Voice**: Speak with genuine warmth, infectious enthusiasm, and articulate clarity. Celebrate curiosity, encourage creative risk-taking, and foster a comfortable, supportive space for exploring language.
2. **Open-Ended Linguistic Exploration**: You have complete freedom to engage in vibrant, real-time discussions about ALL facets of English—including subtle grammar nuances (e.g., subjunctive mood vs. indicative, Oxford comma debates, active vs. passive voice rhetoric), literary analysis, creative writing, rhetoric, etymology, idioms, stylistic tone, and conversational fluency.
3. **Deep Nuance & Practical Examples**: Don't just give flat definitions—unpack *why* language choices matter! Provide vivid real-world examples, memorable analogies, before-and-after sentence comparisons, and actionable tips for elevating writing.
4. **Interactive Dialogue**: Ask thoughtful follow-up questions to invite the student to share their thoughts, try writing a sentence, or reflect on a concept. Keep conversations active and dynamic.
5. **Context Integration**: If a worksheet is active in their studio, seamlessly weave in relevant connections when natural, while always remaining 100% open to whatever topic or creative direction the student wants to explore.
6. **Formatting**: Use clean Markdown with bold key terms, bullet points, and code blocks or blockquotes for sentence examples to make your explanations visual and easy to digest.
${contextInfo ? '\n' + contextInfo : ''}`;

  // Gather recent chat history for conversational continuity (up to last 6 messages)
  const recentHistory = (state.chatMessages || [])
    .slice(-6)
    .filter(m => m.id !== 'msg-welcome')
    .map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

  // Append latest question
  const contents = [...recentHistory, {
    role: 'user',
    parts: [{ text: userQuestion }]
  }];

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 1024
    }
  };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini Chat API error ${response.status}: ${errorBody || response.statusText}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Empty text received from Gemini response');
  }
  return textOutput;
}

/**
 * Built-in pedagogical simulation for Alex when running offline
 */
function getSimulatedTutorResponse(question) {
  const q = question.toLowerCase();

  // 1. Creative Writing Prompt
  if (q.includes('writing prompt') || q.includes('write an essay') || q.includes('story prompt') || q.includes('prompt')) {
    return `Here is a creative writing prompt for you:\n\n✨ **"The Clock that Ticked Backwards"**\nImagine discovering an antique pocket watch in your school library that doesn't tell the current time, but instead counts backward toward a historic moment.\n\n🎯 **Writing Challenges:**\n1. Use at least three sensory adjectives (e.g., *musty*, *luminescent*, *brass*).\n2. Write from a first-person perspective ("I walked into...").\n3. Introduce an unexpected plot twist in the final paragraph.\n\nGive it a try and paste your paragraph here—I'll review your grammar and word choice!`;
  }

  // 2. Vocabulary Explanation / Grammar Rule
  if (q.includes('their') || q.includes('there') || q.includes('they\'re')) {
    return `Great question! These three homophones confuse many English speakers:\n\n1. **There** (Adverb - Place / Location):\n   • Example: *"Please place your books over there."*\n   • Tip: Contains the word "here" (both relate to places).\n\n2. **Their** (Possessive Pronoun - Belongs to them):\n   • Example: *"The students forgot their notebooks."*\n   • Tip: Contains "heir" (someone who inherits property).\n\n3. **They're** (Contraction of 'They are'):\n   • Example: *"They're going to the school library."*\n   • Tip: Try replacing it with "they are"—if the sentence still makes sense, use the apostrophe!`;
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
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-brand-500/20 ring-2 ring-white/50 dark:ring-white/10">
            🎓
          </div>
        ` : ''}
        <div class="max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed transition-all ${
          isUser 
            ? 'glass-user-bubble text-white rounded-br-sm' 
            : 'glass-ai-bubble text-slate-800 dark:text-slate-100 rounded-bl-sm'
        }">
          <div class="whitespace-pre-wrap">${formatChatMarkdown(msg.text)}</div>
          <span class="block text-[10px] mt-1.5 ${isUser ? 'text-brand-100 text-right' : 'text-slate-400'}">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        ${isUser ? `
          <div class="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700/80 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0 border border-white/40 dark:border-white/10">
            ME
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function formatChatMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function renderTypingIndicator(show) {
  const chatContainer = document.getElementById('chat-messages');
  const existingIndicator = document.getElementById('typing-indicator');

  if (show && !existingIndicator) {
    const indicatorHtml = `
      <div id="typing-indicator" class="flex items-center space-x-2 text-slate-400 text-xs py-2">
        <div class="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 flex items-center justify-center text-xs ring-1 ring-brand-500/20">🎓</div>
        <div class="glass-ai-bubble px-3 py-2 rounded-xl flex space-x-1.5 items-center">
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
// 9. SETTINGS & APP PREFERENCES & PREMIUM COLOR THEMES
// ==========================================
function toggleDarkMode() {
  state.settings.darkMode = !state.settings.darkMode;
  applyTheme();
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
}

function selectColorTheme(themeId) {
  if (!PREMIUM_THEMES[themeId]) return;
  state.settings.colorTheme = themeId;
  applyTheme();
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  showToast(`Palette switched to ${PREMIUM_THEMES[themeId].name}`, '🎨');
}

function toggleThemeModal(forceState) {
  const modal = document.getElementById('quick-theme-modal');
  if (!modal) return;
  if (typeof forceState === 'boolean') {
    if (forceState) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
  } else {
    modal.classList.toggle('hidden');
  }
}

function applyTheme() {
  const isDark = state.settings.darkMode;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const activeThemeId = state.settings.colorTheme || 'indigo';
  document.documentElement.setAttribute('data-theme', activeThemeId);
  document.body.setAttribute('data-theme', activeThemeId);

  // Update theme label in settings
  const themeMeta = PREMIUM_THEMES[activeThemeId] || PREMIUM_THEMES.indigo;
  const currentLabel = document.getElementById('current-theme-label');
  if (currentLabel) {
    currentLabel.textContent = themeMeta.name;
  }

  // Update sidebar theme indicator
  const sidebarIndicator = document.getElementById('sidebar-theme-indicator');
  if (sidebarIndicator) {
    sidebarIndicator.textContent = themeMeta.name;
  }

  // Update Settings cards active states
  document.querySelectorAll('#theme-selection-grid .theme-card').forEach(card => {
    const cardTheme = card.getAttribute('data-theme-id');
    const checkEl = card.querySelector('.theme-check');
    if (cardTheme === activeThemeId) {
      card.classList.add('active-theme');
      if (checkEl) checkEl.classList.remove('hidden');
    } else {
      card.classList.remove('active-theme');
      if (checkEl) checkEl.classList.add('hidden');
    }
  });

  // Update Modal buttons active states
  document.querySelectorAll('#modal-theme-grid .theme-card').forEach(btn => {
    const btnTheme = btn.getAttribute('data-theme-id');
    const checkIcon = btn.querySelector('span');
    if (btnTheme === activeThemeId) {
      btn.classList.add('active-theme');
      if (checkIcon) checkIcon.textContent = '✓';
    } else {
      btn.classList.remove('active-theme');
      if (checkIcon) checkIcon.textContent = '';
    }
  });

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
  state.settings = { darkMode: false, colorTheme: 'indigo', apiKey: '' };

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
