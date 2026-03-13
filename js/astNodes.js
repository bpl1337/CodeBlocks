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
        interpreter.setVariable(this.#name, 0);
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

class ForNode extends ASTNode {
    #init;
    #condition;
    #step;
    #body;

    constructor(init, condition, step, body) {
        super();
        this.#init = init;
        this.#condition = condition;
        this.#step = step;
        this.#body = body;
    }

    execute(interpreter) {
        if (this.#init) {
            if (this.#init instanceof ASTNode) {
                this.#init.execute(interpreter);
            } else {
                this.#init.evaluate(interpreter);
            }
        }

        while (true) {
            const conditionValue = this.#condition.evaluate(interpreter);
            if (!conditionValue) break;
            
            this.#body.execute(interpreter);
            
            if (this.#step) {
                if (this.#step instanceof ASTNode) {
                    this.#step.execute(interpreter);
                } else {
                    this.#step.evaluate(interpreter);
                }
            }
        }
    }
}

class ElseIfNode extends ASTNode {
    #condition;
    #body;
    #elseBody;

    constructor(condition, body, elseBody){
        super();
        this.#condition = condition;
        this.#body = body;
        this.#elseBody = elseBody;
    }

    execute(interpreter){
        const conditionValue = this.#condition.evaluate(interpreter);
        if(conditionValue){
            this.#body.execute(interpreter);
        }
        else{
            this.#elseBody.execute(interpreter);
        }
    }
}

class ArrayDeclarationNode extends ASTNode{
    #name;
    #arrayNode

    constructor(name, arrayNode){
        super();
        this.#name = name;
        this.#arrayNode = arrayNode;
    }

    execute(interpreter){
        const arrayValue = this.#arrayNode.evaluate(interpreter);
        
        if (!Array.isArray(arrayValue)) {
            interpreter.print(`${arrayValue} не массив`);
            return null;
        }
        
        interpreter.declareVariable(this.#name);
        interpreter.setVariable(this.#name, arrayValue);
    }

    get name(){
        return this.#name;
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
        const arrayValue = this.#array.evaluate(interpreter);
        const indexValue = this.#index.evaluate(interpreter);
        const valueValue = this.#value.evaluate(interpreter);

        if(!Array.isArray(arrayValue)){
            interpreter.print(`${arrayValue} не массив`);
            return null;
        }

        if(indexValue < 0 || indexValue >= arrayValue.length) {
            interpreter.print(`List index out of range`);
            return null;
        }

        arrayValue[indexValue] = valueValue;

        const arrayName = this.#array.name;
        if(arrayName){
            interpreter.setVariable(arrayName, arrayValue);
        }
    }
}
