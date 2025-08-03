// Enhanced Sinhala Unicode Converter
class SinhalaConverter {
    constructor() {
        this.apiUrl = "https://easysinhalaunicode.com/Api/convert";
        this.isConverting = false;
        this.debounceTimer = null;
        this.debounceDelay = 500; // ms
        
        this.initializeElements();
        this.bindEvents();
        this.initializeConverter();
    }

    initializeElements() {
        // Input/Output elements
        this.inputText = document.getElementById('input-text');
        this.outputText = document.getElementById('output-text');
        
        // Control elements
        this.convertBtn = document.getElementById('convert-btn');
        this.autoConvertCheckbox = document.getElementById('auto-convert');
        this.clearInputBtn = document.getElementById('clear-input');
        this.pasteBtn = document.getElementById('paste-btn');
        this.copyOutputBtn = document.getElementById('copy-output');
        this.selectAllBtn = document.getElementById('select-all');
        
        // Status elements
        this.charCount = document.getElementById('char-count');
        this.statusIndicator = document.getElementById('status-indicator');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.notification = document.getElementById('notification');
        this.notificationText = this.notification.querySelector('.notification-text');
        this.notificationClose = this.notification.querySelector('.notification-close');
    }

    bindEvents() {
        // Input events
        this.inputText.addEventListener('input', () => this.handleInput());
        this.inputText.addEventListener('paste', () => {
            setTimeout(() => this.handleInput(), 10);
        });

        // Button events
        this.convertBtn.addEventListener('click', () => this.convertText());
        this.clearInputBtn.addEventListener('click', () => this.clearInput());
        this.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.copyOutputBtn.addEventListener('click', () => this.copyToClipboard());
        this.selectAllBtn.addEventListener('click', () => this.selectAllOutput());
        
        // Settings
        this.autoConvertCheckbox.addEventListener('change', () => this.handleAutoConvertToggle());
        
        // Notification
        this.notificationClose.addEventListener('click', () => this.hideNotification());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Prevent form submission if Enter is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.convertText();
            }
        });
    }

    initializeConverter() {
        this.updateCharCount();
        this.updateStatus('ready', 'Ready');
        
        // Convert initial text if present
        if (this.inputText.value.trim()) {
            this.convertText();
        }
    }

    handleInput() {
        this.updateCharCount();
        
        if (this.autoConvertCheckbox.checked) {
            this.debouncedConvert();
        } else {
            this.updateStatus('ready', 'Ready to convert');
        }
    }

    debouncedConvert() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (this.inputText.value.trim()) {
                this.convertText();
            } else {
                this.outputText.value = '';
                this.updateStatus('ready', 'Ready');
            }
        }, this.debounceDelay);
    }

    async convertText() {
        const inputValue = this.inputText.value.trim();
        
        if (!inputValue) {
            this.showNotification('Please enter some text to convert', 'warning');
            return;
        }

        if (this.isConverting) {
            return; // Prevent multiple simultaneous requests
        }

        this.isConverting = true;
        this.showLoading(true);
        this.updateStatus('converting', 'Converting...');
        this.convertBtn.disabled = true;

        try {
            const result = await this.callAPI(inputValue);
            this.outputText.value = result;
            this.updateStatus('success', 'Converted successfully');
            
            // Auto-copy if text is short
            if (result.length < 100) {
                setTimeout(() => {
                    this.copyToClipboard(true); // Silent copy
                }, 500);
            }
            
        } catch (error) {
            console.error('Conversion error:', error);
            this.updateStatus('error', 'Conversion failed');
            this.showNotification('Failed to convert text. Please try again.', 'error');
            this.outputText.value = '';
        } finally {
            this.isConverting = false;
            this.showLoading(false);
            this.convertBtn.disabled = false;
        }
    }

    callAPI(text) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.apiUrl,
                method: "POST",
                data: { data: text },
                timeout: 10000, // 10 second timeout
                success: (response) => {
                    if (response && typeof response === 'string') {
                        resolve(response);
                    } else {
                        reject(new Error('Invalid response format'));
                    }
                },
                error: (xhr, status, error) => {
                    if (status === 'timeout') {
                        reject(new Error('Request timed out. Please try again.'));
                    } else {
                        reject(new Error(`API Error: ${error || 'Unknown error'}`));
                    }
                }
            });
        });
    }

    updateCharCount() {
        const count = this.inputText.value.length;
        this.charCount.textContent = count.toLocaleString();
        
        // Visual feedback for long text
        if (count > 1000) {
            this.charCount.style.color = '#ff6b6b';
        } else if (count > 500) {
            this.charCount.style.color = '#ffd700';
        } else {
            this.charCount.style.color = 'rgba(255, 255, 255, 0.7)';
        }
    }

    updateStatus(type, message) {
        this.statusIndicator.className = `status-${type}`;
        this.statusIndicator.textContent = message;
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.add('show');
        } else {
            this.loadingOverlay.classList.remove('show');
        }
    }

    async clearInput() {
        this.inputText.value = '';
        this.outputText.value = '';
        this.updateCharCount();
        this.updateStatus('ready', 'Ready');
        this.inputText.focus();
        this.showNotification('Input cleared', 'success');
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                this.inputText.value = text;
                this.handleInput();
                this.showNotification('Text pasted from clipboard', 'success');
            }
        } catch (error) {
            // Fallback for browsers that don't support clipboard API
            this.inputText.focus();
            this.showNotification('Please use Ctrl+V to paste', 'info');
        }
    }

    async copyToClipboard(silent = false) {
        const outputValue = this.outputText.value.trim();
        
        if (!outputValue) {
            if (!silent) {
                this.showNotification('No text to copy', 'warning');
            }
            return;
        }

        try {
            await navigator.clipboard.writeText(outputValue);
            if (!silent) {
                this.showNotification('Copied to clipboard!', 'success');
            }
            
            // Visual feedback
            this.copyOutputBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                this.copyOutputBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
            
        } catch (error) {
            // Fallback for older browsers
            this.selectAllOutput();
            if (!silent) {
                this.showNotification('Please use Ctrl+C to copy', 'info');
            }
        }
    }

    selectAllOutput() {
        if (this.outputText.value.trim()) {
            this.outputText.select();
            this.outputText.setSelectionRange(0, 99999); // For mobile devices
        }
    }

    handleAutoConvertToggle() {
        const isEnabled = this.autoConvertCheckbox.checked;
        
        if (isEnabled) {
            this.showNotification('Auto-convert enabled', 'info');
            if (this.inputText.value.trim()) {
                this.debouncedConvert();
            }
        } else {
            this.showNotification('Auto-convert disabled', 'info');
            clearTimeout(this.debounceTimer);
        }
        
        // Save preference
        localStorage.setItem('autoConvert', isEnabled);
    }

    handleKeyboardShortcuts(e) {
        // Ctrl+Enter or Cmd+Enter to convert
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.convertText();
        }
        
        // Ctrl+K or Cmd+K to clear
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.clearInput();
        }
        
        // Ctrl+D or Cmd+D to toggle auto-convert
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.autoConvertCheckbox.checked = !this.autoConvertCheckbox.checked;
            this.handleAutoConvertToggle();
        }
        
        // Escape to hide notification
        if (e.key === 'Escape') {
            this.hideNotification();
        }
    }

    showNotification(message, type = 'info') {
        this.notificationText.textContent = message;
        this.notification.className = `notification show ${type}`;
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 4000);
    }

    hideNotification() {
        this.notification.classList.remove('show');
    }

    // Load saved preferences
    loadPreferences() {
        const autoConvert = localStorage.getItem('autoConvert');
        if (autoConvert !== null) {
            this.autoConvertCheckbox.checked = autoConvert === 'true';
        }
    }

    // Utility method to get text statistics
    getTextStats(text) {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const lines = text.split('\n').length;
        
        return {
            characters: text.length,
            words: words.length,
            lines: lines
        };
    }

    // Method to handle focus management for accessibility
    manageFocus() {
        // Ensure proper focus management for screen readers
        this.inputText.setAttribute('aria-describedby', 'char-count');
        this.outputText.setAttribute('aria-describedby', 'status-indicator');
        
        // Add ARIA labels
        this.convertBtn.setAttribute('aria-label', 'Convert text to Sinhala Unicode');
        this.clearInputBtn.setAttribute('aria-label', 'Clear input text');
        this.pasteBtn.setAttribute('aria-label', 'Paste from clipboard');
        this.copyOutputBtn.setAttribute('aria-label', 'Copy converted text');
        this.selectAllBtn.setAttribute('aria-label', 'Select all converted text');
    }

    // Initialize theme handling
    initializeTheme() {
        // Check for system theme preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
        } else if (prefersDark) {
            document.body.setAttribute('data-theme', 'dark');
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    // Method to export/import text
    exportText() {
        const inputValue = this.inputText.value;
        const outputValue = this.outputText.value;
        
        if (!inputValue && !outputValue) {
            this.showNotification('No text to export', 'warning');
            return;
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            input: inputValue,
            output: outputValue,
            stats: this.getTextStats(inputValue)
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sinhala-conversion-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Text exported successfully', 'success');
    }

    // Method to handle file import
    importText(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.input) {
                    this.inputText.value = data.input;
                    this.handleInput();
                    this.showNotification('Text imported successfully', 'success');
                }
            } catch (error) {
                this.showNotification('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Enhanced error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const converter = new SinhalaConverter();
    
    // Load preferences
    converter.loadPreferences();
    
    // Setup accessibility features
    converter.manageFocus();
    
    // Initialize theme
    converter.initializeTheme();
    
    // Make converter globally available for debugging
    window.sinhalaConverter = converter;
    
    // Add service worker registration for PWA capabilities (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, but app still works
        });
    }
    
    // Add performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`App loaded in ${loadTime.toFixed(2)}ms`);
        });
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SinhalaConverter;
}