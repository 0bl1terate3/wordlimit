import { chat, eventSource, event_types, messageFormatting, saveChatConditional, saveSettingsDebounced, substituteParams } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';

/**
 * Advanced Word Limit Control Extension for SillyTavern
 * Provides per-character word limit settings with advanced controls
 */

const log = (...msg) => console.log('[WordLimit]', ...msg);

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

// Extension settings
let settings;
if (!extension_settings.wordLimitControl) {
    extension_settings.wordLimitControl = {
        enabled: true,
        defaultMinWords: 10,
        defaultMaxWords: 100,
        defaultStrictMode: false,
        defaultAutoTrim: true,
        defaultStyle: 'natural'
    };
}
settings = extension_settings.wordLimitControl;

/**
 * Initialize the extension
 */
function initializeExtension() {
    log('Advanced Word Limit Control initialized');

    // Add UI to character popup
    addWordLimitUI();

    // Hook into message processing
    hookIntoMessageProcessing();
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

    // Hook into character popup opening to load settings
    hookIntoCharacterPopupOpening();
}

/**
 * Hook into character popup opening to load word limit settings
 */
function hookIntoCharacterPopupOpening() {
    // Use event delegation to catch when character popup opens
    document.addEventListener('click', function (event) {
        // Check if character popup is being opened
        if (event.target && event.target.id === 'character_popup_ok') {
            // Character popup is being closed, load settings
            setTimeout(loadWordLimitSettings, 100);
        }
    });

    // Also listen for when the popup becomes visible
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const popup = document.getElementById('character_popup');
                if (popup && popup.style.display !== 'none') {
                    // Character popup is open, load settings
                    setTimeout(loadWordLimitSettings, 100);
                }
            }
        });
    });

    const characterPopup = document.getElementById('character_popup');
    if (characterPopup) {
        observer.observe(characterPopup, { attributes: true, attributeFilter: ['style'] });
    }
}

/**
 * Load word limit settings from character data
 */
function loadWordLimitSettings() {
    try {
        if (typeof this_chid === 'undefined' || !window.characters || !window.characters[this_chid]) {
            log('No active character to load settings from');
            return;
        }

        const character = window.characters[this_chid];
        if (!character.data) {
            log('No character data to load settings from');
            return;
        }

        // Load settings into form
        const enabledCheckbox = document.getElementById('word_limit_enabled');
        const minInput = document.getElementById('word_limit_min');
        const maxInput = document.getElementById('word_limit_max');
        const strictCheckbox = document.getElementById('word_limit_strict_mode');
        const autoTrimCheckbox = document.getElementById('word_limit_auto_trim');
        const styleSelect = document.getElementById('word_limit_style');
        const instructionsTextarea = document.getElementById('word_limit_instructions');

        if (enabledCheckbox) {
            enabledCheckbox.checked = character.data.word_limit_enabled || false;
            // Trigger change event to show/hide controls
            enabledCheckbox.dispatchEvent(new Event('change'));
        }
        if (minInput) {
            minInput.value = character.data.word_limit_min || 10;
        }
        if (maxInput) {
            maxInput.value = character.data.word_limit_max || 100;
        }
        if (strictCheckbox) {
            strictCheckbox.checked = character.data.word_limit_strict_mode || false;
        }
        if (autoTrimCheckbox) {
            autoTrimCheckbox.checked = character.data.word_limit_auto_trim !== false;
        }
        if (styleSelect) {
            styleSelect.value = character.data.word_limit_style || 'natural';
        }
        if (instructionsTextarea) {
            instructionsTextarea.value = character.data.word_limit_instructions || '';
        }

        log('Word limit settings loaded from character data');
    } catch (error) {
        console.warn('Failed to load word limit settings:', error);
    }
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
    // The word limit functionality is already integrated in SillyTavern
    // We just need to ensure our character settings are properly saved
    log('Word limit functionality is already integrated in SillyTavern');

    // Hook into character save process to ensure our settings are saved
    hookIntoCharacterSave();
}

