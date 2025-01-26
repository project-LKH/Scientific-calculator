const input = document.getElementById("display")

window.addEventListener('load', () => {
    input.focus();
});

function updateDisplay(value) {
    if (/[sin|cos|tan|ln|log|^|√]/.test(value)) value += "("
    input.value += value;

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function convertFunctions(expression) {
    const patterns = {
        'sin\\([^()]*(?:\$[^()]*\$[^()]*)*\\)': Math.sin,
        'cos\\([^()]*(?:\$[^()]*\$[^()]*)*\\)': Math.cos,
        'tan\\([^()]*(?:\$[^()]*\$[^()]*)*\\)': Math.tan,
        'log\\([^()]*(?:\$[^()]*\$[^()]*)*\\)': Math.log,
        '√\\([^()]*(?:\$[^()]*\$[^()]*)*\\)': Math.sqrt,
    };

    function toRadians(angle) {
        return angle * (Math.PI / 180);
    }

    let result = expression;

    for (const [pattern, trigFunc] of Object.entries(patterns)) {
        result = result.replace(new RegExp(pattern, 'g'), (matchingTrig) => {
            const value = matchingTrig.match(/(?<=\().*?(?=\))/)[0];
            console.log(matchingTrig,trigFunc,value)
            if (matchingTrig.includes("sin") || matchingTrig.includes("cos") || matchingTrig.includes("tan")) return trigFunc(toRadians(calculateBODMAS(value)));
            if (matchingTrig.includes("log")||matchingTrig.includes("√")) return trigFunc(calculateBODMAS(value))
        });
    }

    return result;
}

function backspace() {
    let updatedValue = input.value.split("")
    updatedValue.pop()
    input.value = updatedValue.join("");
}

function clearDisplay() {
    input.value = '';
}

function calculateAnswer(equation) {
    equation = convertFunctions(equation)
    console.log(equation)
    return calculateBODMAS(equation)
}

function displayAnswer() {
    const equation = input.value
    clearDisplay()
    updateDisplay(calculateAnswer(equation))
}

function calculateBODMAS(expression) {


    if (!expression.includes('(')) {
        return evaluateSimpleExpression(expression);
    }

    let openingBracket = -1;
    let closingBracket = -1;
    let depth = 0;

    for (let i = 0; i < expression.length; i++) {
        if (expression[i] === '(') {
            depth++;
            if (openingBracket === -1) openingBracket = i;
        }
        else if (expression[i] === ')') {
            depth--;
            if (depth === 0) {
                closingBracket = i;
                break;
            }
        }
    }

    const beforeBracket = expression.substring(0, openingBracket);
    const insideBracket = expression.substring(openingBracket + 1, closingBracket);
    const afterBracket = expression.substring(closingBracket + 1);

    const evaluatedInside = calculateBODMAS(insideBracket);

    const newExpression = beforeBracket + evaluatedInside + afterBracket;
    return calculateBODMAS(newExpression);
}

function evaluateSimpleExpression(expr) {
    const tokens = [];
    let currentNumber = '';

    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];

        if (char === '-' && (i === 0 || /[+\-*/]/.test(expr[i - 1]))) {
            currentNumber = '-';
        }
        else if (/[+\-*/]/.test(char)) {
            if (currentNumber) {
                tokens.push(currentNumber);
                currentNumber = '';
            }
            tokens.push(char);
        }
        else if (/[\d.]/.test(char)) {
            currentNumber += char;
        }
    }

    if (currentNumber) {
        tokens.push(currentNumber);
    }

    let i = 0;
    while (i < tokens.length) {
        if (tokens[i] === '*' || tokens[i] === '/') {
            const left = parseFloat(tokens[i - 1]);
            const right = parseFloat(tokens[i + 1]);
            let result;

            if (tokens[i] === '*') {
                result = left * right;
            } else {
                if (right === 0) throw new Error("Division by zero");
                result = left / right;
            }

            tokens.splice(i - 1, 3, result.toString());
            i--;
        }
        i++;
    }

    let result = parseFloat(tokens[0]);
    for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const value = parseFloat(tokens[i + 1]);

        if (operator === '+') result += value;
        if (operator === '-') result -= value;
    }

    return result;
}
