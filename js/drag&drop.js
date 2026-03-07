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
        
        // Стили для индикатора if (просто жирная зеленая линия)
        const style = document.createElement('style');
        style.textContent = `
            .block-children.drag-over {
                border-left: 6px solid #4caf50 !important;
                background-color: rgba(76, 175, 80, 0.1) !important;
                transition: all 0.2s;
            }
        `;
        document.head.appendChild(style);
    }

    onMouseDown(e) {
        const target = e.target.closest('.variables, .arithmetic, .conditions, .array, .cycle, .print');
        if (!target) return;
        
        this.draggedElement = target;
        
        const rect = target.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        this.isDragging = true;
        
        // СОЗДАЕМ ПРЕВЬЮ - ГЛУБОКАЯ КОПИЯ ВСЕГО БЛОКА
        this.previewElement = this.draggedElement.cloneNode(true);
        
        // КОПИРУЕМ ВСЕ СТИЛИ ИЗ ОРИГИНАЛА
        const originalStyles = window.getComputedStyle(this.draggedElement);
        for (let prop of originalStyles) {
            if (prop === 'position' || prop === 'top' || prop === 'left' || prop === 'right' || prop === 'bottom' || prop === 'z-index') continue;
            this.previewElement.style[prop] = originalStyles.getPropertyValue(prop);
        }
        
        // ЯВНО ЗАДАЕМ ВАЖНЫЕ СТИЛИ ДЛЯ ПРЕВЬЮ
        this.previewElement.style.position = 'absolute';
        this.previewElement.style.opacity = '0.7';
        this.previewElement.style.pointerEvents = 'none';
        this.previewElement.style.zIndex = '1000';
        this.previewElement.style.width = rect.width + 'px';
        this.previewElement.style.height = rect.height + 'px';
        this.previewElement.style.top = '';
        this.previewElement.style.left = '';
        this.previewElement.style.margin = '0';
        this.previewElement.style.padding = originalStyles.padding;
        this.previewElement.style.backgroundColor = originalStyles.backgroundColor;
        this.previewElement.style.border = originalStyles.border;
        this.previewElement.style.borderRadius = originalStyles.borderRadius;
        this.previewElement.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
        
        document.body.appendChild(this.previewElement);
        
        // Создаем маркер
        this.markerElement = document.createElement('div');
        this.markerElement.style.height = '4px';
        this.markerElement.style.backgroundColor = '#4caf50';
        this.markerElement.style.position = 'absolute';
        this.markerElement.style.zIndex = '999';
        this.markerElement.style.pointerEvents = 'none';
        this.markerElement.style.display = 'none';
        this.markerElement.style.boxShadow = '0 0 8px #4caf50';
        this.markerElement.style.borderRadius = '2px';
        document.body.appendChild(this.markerElement);
        
        // Сразу ставим превью на место
        this.updatePreviewPosition(e);
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.previewElement) return;
        
        e.preventDefault();
        
        // Обновляем позицию превью
        this.updatePreviewPosition(e);
        
        // Обновляем маркер и подсветку if
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
        
        // Сначала убираем подсветку со всех зон
        document.querySelectorAll('.block-children').forEach(zone => {
            zone.classList.remove('drag-over');
        });
        
        const blocks = Array.from(this.workspace.querySelectorAll('.workspace-block-container'));
        
        // Проверяем зоны вложения (тела if)
        const dropZones = document.querySelectorAll('.block-children');
        for (const zone of dropZones) {
            const rect = zone.getBoundingClientRect();
            if (mouseY >= rect.top && mouseY <= rect.bottom && mouseX >= rect.left && mouseX <= rect.right) {
                // Подсвечиваем зону жирной зеленой линией
                zone.classList.add('drag-over');
                this.markerElement.style.display = 'none';
                return;
            }
        }
        
        // Если не над зоной вложения - показываем маркер
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
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.margin = '0 0 10px 0';
        container.style.boxSizing = 'border-box';
        
        const newElement = originalElement.cloneNode(false);
        newElement.className = originalElement.className;
        
        const computedStyle = window.getComputedStyle(originalElement);
        for (let prop of computedStyle) {
            if (prop === 'position' || prop === 'top' || prop === 'left' || prop === 'right' || prop === 'bottom' || prop === 'z-index') continue;
            newElement.style[prop] = computedStyle.getPropertyValue(prop);
        }

        newElement.style.position = '';
        newElement.style.zIndex = '';
        newElement.style.height = 'auto';
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

        dropZone.appendChild(container);

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.remove();
        });
    }

    onMouseUp(e) {
        // Убираем подсветку со всех зон
        document.querySelectorAll('.block-children').forEach(zone => {
            zone.classList.remove('drag-over');
        });

        if (!this.isDragging || !this.draggedElement) {
            this.cleanup();
            return;
        }

        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        const dropZoneInChildren = elementUnderCursor?.closest('.block-children');

        if (dropZoneInChildren) {
            this.createElementInDropZone(this.draggedElement, dropZoneInChildren);
        } else if (this.workspace && this.workspace.contains(elementUnderCursor)) {
            const blocks = Array.from(this.workspace.querySelectorAll('.workspace-block-container'));
            let insertPosition = blocks.length;

            const parentBlock = elementUnderCursor.closest('.workspace-block-container');
            if (parentBlock && blocks.includes(parentBlock)) {
                const rect = parentBlock.getBoundingClientRect();
                const idx = blocks.indexOf(parentBlock);
                insertPosition = e.clientY > rect.bottom ? idx + 1 : idx;
            }

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
            if (mouseY < blockMiddle) return i;
        }
        return blocks.length;
    }

    createElementInWorkspace(originalElement, insertPosition) {
        const container = document.createElement('div');
        container.className = 'workspace-block-container';
        container.style.position = 'relative';
        container.style.width = 'calc(100% - 70px)';
        container.style.margin = '0 auto 10px auto';
        container.style.boxSizing = 'border-box';
        
        const newElement = originalElement.cloneNode(false);
        newElement.className = originalElement.className;
        
        const computedStyle = window.getComputedStyle(originalElement);
        for (let prop of computedStyle) {
            if (prop === 'position' || prop === 'top' || prop === 'left' || prop === 'right' || prop === 'bottom' || prop === 'z-index') continue;
            newElement.style[prop] = computedStyle.getPropertyValue(prop);
        }
        
        newElement.style.position = '';
        newElement.style.zIndex = '';
        newElement.style.height = 'auto';
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
        if (titleL) titleL.style.display = 'none';
        
        const existingBlocks = this.workspace.querySelectorAll('.workspace-block-container');
        
        if (existingBlocks.length === 0 || insertPosition >= existingBlocks.length) {
            this.workspace.appendChild(container);
        } else {
            this.workspace.insertBefore(container, existingBlocks[insertPosition]);
        }
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.remove();
            
            if (this.workspace.querySelectorAll('.workspace-block-container').length === 0) {
                const titleL = this.workspace.querySelector('.title-L');
                if (titleL) titleL.style.display = 'flex';
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
            condInput.style.width = '150px';
            condInput.style.height = '40px';
            element.appendChild(condInput);

            const thenSpan = document.createElement('span');
            thenSpan.textContent = 'то';
            thenSpan.style.margin = '0 5px';
            thenSpan.style.fontWeight = 'bold';
            element.appendChild(thenSpan);

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'block-children';
            childrenContainer.style.marginLeft = '20px';
            childrenContainer.style.minHeight = '30px';
            childrenContainer.style.borderLeft = '2px solid #ff9800';
            childrenContainer.style.paddingLeft = '10px';
            childrenContainer.style.marginTop = '10px';
            childrenContainer.style.width = '100%';
            childrenContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';

            element.appendChild(childrenContainer);
        }
        else if (blockText.includes("Объявить массив")) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'array-name';
            Object.assign(nameInput.style, inputStyle);
            nameInput.style.width = '100px';
            element.appendChild(nameInput);

            const equalsSpan = document.createElement('span');
            equalsSpan.textContent = '=';
            equalsSpan.style.margin = '0 5px';
            element.appendChild(equalsSpan);

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.name = 'array-value';
            Object.assign(valueInput.style, inputStyle);
            valueInput.style.width = '150px';
            element.appendChild(valueInput);
        }
        else if (blockText.includes("Элемент массива =")) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'array-element-name';
            Object.assign(nameInput.style, inputStyle);
            nameInput.style.width = '80px';
            element.appendChild(nameInput);

            const bracket1 = document.createElement('span');
            bracket1.textContent = '[';
            element.appendChild(bracket1);

            const indexInput = document.createElement('input');
            indexInput.type = 'text';
            indexInput.name = 'array-element-index';
            Object.assign(indexInput.style, inputStyle);
            indexInput.style.width = '50px';
            element.appendChild(indexInput);

            const bracket2 = document.createElement('span');
            bracket2.textContent = '] =';
            element.appendChild(bracket2);

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.name = 'array-element-value';
            Object.assign(valueInput.style, inputStyle);
            valueInput.style.width = '80px';
            element.appendChild(valueInput);
        }
        else if (blockText.includes("Получить элемент")) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'array-get-name';
            Object.assign(nameInput.style, inputStyle);
            nameInput.style.width = '80px';
            element.appendChild(nameInput);

            const bracket1 = document.createElement('span');
            bracket1.textContent = '[';
            element.appendChild(bracket1);

            const indexInput = document.createElement('input');
            indexInput.type = 'text';
            indexInput.name = 'array-get-index';
            Object.assign(indexInput.style, inputStyle);
            indexInput.style.width = '50px';
            element.appendChild(indexInput);

            const bracket2 = document.createElement('span');
            bracket2.textContent = ']';
            element.appendChild(bracket2);
        }
        else {
            const textSpan = document.createElement('span');
            textSpan.textContent = blockText;
            element.appendChild(textSpan);
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