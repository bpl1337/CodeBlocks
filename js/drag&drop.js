class DragDropManager {
    constructor() {
        this.draggedElement = null;
        this.previewElement = null;
        this.markerElement = null;
        this.isDragging = false;
        
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.workspace = document.querySelector('.work-pos');
        this.blocks = document.querySelectorAll('.variables, .arithmetic, .conditions, .array, .cycle, .print');
        
        this.init();
    }

    init() {
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
        
        this.draggedElement = target;
        
        const rect = target.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        this.isDragging = true;
        
        // Превью
        this.previewElement = this.draggedElement.cloneNode(true);
        this.previewElement.classList.add('drag-preview');
        document.body.appendChild(this.previewElement);
        
        // Маркер
        this.markerElement = document.createElement('div');
        this.markerElement.classList.add('insert-marker');
        document.body.appendChild(this.markerElement);
        
        this.updatePreviewPosition(e);
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.previewElement) return;
        
        e.preventDefault();
        this.updatePreviewPosition(e);
        this.updateMarkerAndDropZones(e.clientX, e.clientY);
    }

    updatePreviewPosition(e) {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        this.previewElement.style.left = (e.clientX - this.offsetX + scrollX) + 'px';
        this.previewElement.style.top = (e.clientY - this.offsetY + scrollY) + 'px';
    }

    updateMarkerAndDropZones(mouseX, mouseY) {
        if (!this.workspace || !this.markerElement) return;
        
        document.querySelectorAll('.block-children').forEach(zone => {
            zone.classList.remove('drag-over');
        });
        
        const blocks = Array.from(this.workspace.querySelectorAll('.workspace-block-container'));
        const dropZones = document.querySelectorAll('.block-children');
        
        // Проверяем зоны вложения
        for (const zone of dropZones) {
            const rect = zone.getBoundingClientRect();
            if (mouseY >= rect.top && mouseY <= rect.bottom && mouseX >= rect.left && mouseX <= rect.right) {
                zone.classList.add('drag-over');
                this.markerElement.style.display = 'none';
                return;
            }
        }
        
        // Если блоков нет - маркер в начале
        if (blocks.length === 0) {
            const workspaceRect = this.workspace.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            
            this.markerElement.style.display = 'block';
            this.markerElement.style.width = (workspaceRect.width - 70) + 'px';
            this.markerElement.style.left = (workspaceRect.left + 35) + 'px';
            this.markerElement.style.top = (workspaceRect.top + scrollY + 10) + 'px';
            return;
        }
        
        // Ищем позицию для маркера между блоками
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const rect = block.getBoundingClientRect();
            const blockMiddle = rect.top + rect.height / 2;
            const scrollY = window.scrollY || window.pageYOffset;
            
            if (mouseY < blockMiddle) {
                this.markerElement.style.display = 'block';
                this.markerElement.style.width = (rect.width - 40) + 'px';
                this.markerElement.style.left = (rect.left + 20) + 'px';
                this.markerElement.style.top = (rect.top + scrollY - 5) + 'px';
                return;
            }
            
            if (i === blocks.length - 1 && mouseY > rect.bottom) {
                this.markerElement.style.display = 'block';
                this.markerElement.style.width = (rect.width - 40) + 'px';
                this.markerElement.style.left = (rect.left + 20) + 'px';
                this.markerElement.style.top = (rect.bottom + scrollY + 5) + 'px';
                return;
            }
        }
        
        this.markerElement.style.display = 'none';
    }

    createElementInDropZone(originalElement, dropZone) {
        const container = document.createElement('div');
        container.className = 'workspace-block-container';
        
        const newElement = originalElement.cloneNode(false);
        newElement.className = originalElement.className;
        newElement.removeAttribute('draggable');

        this.addTextToBlock(newElement, originalElement.textContent);
        this.addInputFields(newElement, originalElement.textContent);

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';

        container.appendChild(newElement);
        container.appendChild(deleteBtn);
        dropZone.appendChild(container);

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.remove();
        });
    }

    onMouseUp(e) {
        document.querySelectorAll('.block-children').forEach(zone => {
            zone.classList.remove('drag-over');
        });

        if (!this.isDragging || !this.draggedElement) {
            this.cleanup();
            return;
        }

        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        
        // Проверяем, не попадаем ли мы в блок-children
        const dropZoneInChildren = elementUnderCursor?.closest('.block-children');

        if (dropZoneInChildren) {
            // Вставляем внутрь if/for
            this.createElementInDropZone(this.draggedElement, dropZoneInChildren);
        } 
        else if (this.workspace && this.workspace.contains(elementUnderCursor)) {
            // Вставляем в рабочую область
            const blocks = Array.from(this.workspace.querySelectorAll('.workspace-block-container'));
            
            // Находим позицию для вставки
            let insertPosition = blocks.length;
            
            // Проверяем, над каким блоком курсор
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const rect = block.getBoundingClientRect();
                
                if (e.clientY < rect.top + rect.height / 2) {
                    insertPosition = i;
                    break;
                }
            }
            
            this.createElementInWorkspace(this.draggedElement, insertPosition);
        }

        this.cleanup();
    }

    createElementInWorkspace(originalElement, insertPosition) {
        const container = document.createElement('div');
        container.className = 'workspace-block-container';
        
        const newElement = originalElement.cloneNode(false);
        newElement.className = originalElement.className;
        newElement.removeAttribute('draggable');
        
        this.addTextToBlock(newElement, originalElement.textContent);
        this.addInputFields(newElement, originalElement.textContent);
        
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        
        container.appendChild(newElement);
        container.appendChild(deleteBtn);
        
        // Убираем title-L если есть
        const titleL = this.workspace.querySelector('.title-L');
        if (titleL) titleL.style.display = 'none';
        
        // Получаем все существующие блоки
        const existingBlocks = this.workspace.querySelectorAll('.workspace-block-container');
        
        // Вставляем в правильную позицию
        if (existingBlocks.length === 0) {
            // Если блоков нет - просто добавляем
            this.workspace.appendChild(container);
        } else if (insertPosition >= existingBlocks.length) {
            // Если позиция после последнего - добавляем в конец
            this.workspace.appendChild(container);
        } else {
            // Вставляем перед блоком с индексом insertPosition
            this.workspace.insertBefore(container, existingBlocks[insertPosition]);
        }
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.remove();
            
            // Если блоков не осталось - показываем title-L
            if (this.workspace.querySelectorAll('.workspace-block-container').length === 0) {
                const titleL = this.workspace.querySelector('.title-L');
                if (titleL) titleL.style.display = 'flex';
            }
        });
    }

    addTextToBlock(element, blockText) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'block-icon';
        
        if (blockText.includes("Объявить переменную")) {
            iconSpan.textContent = 'Переменная';
        } else if (blockText.includes("Присвоить значение")) {
            iconSpan.textContent = 'Переменная';
        } else if (blockText.includes("Если")) {
            iconSpan.textContent = 'Если';
        } else if (blockText.includes("Цикл For")) {
            iconSpan.textContent = 'for';
        } else if (blockText.includes("Объявить массив") || 
                   blockText.includes("Элемент массива =") || 
                   blockText.includes("Получить элемент")) {
            iconSpan.textContent = 'Массив';
        } else {
            iconSpan.textContent = '';
        }
        
        element.appendChild(iconSpan);
    }

    addInputFields(element, blockText) {
        if (blockText.includes("Объявить переменную")) {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'var-name';
            input.className = 'block-input';
            element.appendChild(input);
        }
        else if (blockText.includes("Присвоить значение")) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'assign-name';
            nameInput.className = 'block-input small';
            element.appendChild(nameInput);
            
            const span = document.createElement('span');
            span.textContent = '=';
            span.className = 'operator';
            element.appendChild(span);
            
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.name = 'assign-value';
            valueInput.className = 'block-input small';
            element.appendChild(valueInput);
        }
        else if (blockText.includes("Вывести в консоль")) {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'print-value';
            input.className = 'block-input';
            element.appendChild(input);
        }
        else if (blockText.includes("Если (if)")) {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'if-condition';
            input.className = 'block-input';
            element.appendChild(input);

            const span = document.createElement('span');
            span.textContent = 'то';
            span.className = 'operator';
            element.appendChild(span);

            const container = document.createElement('div');
            container.className = 'block-children';
            element.appendChild(container);
        }
        else if (blockText.includes("Объявить массив")) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'array-name';
            nameInput.className = 'block-input small';
            element.appendChild(nameInput);

            const span = document.createElement('span');
            span.textContent = '=';
            span.className = 'operator';
            element.appendChild(span);

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.name = 'array-value';
            valueInput.className = 'block-input';
            element.appendChild(valueInput);
        }
        else if (blockText.includes("Элемент массива =")) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'array-element-name';
            nameInput.className = 'block-input small';
            element.appendChild(nameInput);

            const span1 = document.createElement('span');
            span1.textContent = '[';
            span1.className = 'operator';
            element.appendChild(span1);

            const indexInput = document.createElement('input');
            indexInput.type = 'text';
            indexInput.name = 'array-element-index';
            indexInput.className = 'block-input tiny';
            element.appendChild(indexInput);

            const span2 = document.createElement('span');
            span2.textContent = '] =';
            span2.className = 'operator';
            element.appendChild(span2);

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.name = 'array-element-value';
            valueInput.className = 'block-input small';
            element.appendChild(valueInput);
        }
        else if (blockText.includes("Получить элемент")) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'array-get-name';
            nameInput.className = 'block-input small';
            element.appendChild(nameInput);

            const span1 = document.createElement('span');
            span1.textContent = '[';
            span1.className = 'operator';
            element.appendChild(span1);

            const indexInput = document.createElement('input');
            indexInput.type = 'text';
            indexInput.name = 'array-get-index';
            indexInput.className = 'block-input tiny';
            element.appendChild(indexInput);

            const span2 = document.createElement('span');
            span2.textContent = ']';
            span2.className = 'operator';
            element.appendChild(span2);
        }
        else if (blockText.includes("Цикл For(C++ style)")) {
            const initInput = document.createElement('input');
            initInput.type = 'text';
            initInput.name = 'for-init';
            initInput.className = 'block-input small';
            element.appendChild(initInput);

            const condInput = document.createElement('input');
            condInput.type = 'text';
            condInput.name = 'for-condition';
            condInput.className = 'block-input small';
            element.appendChild(condInput);

            const stepInput = document.createElement('input');
            stepInput.type = 'text';
            stepInput.name = 'for-step';
            stepInput.className = 'block-input small';
            element.appendChild(stepInput);

            const container = document.createElement('div');
            container.className = 'block-children';
            element.appendChild(container);
        }
    }
    
    cleanup() {
        if (this.previewElement) {
            this.previewElement.remove();
            this.previewElement = null;
        }
        
        if (this.markerElement) {
            this.markerElement.remove();
            this.markerElement = null;
        }
        
        this.draggedElement = null;
        this.isDragging = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DragDropManager();
});