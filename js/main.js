
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

        runButton.addEventListener("click", click => {
            this.#run();
        });

        let clearButton = document.getElementById("clearBtn");

        clearButton.addEventListener("click", click => {
            this.#clearConsole();
            this.#clearVariables();
            this.#clearWorkSpace();
        });
    }

    #print(text){
        this.#consolePanel.innerHTML += text + '<br>';
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

        const programNode = this.#buildProgramNode(blocks);

        programNode.execute(this);

    }

    #buildProgramNode(blocks){

        const statements = [];

        let i = 0;

        while(i<blocks.length){

            const block = blocks[i];
            const blockElement = block.querySelector("div:first-child");

            if(!blockElement){
                i+=1;
                continue;
            }

            if(blockElement.querySelector('input[name="var-name"]')){

                const name = blockElement.querySelector('input[name="var-name"]').value;

                statements.push(new DeclarationNode(name));
                
                i+=1;

            }else if(blockElement.querySelector('input[name="assign-name"]')){

                const name = blockElement.querySelector('input[name="assign-name"]').value;

                const expressionText = blockElement.querySelector('input[name="assign-value"]').value;

                const expressionNode = this.#buildExpressionNode(expressionText);

                statements.push(new AssignmentNode(name, expressionNode));
                i+=1;
            }else if(blockElement.querySelector('input[name="print-value"]')){

                const expressionText = blockElement.querySelector('input[name="print-value"]').value;

                const expressionNode = this.#buildExpressionNode(expressionText);

                statements.push(new PrintNode(expressionNode));
                i+=1;
            }else{
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

            if(currentSymbol === " "){
                i+=1;
                continue;
            }

            if(currentSymbol >= '0' && currentSymbol <= '9'){
                let num = "";
                while(i<expression.length && expression[i] >= '0' && expression[i] <= '9'){
                    num+= expression[i];
                    i+=1;
                }
                tokens.push({type : "number", value : parseInt(num)});
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

            if('+-*/()'.includes(currentSymbol)){
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
        const importance = {"+" : 1, "-" : 1, "*" : 2, "/" : 2};
        //[3] [+] [5] [*] [2] [-] [(] [8] [/] [4] [+] [2] [)] [*] [(] [7] [-] [3] [)] [^] [2]

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
            interpreter.print(`Переменная ${this.#name} не объявлена`);
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
            interpreter.print(`Переменная ${this.#name} не объявлена`);
            return;
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
            default:
                interpreter.print(`Неизвестный оператор ${this.#operator}`);
                return;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new Interpreter(
        document.querySelector(".interpreter-console"),
        document.querySelector(".for-variables"),
        document.querySelector(".work-pos")
    );
});
