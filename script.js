/**
 * Code Visualizer - 主脚本
 * 支持高度自定义的代码打字效果可视化
 */

class CodeVisualizer {
    constructor() {
        // 配置选项
        this.config = {
            typingSpeed: 50,        // 打字速度 (ms/字符)
            thinkTime: 500,         // 思考时间 (ms)
            cameraShake: 'none',    // 相机摇晃: none, light, medium, heavy
            showLineNumbers: true,  // 显示行号
            highlightSyntax: true   // 语法高亮
        };

        // 状态
        this.state = {
            isRunning: false,
            currentFile: null,
            codeContent: '',
            currentIndex: 0,
            totalChars: 0
        };

        // DOM 元素
        this.elements = {};

        // 初始化
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        this.updateUI();
    }

    // 缓存 DOM 元素
    cacheElements() {
        this.elements = {
            fileInput: document.getElementById('fileInput'),
            typingSpeed: document.getElementById('typingSpeed'),
            thinkTime: document.getElementById('thinkTime'),
            cameraShake: document.getElementById('cameraShake'),
            showLineNumbers: document.getElementById('showLineNumbers'),
            highlightSyntax: document.getElementById('highlightSyntax'),
            typingSpeedValue: document.getElementById('typingSpeedValue'),
            thinkTimeValue: document.getElementById('thinkTimeValue'),
            status: document.getElementById('status'),
            progressInfo: document.getElementById('progressInfo'),
            startBtn: document.getElementById('startBtn'),
            resetBtn: document.getElementById('resetBtn'),
            codeContent: document.getElementById('codeContent'),
            filename: document.getElementById('filename'),
            lineCount: document.getElementById('lineCount')
        };
    }

