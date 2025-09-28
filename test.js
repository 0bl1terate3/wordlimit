/**
 * Test file for Advanced Word Limit Control Extension
 * Run this in a browser console or Node.js environment
 */

// Mock SillyTavern environment for testing
const mockEnvironment = {
    characters: [
        {
            data: {
                word_limit_enabled: true,
                word_limit_min: 10,
                word_limit_max: 50,
                word_limit_strict_mode: false,
                word_limit_auto_trim: true,
                word_limit_style: 'natural',
                word_limit_instructions: 'Keep responses concise.'
            }
        }
    ],
    this_chid: 0,
    extension_settings: {
        word_limit_extension: {
            enabled: true,
            defaultMinWords: 10,
            defaultMaxWords: 100,
            defaultStrictMode: false,
            defaultAutoTrim: true,
            defaultStyle: 'natural'
        }
    }
};

// Test functions
function testSplitWords() {
    console.log('Testing splitWords function...');

    const testCases = [
        'Hello world',
        'This is a test sentence with multiple words.',
        '   Extra   spaces   between   words   ',
        '',
        'Single'
    ];

    testCases.forEach((text, index) => {
        const words = splitWords(text);
        console.log(`Test ${index + 1}: "${text}" -> [${words.join(', ')}] (${words.length} words)`);
    });
}

function testJoinWords() {
    console.log('Testing joinWords function...');

    const testCases = [
        ['Hello', 'world'],
        ['This', 'is', 'a', 'test'],
        ['', 'word', ''],
        ['Single'],
        []
    ];

    testCases.forEach((words, index) => {
        const text = joinWords(words);
        console.log(`Test ${index + 1}: [${words.join(', ')}] -> "${text}"`);
    });
}

function testShrinkWordsToLimit() {
    console.log('Testing shrinkWordsToLimit function...');

    const longText = 'This is a very long sentence that contains many words and should be trimmed down to fit within the specified limit of words.';
    const words = splitWords(longText);
    const limit = 10;

    console.log(`Original: ${words.length} words`);
    console.log(`Text: "${longText}"`);

    const trimmed = shrinkWordsToLimit(words, limit);
    const result = joinWords(trimmed);

    console.log(`Trimmed: ${trimmed.length} words`);
    console.log(`Result: "${result}"`);
}

function testCharacterSettings() {
    console.log('Testing character settings...');

    // Mock the global environment
    global.characters = mockEnvironment.characters;
    global.this_chid = mockEnvironment.this_chid;

    const settings = getCharacterWordLimitSettings();
    console.log('Character settings:', settings);

    if (settings) {
        const testText = 'This is a very long response that should be trimmed because it exceeds the maximum word limit that was set for this character.';
        const processed = applyCharacterWordLimit(testText);

        console.log(`Original: "${testText}"`);
        console.log(`Processed: "${processed}"`);
        console.log(`Word count: ${splitWords(processed).length}`);
    }
}

function testWordLimitApplication() {
    console.log('Testing word limit application...');

    const testCases = [
        {
            text: 'Short response.',
            expected: 'Short response.'
        },
        {
            text: 'This is a medium length response that should be fine.',
            expected: 'This is a medium length response that should be fine.'
        },
        {
            text: 'This is a very long response that contains many words and should definitely be trimmed down to fit within the specified word limit because it exceeds the maximum allowed number of words for this character.',
            expected: 'This is a very long response that contains many words and should definitely be trimmed down to fit within the specified word limit because it exceeds the maximum allowed number of words for this character.'
        }
    ];

    testCases.forEach((testCase, index) => {
        const originalWords = splitWords(testCase.text);
        const processed = applyCharacterWordLimit(testCase.text);
        const processedWords = splitWords(processed);

        console.log(`Test ${index + 1}:`);
        console.log(`  Original: ${originalWords.length} words`);
        console.log(`  Processed: ${processedWords.length} words`);
        console.log(`  Text: "${processed}"`);
        console.log('');
    });
}

// Run all tests
function runAllTests() {
    console.log('=== Advanced Word Limit Control Extension Tests ===\n');

    testSplitWords();
    console.log('');

    testJoinWords();
    console.log('');

    testShrinkWordsToLimit();
    console.log('');

    testCharacterSettings();
    console.log('');

    testWordLimitApplication();
    console.log('');

    console.log('=== All tests completed ===');
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testSplitWords,
        testJoinWords,
        testShrinkWordsToLimit,
        testCharacterSettings,
        testWordLimitApplication
    };
}

// Auto-run tests in browser
if (typeof window !== 'undefined') {
    console.log('Running tests automatically in browser...');
    runAllTests();
}
