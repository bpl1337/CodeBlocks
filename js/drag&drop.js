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
    }

    onMouseMove(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        
        if (this.isDragging && this.previewElement) {
            this.previewElement.style.left = (e.clientX - this.offsetX) + 'px';
            this.previewElement.style.top = (e.clientY - this.offsetY) + 'px';
        }
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
        
        const newElement = document.createElement('div');
        newElement.textContent = originalElement.textContent;
        newElement.className = originalElement.className;
        
        const computedStyle = window.getComputedStyle(originalElement);
        for (let prop of computedStyle) {
            newElement.style[prop] = computedStyle.getPropertyValue(prop);
        }
        
        newElement.style.display = 'block';
        newElement.style.width = '100%';
        newElement.style.margin = '0';
        newElement.style.boxSizing = 'border-box';
        newElement.removeAttribute('draggable');
        
        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '0px';
        deleteBtn.style.right = '0px';
        deleteBtn.style.width = '20px';
        deleteBtn.style.height = '20px';
        deleteBtn.style.backgroundColor = '#ff4444';
        deleteBtn.style.color = 'white';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.display = 'flex';
        deleteBtn.style.alignItems = 'center';
        deleteBtn.style.justifyContent = 'center';
        deleteBtn.style.fontSize = '16px';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.zIndex = '10';
        
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