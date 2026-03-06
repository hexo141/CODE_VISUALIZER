class CodeVisualizer {
    constructor() {
        this.codeContent = '';
        this.displayedCode = '';
        this.currentIndex = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.typingSpeed = 30;
        this.thinkTime = 500;
        this.cameraShake = false;
        this.showLineNumbers = true;
        this.syntaxHighlight = true;
        this.timer = null;
        
        this.initElements();
        this.initEventListeners();
        this.updateSettings();
    }

    initElements() {
        this.elements = {
            codeFile: document.getElementById('codeFile'),
            typingSpeed: document.getElementById('typingSpeed'),
            thinkTime: document.getElementById('thinkTime'),
            cameraShake: document.getElementById('cameraShake'),
            showLineNumbers: document.getElementById('showLineNumbers'),
            syntaxHighlight: document.getElementById('syntaxHighlight'),
            speedValue: document.getElementById('speedValue'),
            thinkValue: document.getElementById('thinkValue'),
            fileInfo: document.getElementById('fileInfo'),
            progressInfo: document.getElementById('progressInfo'),
            editorContainer: document.getElementById('editorContainer'),
            lineNumbers: document.getElementById('lineNumbers'),
            codeDisplay: document.getElementById('codeDisplay'),
            codeContent: document.getElementById('codeContent'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn')
        };
    }

    initEventListeners() {
        this.elements.codeFile.addEventListener('change', (e) => this.loadFile(e));
        this.elements.typingSpeed.addEventListener('input', () => this.updateSettings());
        this.elements.thinkTime.addEventListener('input', () => this.updateSettings());
        this.elements.cameraShake.addEventListener('change', () => this.updateSettings());
        this.elements.showLineNumbers.addEventListener('change', () => this.updateSettings());
        this.elements.syntaxHighlight.addEventListener('change', () => this.updateSettings());
        
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
    }

    updateSettings() {
        this.typingSpeed = parseInt(this.elements.typingSpeed.value);
        this.thinkTime = parseInt(this.elements.thinkTime.value);
        this.cameraShake = this.elements.cameraShake.checked;
        this.showLineNumbers = this.elements.showLineNumbers.checked;
        this.syntaxHighlight = this.elements.syntaxHighlight.checked;
        
        this.elements.speedValue.textContent = this.typingSpeed;
        this.elements.thinkValue.textContent = this.thinkTime;
        
        this.elements.lineNumbers.classList.toggle('hidden', !this.showLineNumbers);
        
        if (this.displayedCode) {
            this.updateDisplay();
        }
    }

    loadFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.codeContent = e.target.result;
            this.elements.fileInfo.textContent = `📄 ${file.name} (${this.codeContent.length} 字符)`;
            this.elements.progressInfo.textContent = 'READY';
            this.reset();
        };
        reader.readAsText(file);
    }

    start() {
        if (!this.codeContent) {
            alert('请先选择代码文件！');
            return;
        }
        
        if (this.isRunning && !this.isPaused) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        this.elements.progressInfo.textContent = '▶ 运行中...';
        
        this.typeNextChar();
    }

    togglePause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            clearTimeout(this.timer);
            this.elements.progressInfo.textContent = '⏸ 已暂停';
            this.elements.pauseBtn.textContent = '▶ 继续';
        } else {
            this.elements.progressInfo.textContent = '▶ 运行中...';
            this.elements.pauseBtn.textContent = '⏸ 暂停';
            this.typeNextChar();
        }
    }

    reset() {
        clearTimeout(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.displayedCode = '';
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.pauseBtn.textContent = '⏸ 暂停';
        this.elements.progressInfo.textContent = 'READY';
        
        this.updateDisplay();
    }

    typeNextChar() {
        if (this.currentIndex >= this.codeContent.length) {
            this.complete();
            return;
        }
        
        if (this.isPaused) return;
        
        const char = this.codeContent[this.currentIndex];
        this.displayedCode += char;
        this.currentIndex++;
        
        this.updateDisplay();
        this.triggerCameraShake();
        
        const delay = 1000 / this.typingSpeed;
        
        if (char === '\n' || this.currentIndex % 50 === 0) {
            this.timer = setTimeout(() => this.typeNextChar(), delay + this.thinkTime);
        } else {
            this.timer = setTimeout(() => this.typeNextChar(), delay);
        }
    }

    updateDisplay() {
        this.elements.codeContent.textContent = this.displayedCode;
        
        if (this.syntaxHighlight) {
            this.elements.codeContent.innerHTML = this.highlightSyntax(this.displayedCode);
        }
        
        this.updateLineNumbers();
    }

    updateLineNumbers() {
        if (!this.showLineNumbers) return;
        
        const lines = this.displayedCode.split('\n');
        const lineCount = lines.length;
        
        this.elements.lineNumbers.innerHTML = Array.from(
            { length: lineCount },
            (_, i) => `<div>${i + 1}</div>`
        ).join('');
    }

    highlightSyntax(code) {
        let highlighted = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        const patterns = [
            { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|from|export|default|async|await|try|catch|throw|new|this|super|extends|static|public|private|protected|void|int|float|double|char|bool|string|true|false|null|undefined|None|def|print|import|as|with|lambda|yield|global|nonlocal|pass|break|continue|in|and|or|not|is|elif|else|except|finally|raise|assert|del|exec|eval|compile|__name__|__main__|self|cls)\b/g, class: 'syntax-keyword' },
            { regex: /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, class: 'syntax-string' },
            { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, class: 'syntax-comment' },
            { regex: /\b(\d+\.?\d*)\b/g, class: 'syntax-number' },
            { regex: /\b([a-zA-Z_]\w*)\s*(?=\()/g, class: 'syntax-function' },
            { regex: /(\+|-|\*|\/|%|=|==|!=|<=|>=|<|>|&&|\|\||!|~|\^|&|\||<<|>>)/g, class: 'syntax-operator' }
        ];
        
        const tokens = [];
        let tokenIndex = 0;
        
        patterns.forEach(pattern => {
            highlighted = highlighted.replace(pattern.regex, (match) => {
                const token = `__TOKEN_${tokenIndex}__`;
                tokens.push({ token, html: `<span class="${pattern.class}">${match}</span>` });
                tokenIndex++;
                return token;
            });
        });
        
        tokens.forEach(({ token, html }) => {
            highlighted = highlighted.replace(token, html);
        });
        
        return highlighted;
    }

    triggerCameraShake() {
        if (!this.cameraShake) return;
        
        if (Math.random() > 0.3) return;
        
        this.elements.editorContainer.classList.add('shaking');
        
        setTimeout(() => {
            this.elements.editorContainer.classList.remove('shaking');
        }, 500);
    }

    complete() {
        this.isRunning = false;
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.pauseBtn.textContent = '⏸ 暂停';
        this.elements.progressInfo.textContent = '✅ 完成';
        
        if (this.cameraShake) {
            this.elements.editorContainer.classList.add('shaking');
            setTimeout(() => {
                this.elements.editorContainer.classList.remove('shaking');
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new CodeVisualizer();
});