    // 绑定事件
    bindEvents() {
        // 文件选择
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 设置变更
        this.elements.typingSpeed.addEventListener('input', (e) => this.updateSetting('typingSpeed', e.target.value));
        this.elements.thinkTime.addEventListener('input', (e) => this.updateSetting('thinkTime', e.target.value));
        this.elements.cameraShake.addEventListener('change', (e) => this.updateSetting('cameraShake', e.target.value));
        this.elements.showLineNumbers.addEventListener('change', (e) => this.updateSetting('showLineNumbers', e.target.checked));
        this.elements.highlightSyntax.addEventListener('change', (e) => this.updateSetting('highlightSyntax', e.target.checked));

        // 按钮
        this.elements.startBtn.addEventListener('click', () => this.startVisualization());
        this.elements.resetBtn.addEventListener('click', () => this.reset());

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.startVisualization();
            }
            if (e.key === 'Escape') {
                this.reset();
            }
        });
    }

    // 加载保存的设置
    loadSettings() {
        const saved = localStorage.getItem('codeVisualizerSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            Object.assign(this.config, settings);
            this.applySettingsToUI();
        }
    }

    // 保存设置
    saveSettings() {
        localStorage.setItem('codeVisualizerSettings', JSON.stringify(this.config));
    }

    // 应用设置到 UI
    applySettingsToUI() {
        this.elements.typingSpeed.value = this.config.typingSpeed;
        this.elements.thinkTime.value = this.config.thinkTime;
        this.elements.cameraShake.value = this.config.cameraShake;
        this.elements.showLineNumbers.checked = this.config.showLineNumbers;
        this.elements.highlightSyntax.checked = this.config.highlightSyntax;
        this.updateUI();
    }

    // 更新设置
    updateSetting(key, value) {
        this.config[key] = key === 'showLineNumbers' || key === 'highlightSyntax' ? 
            Boolean(value) : 
            (key === 'cameraShake' ? value : Number(value));
        
        this.updateUI();
        this.saveSettings();
    }

    // 更新 UI 显示
    updateUI() {
        this.elements.typingSpeedValue.textContent = this.config.typingSpeed;
        this.elements.thinkTimeValue.textContent = this.config.thinkTime;
        
        // 更新相机摇晃类
        document.body.className = '';
        if (this.config.cameraShake !== 'none') {
            document.body.classList.add(`shake-${this.config.cameraShake}`);
        }
    }

    // 处理文件选择
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.state.currentFile = file;
        this.elements.filename.textContent = file.name;
        this.setStatus('READY', 'ready');

        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.codeContent = e.target.result;
            this.state.totalChars = this.state.codeContent.length;
            const lines = this.state.codeContent.split('\n').length;
            this.elements.lineCount.textContent = `${lines} 行`;
            this.elements.codeContent.textContent = '';
        };
        reader.readAsText(file);
    }

    // 设置状态
    setStatus(text, type = 'ready') {
        this.elements.status.textContent = text;
        this.elements.status.className = type;
    }

    // 更新进度信息
    updateProgress() {
        const percent = ((this.state.currentIndex / this.state.totalChars) * 100).toFixed(1);
        this.elements.progressInfo.textContent = `${this.state.currentIndex}/${this.state.totalChars} 字符 (${percent}%)`;
    }

    // 开始可视化
    async startVisualization() {
        if (!this.state.codeContent) {
            this.setStatus('请先选择代码文件', 'error');
            return;
        }

        if (this.state.isRunning) {
            return;
        }

        this.state.isRunning = true;
        this.state.currentIndex = 0;
        this.setStatus('RUNNING', 'running');
        this.elements.startBtn.disabled = true;
        this.elements.codeContent.innerHTML = '';

        // 思考时间延迟
        if (this.config.thinkTime > 0) {
            await this.sleep(this.config.thinkTime);
            this.triggerCameraShake();
        }

        // 开始打字效果
        await this.typeCode();

        this.state.isRunning = false;
        this.setStatus('COMPLETED', 'completed');
        this.elements.startBtn.disabled = false;
    }

    // 打字效果
    async typeCode() {
        const code = this.state.codeContent;
        const contentEl = this.elements.codeContent;
        
        if (this.config.showLineNumbers) {
            contentEl.innerHTML = this.formatWithLineNumbers(code);
        } else {
            contentEl.textContent = '';
        }

        for (let i = 0; i < code.length; i++) {
            if (!this.state.isRunning) break;

            this.state.currentIndex = i + 1;
            this.updateProgress();

            // 添加字符
            if (this.config.showLineNumbers) {
                this.addCharWithLineNumbers(code[i], i);
            } else {
                contentEl.textContent += code[i];
            }

            // 随机思考时间
            if (Math.random() < 0.1 && this.config.thinkTime > 0) {
                await this.sleep(this.config.thinkTime * 0.3);
                this.triggerCameraShake();
            }

            await this.sleep(this.config.typingSpeed);
        }

        // 添加光标
        if (this.state.isRunning) {
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            contentEl.appendChild(cursor);
        }
    }

    // 添加带行号的字符
    addCharWithLineNumbers(char, index) {
        const contentEl = this.elements.codeContent;
        const lines = this.state.codeContent.substring(0, index + 1).split('\n');
        const currentLine = lines.length;
        
        // 简单实现，实际可以优化
        contentEl.textContent = this.state.codeContent.substring(0, index + 1);
    }

    // 格式化带行号的代码
    formatWithLineNumbers(code) {
        const lines = code.split('\n');
        return lines.map((line, i) => {
            const lineNum = i + 1;
            return `<span class="line-number">${lineNum}</span>${this.syntaxHighlight(line)}\n`;
        }).join('');
    }

    // 简单的语法高亮
    syntaxHighlight(code) {
        if (!this.config.highlightSyntax) {
            return this.escapeHtml(code);
        }

        let highlighted = this.escapeHtml(code);

        // 注释
        highlighted = highlighted.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span class="comment">$1</span>');
        
        // 字符串
        highlighted = highlighted.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');
        
        // 关键字
        const keywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'from', 'def', 'print', 'public', 'private', 'static'];
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="keyword">${kw}</span>`);
        });

        // 数字
        highlighted = highlighted.replace(/\b\d+\b/g, '<span class="number">$&</span>');

        // 函数名
        highlighted = highlighted.replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="function">$1</span>(');

        return highlighted;
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 触发相机摇晃
    triggerCameraShake() {
        if (this.config.cameraShake === 'none') return;

        document.body.classList.remove(`shake-${this.config.cameraShake}`);
        void document.body.offsetWidth; // 触发重绘
        document.body.classList.add(`shake-${this.config.cameraShake}`);
    }

    // 重置
    reset() {
        this.state.isRunning = false;
        this.state.currentIndex = 0;
        this.elements.codeContent.innerHTML = '';
        this.elements.progressInfo.textContent = '';
        this.setStatus('READY', 'ready');
        this.elements.startBtn.disabled = false;
        
        if (this.state.currentFile) {
            const lines = this.state.codeContent.split('\n').length;
            this.elements.lineCount.textContent = `${lines} 行`;
        }
    }

    // 睡眠函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new CodeVisualizer();
});