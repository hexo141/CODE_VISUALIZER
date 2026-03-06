// ===== 代码可视化器 - 主脚本 =====

class CodeVisualizer {
    constructor() {
        // DOM 元素
        this.codeFileInput = document.getElementById('codeFile');
        this.codeDisplay = document.getElementById('codeDisplay');
        this.codeContainer = document.getElementById('codeContainer');
        this.lineNumbers = document.getElementById('lineNumbers');
        this.status = document.getElementById('status');
        this.lineCounter = document.getElementById('lineCounter');
        this.progressBar = document.getElementById('progressBar');
        
        // 设置元素
        this.speedInput = document.getElementById('speed');
        this.thinkTimeInput = document.getElementById('thinkTime');
        this.showLineNumbersInput = document.getElementById('showLineNumbers');
        this.cameraShakeInput = document.getElementById('cameraShake');
        this.autoPlayInput = document.getElementById('autoPlay');
        
        // 值显示
        this.speedValue = document.getElementById('speedValue');
        this.thinkTimeValue = document.getElementById('thinkTimeValue');
        
        // 控制按钮
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // 状态
        this.code = '';
        this.lines = [];
        this.currentLine = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.timer = null;
        
        // 初始化
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateSettingsDisplay();
        this.setStatus('READY');
    }
    
    bindEvents() {
        // 文件选择
        this.codeFileInput.addEventListener('change', (e) => this.loadFile(e));
        
        // 设置变化
        this.speedInput.addEventListener('input', () => this.updateSettingsDisplay());
        this.thinkTimeInput.addEventListener('input', () => this.updateSettingsDisplay());
        this.showLineNumbersInput.addEventListener('change', () => this.toggleLineNumbers());
        this.cameraShakeInput.addEventListener('change', () => this.toggleCameraShake());
        
        // 控制按钮
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    updateSettingsDisplay() {
        this.speedValue.textContent = this.speedInput.value;
        this.thinkTimeValue.textContent = this.thinkTimeInput.value;
    }
    
    loadFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.code = e.target.result;
            this.lines = this.code.split('\n');
            this.renderCode();
            this.setStatus('LOADED');
            this.lineCounter.textContent = `${this.lines.length} 行`;
            
            if (this.autoPlayInput.checked) {
                setTimeout(() => this.play(), 500);
            }
        };
        reader.readAsText(file);
    }
    
    renderCode() {
        // 渲染代码行
        const html = this.lines.map((line, index) => 
            `<span class="code-line" data-line="${index}">${this.escapeHtml(line) || ' '}</span>`
        ).join('\n');
        
        this.codeDisplay.innerHTML = html;
        
        // 渲染行号
        this.renderLineNumbers();
    }
    
    renderLineNumbers() {
        const html = this.lines.map((_, index) => 
            `<span data-line="${index}">${index + 1}</span>`
        ).join('\n');
        
        this.lineNumbers.innerHTML = html;
        this.toggleLineNumbers();
    }
    
    toggleLineNumbers() {
        if (this.showLineNumbersInput.checked) {
            this.lineNumbers.classList.remove('hidden');
            this.codeDisplay.parentElement.style.paddingLeft = '60px';
        } else {
            this.lineNumbers.classList.add('hidden');
            this.codeDisplay.parentElement.style.paddingLeft = '20px';
        }
    }
    
    toggleCameraShake() {
        // 设置将在播放时生效
    }
    
    play() {
        if (this.lines.length === 0) {
            this.setStatus('NO CODE');
            return;
        }
        
        if (this.currentLine >= this.lines.length) {
            this.reset();
        }
        
        this.isPlaying = true;
        this.isPaused = false;
        this.setStatus('PLAYING');
        this.status.classList.add('playing');
        
        this.playNextLine();
    }
    
    playNextLine() {
        if (!this.isPlaying || this.isPaused) return;
        
        if (this.currentLine >= this.lines.length) {
            this.complete();
            return;
        }
        
        // 高亮当前行
        this.highlightLine(this.currentLine);
        
        // 更新进度
        this.updateProgress();
        
        // 相机摇晃效果
        if (this.cameraShakeInput.checked) {
            this.triggerCameraShake();
        }
        
        // 计算下一行时间
        const speed = 101 - this.speedInput.value; // 反转，值越大越快
        const thinkTime = parseInt(this.thinkTimeInput.value);
        const delay = speed * 10 + thinkTime;
        
        this.currentLine++;
        this.timer = setTimeout(() => this.playNextLine(), delay);
    }
    
    highlightLine(lineIndex) {
        // 移除所有高亮
        document.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('active');
            if (parseInt(el.dataset.line) < lineIndex) {
                el.classList.add('completed');
            }
        });
        
        document.querySelectorAll('.line-numbers span').forEach(el => {
            el.classList.remove('active');
        });
        
        // 高亮当前行
        const codeLine = document.querySelector(`.code-line[data-line="${lineIndex}"]`);
        const numberLine = document.querySelector(`.line-numbers span[data-line="${lineIndex}"]`);
        
        if (codeLine) {
            codeLine.classList.add('active');
            codeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        if (numberLine) {
            numberLine.classList.add('active');
        }
    }
    
    triggerCameraShake() {
        this.codeContainer.classList.add('shaking');
        setTimeout(() => {
            this.codeContainer.classList.remove('shaking');
        }, 500);
    }
    
    updateProgress() {
        const progress = (this.currentLine / this.lines.length) * 100;
        this.progressBar.style.width = `${progress}%`;
    }
    
    pause() {
        this.isPaused = true;
        this.setStatus('PAUSED');
        this.status.classList.remove('playing');
        clearTimeout(this.timer);
    }
    
    reset() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentLine = 0;
        clearTimeout(this.timer);
        
        // 清除高亮
        document.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('active', 'completed');
        });
        
        document.querySelectorAll('.line-numbers span').forEach(el => {
            el.classList.remove('active');
        });
        
        this.progressBar.style.width = '0%';
        this.setStatus('READY');
        this.status.classList.remove('playing');
    }
    
    complete() {
        this.isPlaying = false;
        this.setStatus('COMPLETED');
        this.status.classList.remove('playing');
        this.progressBar.style.width = '100%';
    }
    
    setStatus(status) {
        this.status.textContent = status;
    }
    
    handleKeyboard(event) {
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                if (this.isPlaying && !this.isPaused) {
                    this.pause();
                } else {
                    this.play();
                }
                break;
            case 'KeyR':
                this.reset();
                break;
            case 'Escape':
                this.pause();
                break;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new CodeVisualizer();
});