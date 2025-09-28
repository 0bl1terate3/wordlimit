/**
 * Advanced Word Limit Control Extension for SillyTavern
 * Provides per-character word limit settings with advanced controls
 */

// Extension metadata
const EXTENSION_NAME = 'Advanced Word Limit Control';
const EXTENSION_VERSION = '1.0.0';

// Word limit constants
const WORD_LIMIT_METADATA_KEY = 'word_limit';
const MAX_AI_ATTEMPTS = 3;

// Stopwords and filler words for intelligent trimming
const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'so', 'to', 'of', 'for', 'in', 'on', 'at', 'by', 'with', 'from', 'into', 'about',
    'over', 'under', 'between', 'through', 'during', 'before', 'after', 'up', 'down', 'out', 'off', 'than', 'as', 'if', 'then',
    'while', 'because', 'since', 'though', 'although', 'though', 'unless', 'without', 'within', 'beyond', 'around', 'near',
    'just', 'very', 'really', 'quite', 'still', 'also', 'even', 'too', 'ever', 'never', 'maybe', 'perhaps', 'almost',
]);

const FILLER_WORDS = new Set([
    'literally', 'actually', 'basically', 'seriously', 'simply', 'kinda', 'sorta', 'pretty', 'totally', 'completely',
    'extremely', 'highly', 'truly', 'honestly', 'definitely', 'probably', 'apparently', 'maybe', 'perhaps', 'somewhat',
]);

// Phrase replacements for more natural text
const PHRASE_REPLACEMENTS = [
    { pattern: /\byou are\b/gi, replacement: 'you\'re' },
    { pattern: /\byou have\b/gi, replacement: 'you\'ve' },
    { pattern: /\bkind of\b/gi, replacement: 'kinda' },
    { pattern: /\bsort of\b/gi, replacement: 'sorta' },
    { pattern: /\bgoing to\b/gi, replacement: 'gonna' },
    { pattern: /\bgot to\b/gi, replacement: 'gotta' },
    { pattern: /\btrying to\b/gi, replacement: 'tryna' },
];

// Extension state
let extensionSettings = {
    enabled: true,
    defaultMinWords: 10,
    defaultMaxWords: 100,
    defaultStrictMode: false,
    defaultAutoTrim: true,
    defaultStyle: 'natural'
};

/**
 * Initialize the extension
 */
function initializeExtension() {
    console.log(`${EXTENSION_NAME} v${EXTENSION_VERSION} initialized`);

    // Load extension settings
    loadExtensionSettings();

    // Add UI to character popup
    addWordLimitUI();

    // Hook into message processing
    hookIntoMessageProcessing();

    // Register extension settings
    registerExtensionSettings();
}

/**
 * Load extension settings from SillyTavern
 */
function loadExtensionSettings() {
    try {
        const savedSettings = extension_settings.word_limit_extension;
        if (savedSettings) {
            extensionSettings = { ...extensionSettings, ...savedSettings };
        }
    } catch (error) {
        console.warn('Failed to load extension settings:', error);
    }
}

/**
 * Save extension settings
 */
function saveExtensionSettings() {
    try {
        if (typeof extension_settings !== 'undefined') {
            extension_settings.word_limit_extension = extensionSettings;
        }
    } catch (error) {
        console.warn('Failed to save extension settings:', error);
    }
}

/**
 * Add word limit UI to character popup
 */
