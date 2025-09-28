# Advanced Word Limit Control Extension

A powerful SillyTavern extension that provides advanced word limit controls for character responses with per-character settings, intelligent auto-trimming, and custom instructions.

## Features

- **Per-Character Settings**: Each character can have its own word limit configuration
- **Intelligent Auto-Trimming**: Automatically trims excess words using smart algorithms
- **Multiple Response Styles**: Natural, Concise, and Detailed response modes
- **Custom Instructions**: Add character-specific word limit behavior instructions
- **Strict Mode**: Enforce word limits strictly when enabled
- **Flexible Configuration**: Set minimum and maximum word counts per character
- **Real-time Processing**: Word limits are applied during message generation

## Installation

### **Method 1: Direct GitHub Installation (Recommended)**

1. **Open SillyTavern**
2. **Go to Extensions → Manage Extensions**
3. **Click "Add Extension" or "Install Extension"**
4. **Enter the GitHub URL**: `https://github.com/0bl1terate3/wordlimit`
5. **Click "Install"**
6. **Enable the Extension**: Toggle it ON in your extensions list

### **Method 2: Manual Installation**

1. **Download the Extension**:
   - Go to [https://github.com/0bl1terate3/wordlimit](https://github.com/0bl1terate3/wordlimit)
   - Click "Code" → "Download ZIP"
   - Extract the files to your SillyTavern extensions directory

2. **Restart SillyTavern**:
   - Close SillyTavern completely
   - Reopen SillyTavern
   - The extension should appear in your extensions list

3. **Enable the Extension**:
   - Go to Extensions → Manage Extensions
   - Find "Advanced Word Limit Control"
   - Toggle it ON to enable it

## Quick Start

1. **Install the extension** using Method 1 above
2. **Select a character** in SillyTavern
3. **Click "Advanced Definitions"**
4. **Scroll to "Word Limit Settings"**
5. **Enable "Enable Word Limit"**
6. **Set minimum/maximum word counts**
7. **Click "Save"**
8. **Start chatting** - responses will be automatically limited!

## Usage

### Setting Up Word Limits for a Character

1. **Open Character Editor**:
   - Select a character
   - Click "Advanced Definitions"

2. **Configure Word Limit Settings**:
   - Scroll down to find "Word Limit Settings"
   - Enable "Enable Word Limit" checkbox
   - Set your desired minimum and maximum word counts
   - Choose response style (Natural, Concise, or Detailed)
   - Add custom instructions if needed
   - Enable/disable strict mode and auto-trimming

3. **Save Settings**:
   - Click "Save" to apply the settings to the character

### Configuration Options

- **Enable Word Limit**: Master toggle for word limiting
- **Minimum Words**: Minimum number of words for responses
- **Maximum Words**: Maximum number of words for responses
- **Strict Mode**: Enforce limits strictly (may regenerate responses)
- **Auto Trim**: Automatically trim excess words using smart algorithms
- **Response Style**: How the AI should handle word limits
  - **Natural**: Let the AI decide naturally
  - **Concise**: Prefer shorter, more concise responses
  - **Detailed**: Prefer longer, more detailed responses
- **Custom Instructions**: Additional instructions for character-specific behavior

## How It Works

### Intelligent Word Trimming

The extension uses sophisticated algorithms to trim excess words while maintaining readability:

1. **Punctuation Removal**: Removes unnecessary punctuation first
2. **Stopword Filtering**: Removes common stopwords (a, an, the, etc.)
3. **Filler Word Removal**: Removes filler words (literally, actually, etc.)
4. **Smart Word Selection**: Removes shortest interior words while preserving sentence structure
5. **Final Truncation**: As a last resort, truncates to the exact limit

### Character-Specific Processing

- Each character can have unique word limit settings
- Settings are stored with character data
- Word limits are applied during message generation
- Fallback to global settings if character settings are not configured

## Technical Details

### File Structure

```
word-limit-extension/
├── manifest.json          # Extension metadata
├── index.js              # Main extension logic
├── styles.css            # Extension styling
└── README.md            # This file
```

### Dependencies

- SillyTavern 1.10.0 or higher
- Modern web browser with JavaScript support

### Browser Compatibility

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Configuration

### Extension Settings

The extension can be configured through SillyTavern's extension settings:

```javascript
{
    enabled: true,
    defaultMinWords: 10,
    defaultMaxWords: 100,
    defaultStrictMode: false,
    defaultAutoTrim: true,
    defaultStyle: 'natural'
}
```

### Character Settings

Each character stores its word limit settings in the character data:

```javascript
{
    word_limit_enabled: true,
    word_limit_min: 10,
    word_limit_max: 100,
    word_limit_strict_mode: false,
    word_limit_auto_trim: true,
    word_limit_style: 'natural',
    word_limit_instructions: 'Keep responses concise and to the point.'
}
```

## Troubleshooting

### Common Issues

1. **Extension Not Loading**:
   - Check that SillyTavern version is 1.10.0 or higher
   - Verify the extension is properly installed
   - Check browser console for errors

2. **Word Limits Not Working**:
   - Ensure the extension is enabled
   - Check that character has word limits enabled
   - Verify minimum/maximum word counts are set correctly

3. **UI Not Appearing**:
   - Clear browser cache and reload
   - Check that the extension files are properly installed
   - Verify JavaScript is enabled in your browser

### Debug Mode

Enable debug logging by opening browser console and looking for messages prefixed with "Advanced Word Limit Control".

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This extension is licensed under the MIT License. See LICENSE file for details.

## Support

For support, feature requests, or bug reports:

- Create an issue on GitHub
- Join the SillyTavern Discord community
- Check the SillyTavern documentation

## Changelog

### Version 1.0.0
- Initial release
- Per-character word limit settings
- Intelligent auto-trimming
- Multiple response styles
- Custom instructions support
- Strict mode enforcement
- Real-time processing integration

## Acknowledgments

- SillyTavern development team
- Community contributors
- Extension framework developers
