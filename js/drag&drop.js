class DragDropManager {
    constructor() {
        this.draggedElement = null;
        this.previewElement = null;
        this.isDragging = false;
        
        this.startX = 0;
        this.startY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.workspace = document.querySelector('.work-pos');
        this.blocks = document.querySelectorAll('.variables, .arithmetic, .conditions, .array, .cycle, .print');
        
        this.init();
    }

    init() {
        if (this.workspace) {
            this.workspace.style.display = 'block';
            this.workspace.style.position = 'relative';
            this.workspace.style.padding = '0 35px';

            const spacer = document.createElement('div');
            spacer.style.height = '20px';  
            this.workspace.insertBefore(spacer, this.workspace.firstChild);
        }

        this.blocks.forEach(block => {
            block.addEventListener('mousedown', this.onMouseDown.bind(this));
        });

        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('dragstart', (e) => e.preventDefault());
    }

    onMouseDown(e) {
        const target = e.target.closest('.variables, .arithmetic, .conditions, .array, .cycle, .print');
        if (!target) return;
        
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.draggedElement = target;
        
        const rect = target.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        this.isDragging = true;
        
        
        this.previewElement = this.draggedElement.cloneNode(true);
        this.previewElement.style.position = 'absolute';
        this.previewElement.style.opacity = '0.5';
        this.previewElement.style.pointerEvents = 'none';
        this.previewElement.style.zIndex = '1000';
        this.previewElement.style.width = this.draggedElement.offsetWidth + 'px';
        document.body.appendChild(this.previewElement);
    }

    onMouseMove(e) {
        if (!this.draggedElement || !this.previewElement) return;
        
        e.preventDefault();
        
        this.previewElement.style.left = (e.clientX - this.offsetX) + 'px';
        this.previewElement.style.top = (e.clientY - this.offsetY) + 'px';
    }

    onMouseUp(e) {
        if (!this.draggedElement || !this.isDragging) {
            this.cleanup();
            return;
        }
        
        e.preventDefault();
        
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        
        if (this.workspace && this.workspace.contains(elementUnderCursor)) {
            const insertPosition = this.getInsertPosition(e.clientY);
            this.createElementInWorkspace(this.draggedElement, insertPosition);
        }
        this.cleanup();
    }

    getInsertPosition(mouseY) {
        const blocks = this.workspace.querySelectorAll('.workspace-block-container');
        
        if (blocks.length === 0) return 0;
        
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const blockRect = block.getBoundingClientRect();
            const blockMiddle = blockRect.top + blockRect.height / 2;
            
            if (mouseY < blockMiddle) {
                return i;
            }
        }
        
        return blocks.length;
    }

    createElementInWorkspace(originalElement, insertPosition) {
        const container = document.createElement('div');
        container.className = 'workspace-block-container';
        container.style.position = 'relative';
        container.style.width = 'calc(100% - 70px)';
        container.style.margin = '0 auto 10px auto';
        
        
        const newElement = originalElement.cloneNode(false); 
        
        
        newElement.className = originalElement.className;
        
        
        const computedStyle = window.getComputedStyle(originalElement);
        for (let prop of computedStyle) {
            newElement.style[prop] = computedStyle.getPropertyValue(prop);
        }
        
    
        newElement.style.display = 'flex';
        newElement.style.alignItems = 'center';
        newElement.style.flexWrap = 'wrap';
        newElement.style.gap = '8px';
        newElement.style.padding = '10px';
        newElement.style.margin = '0';
        newElement.style.width = '100%';
        newElement.style.boxSizing = 'border-box';
        newElement.removeAttribute('draggable');
        
        this.addTextToBlock(newElement, originalElement.textContent);
        
        this.addInputFields(newElement, originalElement.textContent);
        
        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '-10px';
        deleteBtn.style.right = '-10px';
        deleteBtn.style.width = '24px';
        deleteBtn.style.height = '24px';
        deleteBtn.style.backgroundColor = '#ff4444';
        deleteBtn.style.color = 'white';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.display = 'flex';
        deleteBtn.style.alignItems = 'center';
        deleteBtn.style.justifyContent = 'center';
        deleteBtn.style.fontSize = '18px';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.zIndex = '10';
        deleteBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        
        container.appendChild(newElement);
        container.appendChild(deleteBtn);
        
        const titleL = this.workspace.querySelector('.title-L');
        if (titleL) {
            titleL.style.display = 'none';
        }
        
        const existingBlocks = this.workspace.querySelectorAll('.workspace-block-container');
        
        if (existingBlocks.length === 0 || insertPosition >= existingBlocks.length) {
            this.workspace.appendChild(container);
        } else {
            this.workspace.insertBefore(container, existingBlocks[insertPosition]);
        }
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.remove();
            
            const blocks = this.workspace.querySelectorAll('.workspace-block-container');
            if (blocks.length === 0) {
                const titleL = this.workspace.querySelector('.title-L');
                if (titleL) {
                    titleL.style.display = 'flex';
                }
            }
        });
    }

    addTextToBlock(element, blockText) {
        const iconSpan = document.createElement('span');
        iconSpan.style.marginRight = '5px';
        iconSpan.style.fontSize = '18px';
        
        if (blockText.includes("Объявить переменную")) {
            iconSpan.textContent = 'Переменная';
        } else if (blockText.includes("Присвоить значение")) {
            iconSpan.textContent = 'Присвоить';
        } else if (blockText.includes("Арифметическое")) {
            iconSpan.textContent = 'Выражение';
        } else if (blockText.includes("Если")) {
            iconSpan.textContent = 'Если';
        } else if (blockText.includes("Массив")) {
            iconSpan.textContent = 'Массив';
        } else if (blockText.includes("Цикл")) {
            iconSpan.textContent = 'Цикл';
        } else if (blockText.includes("Вывести")) {
            iconSpan.textContent = 'Вывести';
        } else {
            iconSpan.textContent = '🔹';
        }
        
        element.appendChild(iconSpan);
    }

    addInputFields(element, blockText) {

        const inputStyle = {
            backgroundColor: 'rgba(10, 87, 90, 0.89)',
            color: 'white',
            border: '2px solid rgb(0, 0, 0)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '16px',
            outline: 'none',
            fontFamily: 'inherit'
        };
        
        if (blockText.includes("Объявить переменную")) {
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'var-name';
            Object.assign(nameInput.style, inputStyle);
            nameInput.style.width = '150px';
            nameInput.style.height = '40px';
            
            element.appendChild(nameInput);
        }
        else if (blockText.includes("Присвоить значение")) {
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'assign-name';
            Object.assign(nameInput.style, inputStyle);
            nameInput.style.width = '70px';
            
            element.appendChild(nameInput);
            
            
            const equalsSpan = document.createElement('span');
            equalsSpan.textContent = '=';
            equalsSpan.style.margin = '0 5px';
            equalsSpan.style.fontWeight = 'bold';
            element.appendChild(equalsSpan);
            
            
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.name = 'assign-value';
            Object.assign(valueInput.style, inputStyle);
            valueInput.style.width = '70px';
            
            element.appendChild(valueInput);
        }
        else if (blockText.includes("Вывести в консоль")) {
            
            const printSpan = document.createElement('span');
            printSpan.style.marginRight = '5px';
            element.appendChild(printSpan);
            
            
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.placeholder = 'переменная/число';
            valueInput.name = 'print-value';
            Object.assign(valueInput.style, inputStyle);
            valueInput.style.width = '150px';
            valueInput.style.height = '40px';
            
            element.appendChild(valueInput);
        }
        else if (blockText.includes("Если (if)")) {
              
            const condInput = document.createElement('input');
            condInput.type = 'text';
            condInput.name = 'if-condition';
            Object.assign(condInput.style, inputStyle);
            condInput.style.width = '100px';
            
            element.appendChild(condInput);
        }
        else {
            
            const textSpan = document.createElement('span');
            textSpan.textContent = blockText;
            element.appendChild(textSpan);
        }
    }ф

    cleanup() {
        if (this.previewElement) {
            this.previewElement.remove();
            this.previewElement = null;
        }
        
        this.draggedElement = null;
        this.isDragging = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DragDropManager();
});