function addWordLimitUI() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addWordLimitUI);
        return;
    }

    // Check if UI already exists
    if (document.getElementById('word_limit_extension_ui')) {
        return;
    }

    // Create the UI HTML
    const wordLimitHTML = `
        <hr>
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <h4>
                    <span data-i18n="Word Limit Settings">Word Limit Settings</span>
                    <small data-i18n="(Control response length and word count)">(Control response length and word count)</small>
                </h4>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content" id="word_limit_extension_ui">
                <div class="flex-container flexFlowColumn gap10">
                    <div class="flex-container alignitemscenter justifySpaceBetween">
                        <label class="checkbox_label">
                            <input type="checkbox" id="word_limit_enabled" name="word_limit_enabled">
                            <small data-i18n="Enable Word Limit">Enable Word Limit</small>
                        </label>
                    </div>
                    <div id="word_limit_controls" class="flex-container flexFlowColumn gap10" style="display: none;">
                        <div class="flex-container flexnowrap gap10">
                            <div class="flex1">
                                <label for="word_limit_min">
                                    <span data-i18n="Minimum Words">Minimum Words</span>
                                </label>
                                <input type="number" id="word_limit_min" name="word_limit_min" class="text_pole" min="1" max="1000" value="10" form="form_create">
                            </div>
                            <div class="flex1">
                                <label for="word_limit_max">
                                    <span data-i18n="Maximum Words">Maximum Words</span>
                                </label>
                                <input type="number" id="word_limit_max" name="word_limit_max" class="text_pole" min="1" max="2000" value="100" form="form_create">
                            </div>
                        </div>
                        <div class="flex-container flexnowrap gap10">
                            <div class="flex1">
                                <label for="word_limit_strict_mode">
                                    <span data-i18n="Strict Mode">Strict Mode</span>
                                    <small data-i18n="(Enforce limits strictly)">(Enforce limits strictly)</small>
                                </label>
                                <input type="checkbox" id="word_limit_strict_mode" name="word_limit_strict_mode" form="form_create">
                            </div>
                            <div class="flex1">
                                <label for="word_limit_auto_trim">
                                    <span data-i18n="Auto Trim">Auto Trim</span>
                                    <small data-i18n="(Automatically trim excess words)">(Automatically trim excess words)</small>
                                </label>
                                <input type="checkbox" id="word_limit_auto_trim" name="word_limit_auto_trim" form="form_create" checked>
                            </div>
                        </div>
                        <div class="flex-container flexFlowColumn gap5">
                            <label for="word_limit_style">
                                <span data-i18n="Response Style">Response Style</span>
                                <small data-i18n="(How to handle word limits)">(How to handle word limits)</small>
                            </label>
                            <select id="word_limit_style" name="word_limit_style" class="text_pole" form="form_create">
                                <option value="natural" data-i18n="Natural (let AI decide)">Natural (let AI decide)</option>
                                <option value="concise" data-i18n="Concise (prefer shorter responses)">Concise (prefer shorter responses)</option>
                                <option value="detailed" data-i18n="Detailed (prefer longer responses)">Detailed (prefer longer responses)</option>
                            </select>
                        </div>
                        <div class="flex-container flexFlowColumn gap5">
                            <label for="word_limit_instructions">
                                <span data-i18n="Custom Instructions">Custom Instructions</span>
                                <small data-i18n="(Additional instructions for word limit behavior)">(Additional instructions for word limit behavior)</small>
                            </label>
                            <textarea id="word_limit_instructions" name="word_limit_instructions" class="text_pole" rows="2" form="form_create" data-i18n="[placeholder]Optional: Add specific instructions for how the character should handle word limits..." placeholder="Optional: Add specific instructions for how the character should handle word limits..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Find the character popup and add the UI
    const characterPopup = document.getElementById('character_popup');
    if (characterPopup) {
        // Insert before the save button
        const saveButton = characterPopup.querySelector('#character_popup_ok');
        if (saveButton) {
            saveButton.insertAdjacentHTML('beforebegin', wordLimitHTML);
        }
    }

    // Add event listeners
    setupWordLimitEventListeners();
}

/**
 * Setup event listeners for word limit controls
 */
function setupWordLimitEventListeners() {
    // Enable/disable toggle
    const enabledCheckbox = document.getElementById('word_limit_enabled');
    const controlsDiv = document.getElementById('word_limit_controls');

    if (enabledCheckbox && controlsDiv) {
        enabledCheckbox.addEventListener('change', function () {
            controlsDiv.style.display = this.checked ? 'flex' : 'none';
        });

        // Initialize visibility
        controlsDiv.style.display = enabledCheckbox.checked ? 'flex' : 'none';
    }
}

/**
 * Hook into SillyTavern's message processing
 */
function hookIntoMessageProcessing() {
    // Override the message processing function if it exists
    if (typeof window !== 'undefined' && window.applyWordLimitIfNeeded) {
        const originalApplyWordLimit = window.applyWordLimitIfNeeded;

        window.applyWordLimitIfNeeded = async function (text, options = {}) {
            // First check for character-specific settings
            const characterSettings = getCharacterWordLimitSettings();
            if (characterSettings && characterSettings.enabled) {
                return { text: applyCharacterWordLimit(text), applied: true, method: 'character_settings' };
            }

            // Fall back to original function
            return await originalApplyWordLimit(text, options);
        };
    }
}

/**
 * Get word limit settings for the current character
 */
function getCharacterWordLimitSettings() {
    try {
        // Get current character ID
        const currentCharId = window.this_chid;
        if (currentCharId === undefined || !window.characters || !window.characters[currentCharId]) {
            return null;
        }

        const character = window.characters[currentCharId];
        if (!character || !character.data?.word_limit_enabled) {
            return null;
        }

        return {
            enabled: character.data.word_limit_enabled,
            min: character.data.word_limit_min || extensionSettings.defaultMinWords,
            max: character.data.word_limit_max || extensionSettings.defaultMaxWords,
            strictMode: character.data.word_limit_strict_mode || extensionSettings.defaultStrictMode,
            autoTrim: character.data.word_limit_auto_trim !== false,
            style: character.data.word_limit_style || extensionSettings.defaultStyle,
            instructions: character.data.word_limit_instructions || ''
        };
    } catch (error) {
        console.warn('Failed to get character word limit settings:', error);
        return null;
    }
}

/**
 * Apply character-specific word limit to text
 */
function applyCharacterWordLimit(text) {
    const settings = getCharacterWordLimitSettings();
    if (!settings || !settings.enabled || !text) {
        return text;
    }

    const words = splitWords(text);
    const wordCount = words.length;

    // Check if response is within limits
    if (wordCount >= settings.min && wordCount <= settings.max) {
        return text;
    }

    // Handle cases where response is too short
    if (wordCount < settings.min) {
        if (settings.strictMode) {
            console.log(`Response too short: ${wordCount} words (minimum: ${settings.min})`);
        }
        return text;
    }

    // Handle cases where response is too long
    if (wordCount > settings.max) {
        if (settings.autoTrim) {
            const trimmedWords = shrinkWordsToLimit(words, settings.max);
            return joinWords(trimmedWords);
        } else if (settings.strictMode) {
            console.log(`Response too long: ${wordCount} words (maximum: ${settings.max})`);
        }
    }

    return text;
}

/**
 * Split text into words
 */
function splitWords(text) {
    if (!text) return [];
    return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Join words back into text
 */
function joinWords(words) {
    return words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Shrink words to fit within limit using intelligent trimming
 */
function shrinkWordsToLimit(words, limit) {
    if (!Array.isArray(words) || words.length <= limit) {
        return words;
    }

    const result = [...words];

    // Remove punctuation first
    removeByPredicate(result, limit, word => isPurePunctuation(word));

    // Remove stopwords
    removeByPredicate(result, limit, word => STOPWORDS.has(normalizeWord(word)));

    // Remove filler words
    removeByPredicate(result, limit, word => FILLER_WORDS.has(normalizeWord(word)));

    // Remove shortest interior words if still over limit
    if (result.length > limit) {
        removeShortestInteriorWords(result, limit);
    }

    // Final fallback: truncate
    if (result.length > limit) {
        return result.slice(0, limit);
    }

    return result;
}

/**
 * Remove words by predicate until under limit
 */
function removeByPredicate(words, limit, predicate) {
    if (words.length <= limit) return;

    for (let i = words.length - 1; i >= 0 && words.length > limit; i--) {
        if (predicate(words[i])) {
            words.splice(i, 1);
        }
    }
}

/**
 * Remove shortest interior words
 */
function removeShortestInteriorWords(words, limit) {
    const candidates = words
        .map((word, index) => ({ index, word, normalized: normalizeWord(word) }))
        .filter(item => item.index !== 0 && item.index !== words.length - 1);

    candidates.sort((a, b) => {
        const lengthA = a.normalized.length || 1000;
        const lengthB = b.normalized.length || 1000;
        if (lengthA !== lengthB) return lengthA - lengthB;
        return a.index - b.index;
    });

    for (const candidate of candidates) {
        if (words.length <= limit) break;

        words.splice(candidate.index, 1);
        for (const other of candidates) {
            if (other.index > candidate.index) {
                other.index--;
            }
        }
    }
}

/**
 * Check if word is pure punctuation
 */
function isPurePunctuation(word) {
    return !normalizeWord(word);
}

/**
 * Normalize word for comparison
 */
function normalizeWord(word) {
    if (typeof word !== 'string') return '';
    return word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
}

/**
 * Register extension settings with SillyTavern
 */
function registerExtensionSettings() {
    try {
        if (typeof extension_settings !== 'undefined') {
            extension_settings.word_limit_extension = extensionSettings;
        }
    } catch (error) {
        console.warn('Failed to register extension settings:', error);
    }
}

// Initialize the extension when the script loads
if (typeof window !== 'undefined') {
    // Wait for SillyTavern to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        initializeExtension();
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeExtension,
        getCharacterWordLimitSettings,
        applyCharacterWordLimit,
        splitWords,
        joinWords,
        shrinkWordsToLimit
    };
}