/**
 * Hook into character save process to save word limit settings
 */
function hookIntoCharacterSave() {
    // Wait for the character popup to be ready
    const characterPopup = document.getElementById('character_popup');
    if (!characterPopup) {
        // Retry after a short delay
        setTimeout(hookIntoCharacterSave, 1000);
        return;
    }

    // Hook into the character save button
    const saveButton = document.getElementById('character_popup_ok');
    if (saveButton) {
        const originalClick = saveButton.onclick;
        saveButton.onclick = function (event) {
            // Save our word limit settings before the character is saved
            saveWordLimitSettings();

            // Call the original save function
            if (originalClick) {
                originalClick.call(this, event);
            }
        };
        log('Hooked into character save process');
    }
}

/**
 * Save word limit settings to character data
 */
function saveWordLimitSettings() {
    try {
        if (typeof this_chid === 'undefined' || !window.characters || !window.characters[this_chid]) {
            log('No active character to save settings to');
            return;
        }

        const character = window.characters[this_chid];
        if (!character.data) {
            character.data = {};
        }

        // Get form values
        const enabledCheckbox = document.getElementById('word_limit_enabled');
        const minInput = document.getElementById('word_limit_min');
        const maxInput = document.getElementById('word_limit_max');
        const strictCheckbox = document.getElementById('word_limit_strict_mode');
        const autoTrimCheckbox = document.getElementById('word_limit_auto_trim');
        const styleSelect = document.getElementById('word_limit_style');
        const instructionsTextarea = document.getElementById('word_limit_instructions');

        // Save settings to character data
        if (enabledCheckbox) {
            character.data.word_limit_enabled = enabledCheckbox.checked;
        }
        if (minInput) {
            character.data.word_limit_min = parseInt(minInput.value) || 10;
        }
        if (maxInput) {
            character.data.word_limit_max = parseInt(maxInput.value) || 100;
        }
        if (strictCheckbox) {
            character.data.word_limit_strict_mode = strictCheckbox.checked;
        }
        if (autoTrimCheckbox) {
            character.data.word_limit_auto_trim = autoTrimCheckbox.checked;
        }
        if (styleSelect) {
            character.data.word_limit_style = styleSelect.value || 'natural';
        }
        if (instructionsTextarea) {
            character.data.word_limit_instructions = instructionsTextarea.value || '';
        }

        log('Word limit settings saved to character data');
    } catch (error) {
        console.warn('Failed to save word limit settings:', error);
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
            min: character.data.word_limit_min || settings.defaultMinWords,
            max: character.data.word_limit_max || settings.defaultMaxWords,
            strictMode: character.data.word_limit_strict_mode || settings.defaultStrictMode,
            autoTrim: character.data.word_limit_auto_trim !== false,
            style: character.data.word_limit_style || settings.defaultStyle,
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

// Initialize the extension when SillyTavern is ready
eventSource.on(event_types.APP_READY, () => {
    const addSettings = () => {
        const html = `
        <div class="word-limit-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Advanced Word Limit Control</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content" style="font-size:small;">
                    <label class="flex-container">
                        <input type="checkbox" id="word_limit_global_enabled"> <span>Enable Word Limit Control</span>
                    </label>
                    <div class="flex-container flexnowrap gap10">
                        <div class="flex1">
                            <label for="word_limit_default_min">
                                <span>Default Minimum Words</span>
                            </label>
                            <input type="number" id="word_limit_default_min" class="text_pole" min="1" max="1000" value="10">
                        </div>
                        <div class="flex1">
                            <label for="word_limit_default_max">
                                <span>Default Maximum Words</span>
                            </label>
                            <input type="number" id="word_limit_default_max" class="text_pole" min="1" max="2000" value="100">
                        </div>
                    </div>
                    <label class="flex-container">
                        <input type="checkbox" id="word_limit_default_strict"> <span>Default Strict Mode</span>
                    </label>
                    <label class="flex-container">
                        <input type="checkbox" id="word_limit_default_auto_trim" checked> <span>Default Auto Trim</span>
                    </label>
                    <div class="flex-container flexFlowColumn gap5">
                        <label for="word_limit_default_style">
                            <span>Default Response Style</span>
                        </label>
                        <select id="word_limit_default_style" class="text_pole">
                            <option value="natural">Natural (let AI decide)</option>
                            <option value="concise">Concise (prefer shorter responses)</option>
                            <option value="detailed">Detailed (prefer longer responses)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        `;
        $('#extensions_settings').append(html);

        // Initialize settings
        const enabledCheckbox = document.querySelector('#word_limit_global_enabled');
        const minInput = document.querySelector('#word_limit_default_min');
        const maxInput = document.querySelector('#word_limit_default_max');
        const strictCheckbox = document.querySelector('#word_limit_default_strict');
        const autoTrimCheckbox = document.querySelector('#word_limit_default_auto_trim');
        const styleSelect = document.querySelector('#word_limit_default_style');

        if (enabledCheckbox) enabledCheckbox.checked = settings.enabled ?? true;
        if (minInput) minInput.value = settings.defaultMinWords ?? 10;
        if (maxInput) maxInput.value = settings.defaultMaxWords ?? 100;
        if (strictCheckbox) strictCheckbox.checked = settings.defaultStrictMode ?? false;
        if (autoTrimCheckbox) autoTrimCheckbox.checked = settings.defaultAutoTrim ?? true;
        if (styleSelect) styleSelect.value = settings.defaultStyle ?? 'natural';

        // Add event listeners
        if (enabledCheckbox) {
            enabledCheckbox.addEventListener('change', (e) => {
                settings.enabled = e.target?.checked ?? false;
                saveSettingsDebounced();
            });
        }

        if (minInput) {
            minInput.addEventListener('change', (e) => {
                settings.defaultMinWords = parseInt(e.target?.value ?? '10');
                saveSettingsDebounced();
            });
        }

        if (maxInput) {
            maxInput.addEventListener('change', (e) => {
                settings.defaultMaxWords = parseInt(e.target?.value ?? '100');
                saveSettingsDebounced();
            });
        }

        if (strictCheckbox) {
            strictCheckbox.addEventListener('change', (e) => {
                settings.defaultStrictMode = e.target?.checked ?? false;
                saveSettingsDebounced();
            });
        }

        if (autoTrimCheckbox) {
            autoTrimCheckbox.addEventListener('change', (e) => {
                settings.defaultAutoTrim = e.target?.checked ?? true;
                saveSettingsDebounced();
            });
        }

        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                settings.defaultStyle = e.target?.value ?? 'natural';
                saveSettingsDebounced();
            });
        }
    };

    addSettings();
    initializeExtension();
});

// Add slash commands
SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'word-limit-apply',
    callback: (args) => {
        const text = args.join(' ');
        if (!text) return 'No text provided';

        const processed = applyCharacterWordLimit(text);
        const originalWords = splitWords(text).length;
        const processedWords = splitWords(processed).length;

        return `Applied word limit: ${originalWords} → ${processedWords} words\nResult: ${processed}`;
    },
    helpString: 'Apply word limit to text. Usage: /word-limit-apply <text>',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'word-limit-status',
    callback: () => {
        const settings = getCharacterWordLimitSettings();
        if (!settings) {
            return 'No word limit settings found for current character';
        }

        return `Word Limit Status:
- Enabled: ${settings.enabled}
- Min Words: ${settings.min}
- Max Words: ${settings.max}
- Strict Mode: ${settings.strictMode}
- Auto Trim: ${settings.autoTrim}
- Style: ${settings.style}`;
    },
    helpString: 'Show current word limit settings for the character',
}));

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
