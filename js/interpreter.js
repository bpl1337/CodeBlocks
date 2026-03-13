

class Interpreter{
    #variables = new Map();
    #consolePanel;
    #variablesPanel;
    #workSpace;

    constructor(consolePanel, variablesPanel, workSpace){
        this.#consolePanel = consolePanel;
        this.#variablesPanel = variablesPanel;
        this.#workSpace = workSpace;

        this.#init();
    }

    #init(){
        let runButton = document.getElementById("onBtn");

        if (runButton) {
            runButton.addEventListener("click", click => {
                this.#run();
            });
        }

        let clearButton = document.getElementById("clearBtn");

        if (clearButton) {
            clearButton.addEventListener("click", click => {
                this.#clearConsole();
                this.#clearVariables();
                this.#clearWorkSpace();
                this.#updateVariablesPanel();
            });
        }
    }

    #print(text){
        let output = text;
        if (Array.isArray(text)) {
            output = '[' + text.join(', ') + ']';
        }
        this.#consolePanel.innerHTML +=">> "+ output + '<br>';
        this.#consolePanel.scrollTop = this.#consolePanel.scrollHeight;
    }

    print(text){
        this.#print(text);
    }

    #clearConsole(){
        this.#consolePanel.innerHTML = "";
    }

    #clearVariables(){
        this.#variables.clear();
    }

    #clearWorkSpace() {
        const blocks = this.#workSpace.querySelectorAll('.workspace-block-container');
        blocks.forEach(block => block.remove());
    
        const titleL = this.#workSpace.querySelector('.title-L');
        if (titleL) {
            titleL.style.display = 'flex';
        }
    
        this.#print("Очищено");
    }

    #updateVariablesPanel() {
        this.#variablesPanel.innerHTML = '';
        
        const title = document.createElement('div');
        title.className = 'variables-header';
        title.textContent = 'Переменные';
        this.#variablesPanel.appendChild(title);
        
        if (this.#variables.size === 0) {
            const empty = document.createElement('div');
            empty.className = 'variables-empty';
            empty.textContent = 'Нет переменных';
            this.#variablesPanel.appendChild(empty);
            return;
        }

        for (const [name, value] of this.#variables) {
            const row = document.createElement('div');
            row.className = 'variable-row';
            row.textContent = `${name} = ${value}`;
            this.#variablesPanel.appendChild(row);
        }  
    }

    declareVariable(name) {
        this.#variables.set(name, null);
    }

    hasVariable(name) {
        return this.#variables.has(name);
    }
    
    getVariable(name) {
        return this.#variables.get(name);
    }
    
    setVariable(name, value) {
        this.#variables.set(name, value);
    }

    #isValidVariableName(name) {
        if (!name || typeof name !== 'string') return false;
        
        if (!((name[0] >= 'a' && name[0] <= 'z') || 
              (name[0] >= 'A' && name[0] <= 'Z') || 
               name[0] === '_')) {
            return false;
        }
        
        for (const char of name) {
            if (!((char >= 'a' && char <= 'z') || 
                  (char >= 'A' && char <= 'Z') || 
                  (char >= '0' && char <= '9') || 
                   char === '_')) {
                return false;
            }
        }
        return true;
    }

    #run(){
        this.#clearConsole();
        this.#clearVariables();

        const blocks = this.#workSpace.querySelectorAll(".workspace-block-container");

        if(blocks.length === 0){
            return;
        }

        const programNode = this.#buildProgramNode(blocks, false);
        programNode.execute(this);
        this.#updateVariablesPanel();
    }

    #buildProgramNode(blocks, isIndoor = false){
        const statements = [];
        let i = 0;

        while(i<blocks.length){
            const block = blocks[i];
            const blockElement = block.children[0];

            if(!blockElement){
                i+=1;
                continue;
            }

            if(!isIndoor && block.closest('.block-children')){
                i += 1;
                continue;
            }

            if(blockElement.querySelector(':scope > input[name="var-name"]')){
                const name = blockElement.querySelector(':scope > input[name="var-name"]').value;

                if (!this.#isValidVariableName(name)) {
                    this.#print(`Ошибка: некорректное имя переменной "${name}"`);
                    return;
                }

                statements.push(new DeclarationNode(name));
                i+=1;

            }else if(blockElement.querySelector(':scope > input[name="assign-name"]')){
                const name = blockElement.querySelector(':scope > input[name="assign-name"]').value;

                if (!this.#isValidVariableName(name)) {
                    this.#print(`Ошибка: некорректное имя переменной "${name}"`);
                    return;
                }

                const expressionText = blockElement.querySelector(':scope > input[name="assign-value"]').value;
                const expressionNode = this.#buildExpressionNode(expressionText);

                statements.push(new AssignmentNode(name, expressionNode));
                i+=1;
            }else if(blockElement.querySelector(':scope > input[name="print-value"]')){
                const expressionText = blockElement.querySelector(':scope > input[name="print-value"]').value;
                const expressionNode = this.#buildExpressionNode(expressionText);

                statements.push(new PrintNode(expressionNode));
                i+=1;
            }else if(blockElement.querySelector(':scope > input[name="if-condition"]')){
                const conditionText = blockElement.querySelector(':scope > input[name="if-condition"]').value;
                const childrenContainer = blockElement.querySelector(':scope > .block-children');
                const bodyBlocks = [];

                if(childrenContainer){
                    const indoorBlocks = childrenContainer.querySelectorAll(':scope > .workspace-block-container');
                    indoorBlocks.forEach(indoorBlock => bodyBlocks.push(indoorBlock));
                }

                const conditionNode = this.#buildExpressionNode(conditionText);
                const bodyNode = this.#buildProgramNode(bodyBlocks, true);

                statements.push(new IfNode(conditionNode, bodyNode));
                i+=1;
            }else if(blockElement.querySelector(':scope > input[name="array-name"]')){
                const name = blockElement.querySelector(':scope > input[name="array-name"]').value;
                
                if (!this.#isValidVariableName(name)) {
                    this.#print(`Ошибка: некорректное имя массива "${name}"`);
                    return;
                }
                
                const arrayValueText = blockElement.querySelector('input[name="array-value"]').value;
                const arrayNode = this.#parseAsArray(arrayValueText);

                statements.push(new ArrayDeclarationNode(name, arrayNode));
                i+=1;
            }else if(blockElement.querySelector(':scope > input[name="array-element-name"]') && 
                     blockElement.querySelector(':scope > input[name="array-element-value"]') && 
                     blockElement.querySelector(':scope > input[name="array-element-index"]')){
                        const arrayName = blockElement.querySelector(':scope > input[name="array-element-name"]').value;
                        
                        if (!this.#isValidVariableName(arrayName)) {
                            this.#print(`Ошибка: некорректное имя массива "${arrayName}"`);
                            return;
                        }
                        
                        const valueText = blockElement.querySelector(':scope > input[name="array-element-value"]').value;
                        const indexText = blockElement.querySelector(':scope > input[name="array-element-index"]').value;

                        const arrayNode = new VariableNode(arrayName);
                        const indexNode = this.#buildExpressionNode(indexText);
                        const valueNode = this.#buildExpressionNode(valueText);

                        statements.push(new ArrayAssignmentNode(arrayNode, indexNode, valueNode)); 
                        i+=1;
            }else if(blockElement.querySelector(':scope > input[name="array-get-name"]') &&
                     blockElement.querySelector(':scope > input[name="array-get-index"]')){
                        const arrayName = blockElement.querySelector(':scope > input[name="array-get-name"]').value;
                        
                        if (!this.#isValidVariableName(arrayName)) {
                            this.#print(`Ошибка: некорректное имя массива "${arrayName}"`);
                            return;
                        }
                        
                        const indexText = blockElement.querySelector(':scope > input[name="array-get-index"]').value;

                        const arrayNode = new VariableNode(arrayName);
                        const indexNode = this.#buildExpressionNode(indexText);
                        const accessNode = new ArrayAccessNode(arrayNode, indexNode);

                        statements.push(new PrintNode(accessNode));
                        i+=1;
                     }
            else if(blockElement.querySelector(':scope > input[name="for-init"]')){
                const initText = blockElement.querySelector(':scope > input[name="for-init"]').value;
                const conditionText = blockElement.querySelector(':scope > input[name="for-condition"]').value;
                const stepText = blockElement.querySelector(':scope > input[name="for-step"]').value;

                const childrenContainer = blockElement.querySelector(':scope > .block-children');
                const bodyBlocks = [];

                if(childrenContainer){
                    const indoorBlocks = childrenContainer.querySelectorAll(':scope > .workspace-block-container');
                    indoorBlocks.forEach(block => bodyBlocks.push(block));
                }

                const initNode = this.#buildExpressionNode(initText);
                const conditionNode = this.#buildExpressionNode(conditionText);
                const stepNode = this.#buildExpressionNode(stepText);
                const bodyNode = this.#buildProgramNode(bodyBlocks, true);

                statements.push(new ForNode(initNode, conditionNode, stepNode, bodyNode));
                i+=1;
            }else if(blockElement.querySelector(':scope > input[name="else-if-condition"]')){
                const conditionText = blockElement.querySelector(':scope > input[name="else-if-condition"]').value;
                const childrenContainers = blockElement.querySelectorAll(':scope > .block-children');
                const childrenContainer = childrenContainers[0];
                const elseChildrenContainer = childrenContainers[1];

                const bodyBlocks = [];
                const elseBodyBlocks = [];

                if(childrenContainer){
                    const indoorBlocks = childrenContainer.querySelectorAll(':scope > .workspace-block-container');
                    indoorBlocks.forEach(indoorBlock => bodyBlocks.push(indoorBlock));
                }

                if(elseChildrenContainer){
                    const elseIndoorBlocks = elseChildrenContainer.querySelectorAll(':scope > .workspace-block-container');
                    elseIndoorBlocks.forEach(elseIndoorBlock => elseBodyBlocks.push(elseIndoorBlock));
                }

                const conditionNode = this.#buildExpressionNode(conditionText);
                const bodyNode = this.#buildProgramNode(bodyBlocks, true);
                const elseBodyNode = this.#buildProgramNode(elseBodyBlocks, true);

                statements.push(new ElseIfNode(conditionNode, bodyNode, elseBodyNode));
                i+=1;
            }
            else{
                i+=1;
            }
        }
        return new ProgramNode(statements);
    }

    #tokenize(expression){
        const tokens = [];
        let i = 0;

        while(i < expression.length){
            const currentSymbol = expression[i];

            if(currentSymbol === ' '){
                i+=1;
                continue;
            }

            if(currentSymbol >= '0' && currentSymbol <= '9'){
                let num = "";
                let dotFlag = false;
                while(i<expression.length){
                    if(expression[i] >= '0' && expression[i] <= '9'){
                        num+= expression[i];
                        i+=1;
                    }else if(expression[i] === '.' && !dotFlag){
                        dotFlag = true;
                        num+=expression[i];
                        i+=1;
                    }else{
                        break;
                    }
                }
                tokens.push({type : "number", value : parseFloat(num)});
                continue;
            }

            if((currentSymbol >= 'a' && currentSymbol <= 'z') || 
               (currentSymbol >= 'A' && currentSymbol <= 'Z') || 
               currentSymbol === '_'){

                let name = "";

                while(i<expression.length && ((expression[i] >= 'a' && expression[i] <= 'z') ||
                                              (expression[i] >= 'A' && expression[i] <= 'Z') || 
                                              (expression[i] >= '0' && expression[i] <= '9') || 
                                              expression[i] === '_')){
                    name += expression[i];
                    i+=1;
                }
                
                if(!(name[0] >= 'a' && name[0] <= 'z') && 
                   !(name[0] >= 'A' && name[0] <= 'Z') && 
                   name[0] !== '_'){
                    this.#print(`Ошибка: имя переменной начинается с недопустимого символа "${name[0]}"`);
                    return [];
                }
                
                tokens.push({type : "variable", value : name});
                continue;                          
            }

            if(i+1<expression.length){
                const doubledOperator = expression.substr(i, 2);
                if(['>=', '<=', '==', '!=', '**', '&&', '||', '+=', '-=', '//'].includes(doubledOperator)){
                    tokens.push({type: "operator", value : doubledOperator});
                    i+=2;
                    continue;
                }
            }

            if('+-*/()><[]=%'.includes(currentSymbol)){
                tokens.push({type : "operator", value : currentSymbol});
                i+=1;
                continue;
            }

            this.#print(`Недопустимый символ "${currentSymbol}"`);
            return [];
        }
        return tokens;
    }

    #buildRPN(tokens){
        const outPut = [];
        const stack = [];
        const importance = {
            "**" : 5,
            "*" : 4, "/" : 4, 
            "+" : 3, "-" : 3, 
            ">=" : 2, "<=" : 2, 
            "==": 2, "!=" : 2, 
            ">" : 2, "<" : 2,
            "&&" : 1, "||" : 0
        };

        for(const token of tokens){
            if(token.type === "number" || token.type === "variable"){
                outPut.push(token);
            }
            else if(token.value === "(" || token.value === "["){
                stack.push(token);
            }
            else if(token.value === ")" || token.value === "]"){
                while(stack.length > 0 && 
                      stack[stack.length-1].value !== "(" && 
                      stack[stack.length-1].value !== "["){
                    outPut.push(stack.pop());
                }

                stack.pop();

                if(token.value === "]"){
                    outPut.push({type: "operator", value: "arrayAccess"}); 
                }
            }
            else{
                while(stack.length>0 && stack[stack.length-1].type === "operator" &&
                    stack[stack.length-1].value !== "(" &&
                    stack[stack.length-1].value !== "[" &&
                    importance[stack[stack.length-1].value] >= importance[token.value]){
                        outPut.push(stack.pop());
                }
                stack.push(token);
            }
        }

        while(stack.length>0){
            outPut.push(stack.pop());
        }
        return outPut;
    }

    #buildExpressionTree(rpn) {
        const stack = [];
        
        for (const token of rpn) {
            if (token.type === 'number') {
                stack.push(new NumberNode(token.value));
            }
            else if (token.type === 'variable') {
                stack.push(new VariableNode(token.value));
            }
            else if(token.value === 'arrayAccess'){
                const index = stack.pop();
                const array = stack.pop();
                stack.push(new ArrayAccessNode(array, index));
            }
            else { 
                const right = stack.pop();
                const left = stack.pop();

                stack.push(new BinaryOperationNode(left, right, token.value));
            }
        }
        return stack[0];
    }

    #buildExpressionNode(text) {
        if (!text.trim()){
            return new NumberNode(0);
        }

        if (text.includes('=')) {
            const parts = text.split('=').map(s => s.trim());
            if (parts.length === 2) {
                const namePart = parts[0];
                const valueText = parts[1];

                const nameTokens = this.#tokenize(namePart);

                if (nameTokens.length === 1 && nameTokens[0].type === 'variable') {
                    const name = nameTokens[0].value;
                    
                    if (!this.#isValidVariableName(name)) {
                        this.#print(`Ошибка: некорректное имя переменной "${name}"`);
                        return new NumberNode(0);
                    }
                    
                    const valueNode = this.#buildExpressionNode(valueText);
                    return new ForInitNode(name, valueNode);
                }
            }
        }
        
        const tokens = this.#tokenize(text);

        if (tokens.length === 0){
            return new NumberNode(0);
        }
        
        const rpn = this.#buildRPN(tokens);
        return this.#buildExpressionTree(rpn);
    }

    #parseAsArray(text) {
        if (!text.trim()) {
            return new ArrayLiteralNode([]);
        }
        
        const parts = text.split(',').map(part => part.trim());
        const elements = [];
        
        for (const part of parts) {
            if (part) {
                elements.push(this.#buildExpressionNode(part));
            }
        }
        
        return new ArrayLiteralNode(elements);
    }
}
