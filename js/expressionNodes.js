

class ExpressionNode{
    evaluate(){}
}

class ForInitNode extends ExpressionNode {
    #name;
    #value;

    constructor(name, value) {
        super();
        this.#name = name;
        this.#value = value;
    }

    evaluate(interpreter) {
        if (!interpreter.hasVariable(this.#name)) {
            interpreter.declareVariable(this.#name);
        }
        
        const value = this.#value.evaluate(interpreter);
        interpreter.setVariable(this.#name, value);
        return value;
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
            case '%' : 
                if(rightOperandValue === 0){
                    interpreter.print(`Ошибка деление на 0`);
                    return;
                }
                return leftOperandValue % rightOperandValue;
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
                return leftOperandValue === rightOperandValue;
            case '!=' :
                return leftOperandValue!== rightOperandValue;
            case '&&' : 
                return leftOperandValue && rightOperandValue;
            case '//' : 
                return parseInt(leftOperandValue / rightOperandValue);
            case '||' : 
                return leftOperandValue || rightOperandValue;
            case '+=' : 
                const plusNewValue = leftOperandValue + rightOperandValue;

                if (this.#leftOperand instanceof VariableNode) {
                    interpreter.setVariable(this.#leftOperand.name, plusNewValue);
                }
    
                return plusNewValue;
            case '-=' :
                const minusNewValue = leftOperandValue - rightOperandValue;

                if (this.#leftOperand instanceof VariableNode) {
                    interpreter.setVariable(this.#leftOperand.name, minusNewValue);
                }
    
                return minusNewValue;
            default:
                interpreter.print(`Неизвестный оператор ${this.#operator}`);
                return;
        }
    }
}

class ArrayLiteralNode extends ExpressionNode{
    #elements;

    constructor(elements){
        super();
        this.#elements = elements;
    }

    evaluate(interpreter){
        const result = [];

        for(const element of this.#elements){
            result.push(element.evaluate(interpreter));
        }
        return result;
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
            interpreter.print(`${arrayValue} не массив`);
            return null;
        }

        if(indexValue < 0 || indexValue >= arrayValue.length){
            interpreter.print("List index out of range");
            return null;
        }

        return arrayValue[indexValue];
    }
}
