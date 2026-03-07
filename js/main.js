
class Interpreter{
    #variables =new Map();
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
            });
        }
    }

    #print(text){
        this.#consolePanel.innerHTML +=">> "+ text + '<br>';
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

    #run(){
        this.#clearConsole();
        this.#clearVariables();

        const blocks = this.#workSpace.querySelectorAll(".workspace-block-container");

        if(blocks.length === 0){
            return;
        }

        const programNode = this.#buildProgramNode(blocks, false);

        programNode.execute(this);

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

                statements.push(new DeclarationNode(name));
                
                i+=1;

            }else if(blockElement.querySelector(':scope > input[name="assign-name"]')){

                const name = blockElement.querySelector(':scope > input[name="assign-name"]').value;

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

                const conditionText = blockElement.querySelector('input[name="if-condition"]').value;
                const childrenContainer = blockElement.querySelector(':scope > .block-children');
                const bodyBlocks = [];

                if(childrenContainer){

                    const indoorBlocks = childrenContainer.querySelectorAll('.workspace-block-container');
                    indoorBlocks.forEach(indoorBlock => bodyBlocks.push(indoorBlock));
                }

                const conditionNode = this.#buildExpressionNode(conditionText);
                const bodyNode = this.#buildProgramNode(bodyBlocks, true);

                statements.push(new IfNode(conditionNode, bodyNode));

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

            if(currentSymbol >= 'a' && currentSymbol <= 'z' || currentSymbol >='A' && currentSymbol <='Z'){

                let name = "";

                while(i<expression.length && (expression[i] >= 'a' && expression[i] <= 'z' ||
                                              expression[i] >= 'A' && expression[i] <= 'Z' || 
                                              expression[i] >= '0' && expression[i] <= '9' || 
                                              expression[i] === '_')){
                    name += expression[i];
                    i+=1;
                }
                tokens.push({type : "variable", value : name});
                continue;                          
            }

            if(i+1<expression.length){
                const doubledOperator = expression.substr(i, 2);
                if(['>=', '<=', '==', '!=', '**', '&&', '||'].includes(doubledOperator)){
                    tokens.push({type: "operator", value : doubledOperator});
                    i+=2;
                    continue;
                }
            }

            if('+-*/()><[]'.includes(currentSymbol)){
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
            "[" : 6, "]": 6,
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
            else if(token.value === "("){

                stack.push(token);

            }
            else if(token.value === ")"){

                while(stack.length > 0 && stack[stack.length-1].value != "("){

                    outPut.push(stack.pop());
                }

                stack.pop();
            }
            else{
                
                while(stack.length>0 && stack[stack.length-1].type === "operator" &&
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
        
        const tokens = this.#tokenize(text);

        if (tokens.length === 0){

             return new NumberNode(0);
        }
        
        const rpn = this.#buildRPN(tokens);
        return this.#buildExpressionTree(rpn);
    }
}

class ASTNode{
    execute(){}
}

class ExpressionNode{
    evaluate(){}
}

class ProgramNode extends ASTNode{

    #statements;

    constructor(statements){
        super();
        this.#statements = statements;
    }

    execute(interpreter){
        for(const statement of this.#statements){
            statement.execute(interpreter);
        }
    }
}

class DeclarationNode extends ASTNode{

    #name;

    constructor(name){
        super();
        this.#name = name;
    }

    execute(interpreter){

        interpreter.declareVariable(this.#name);

    }

    get name(){
        return this.#name;
    }
}

class PrintNode extends ASTNode{

    #expression;

    constructor(expression){
        super();
        this.#expression = expression;
    }

    execute(interpreter){
        const value = this.#expression.evaluate(interpreter);

        interpreter.print(value);
    }

    get expression(){
        return this.#expression;
    }
}

class AssignmentNode extends ASTNode{

    #name;
    #expression;
    
    constructor(name, expression){
        super();
        this.#expression = expression;
        this.#name = name;
    }

    execute(interpreter){
        if(!interpreter.hasVariable(this.#name)){
            interpreter.print(`Ошибка, переменная "${this.#name}" не объявлена`)
            return;
        }

        const value = this.#expression.evaluate(interpreter);

        interpreter.setVariable(this.#name, value);

    }

    get name(){
        return this.#name;
    }

    get expression(){
        return this.#expression;
    }

}

class NumberNode extends ExpressionNode{

    #value;

    constructor(value){
        super();
        this.#value = value;
    }

    evaluate(interpreter){
        return this.#value;
    }

}

class VariableNode extends ExpressionNode{
    
    #name;

    constructor(name){
        super();
        this.#name = name;
    }

    evaluate(interpreter){

        const value = interpreter.getVariable(this.#name);

        if(value === undefined){
            return `Error initializing a variable "${this.#name}"`;
        }

        return value;
    }

    get name(){
        return this.#name;
    }
}

class BinaryOperationNode extends ExpressionNode{

    #leftOperand;
    #rightOperand;
    #operator;

    constructor(left, right, operator){
        super();
        this.#leftOperand = left;
        this.#rightOperand = right;
        this.#operator = operator;
    }

    evaluate(interpreter){

        const leftOperandValue = this.#leftOperand.evaluate(interpreter);
        const rightOperandValue = this.#rightOperand.evaluate(interpreter);

        switch(this.#operator){
            case '+' : 
                return leftOperandValue + rightOperandValue;
            case '-' : 
                return leftOperandValue - rightOperandValue;
            case '*' :
                return leftOperandValue * rightOperandValue;
            case '/' : 
                if(rightOperandValue === 0){
                    interpreter.print(`Ошибка деление на 0`);
                    return;
                }
                return leftOperandValue / rightOperandValue;
            case '>' : 
                return leftOperandValue>rightOperandValue;
            case '<' :
                return leftOperandValue<rightOperandValue;
            case '**' : 
                return leftOperandValue**rightOperandValue;
            case '>=' :
                return leftOperandValue>=rightOperandValue;
            case '<=' : 
                return leftOperandValue<=rightOperandValue;
            case '==' :
                return leftOperandValue == rightOperandValue;
            case '!=' :
                return leftOperandValue!=rightOperandValue;
            case '&&' : 
                return leftOperandValue && rightOperandValue;
            case '||' : 
                return leftOperandValue || rightOperandValue;
            default:
                interpreter.print(`Неизвестный оператор ${this.#operator}`);
                return;
        }
    }
}

class IfNode extends ASTNode{

    #condition;
    #body;

    constructor(condition, body){
        super();
        this.#condition = condition;
        this.#body = body;
    }

    execute(interpreter){
        
        const conditionValue = this.#condition.evaluate(interpreter);

        if(conditionValue){
            this.#body.execute(interpreter);
        }
    }
}

class ArrayDeclarationNode extends ASTNode{

    #name;
    #elements;

    constructor(name, elements){
        super();
        this.#name = name;
        this.#elements = elements;
    }

    execute(interpreter){

        const arrayValues = [];
        
        for(const element of this.#elements){
            arrayValues.push(element.evaluate(intertreter));
        }

        intertreter.declareVariable(this.#name);
        interpreter.setVariable(this.#name, arrayValues);
    }
}

class ArrayAccessNode extends ExpressionNode{

    #array;
    #index;

    constructor(array, index){
        super();
        this.#array = array;
        this.#index = index;
    }

    evaluate(interpreter){

        const arrayValue = this.#array.evaluate(interpreter);
        const indexValue = this.#index.evaluate(interpreter);

        if(!Array.isArray(arrayValue)){
            intertpreter.print(`${arrayValue} не массив`);
            return null;
        }

        if(indexValue < 0 || indexValue >= arrayValue.length){
            interpreter.print("List index out of range");
            return null;
        }

        return arrayValue[indexValue];
    }
}

class ArrayAssignmentNode extends ASTNode{

    #array;
    #index;
    #value;

    constructor(array, index, value){

        super();
        this.#array = array;
        this.#index = index;
        this.#value = value;
    }

    execute(interpreter){
        const ArrayValue = this.#array.evaluate(interpreter);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new Interpreter(
        document.querySelector(".interpreter-console"),
        document.querySelector(".for-variables"),
        document.querySelector(".work-pos")
    );
});
