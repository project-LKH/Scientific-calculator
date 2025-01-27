const input = document.getElementById("display")

window.addEventListener('load', () => {
    input.focus();
    document.querySelectorAll(".number").forEach((button) => {
        button.addEventListener("click", () => updateDisplay(button.getAttribute("data-value")))
    })
    document.querySelectorAll(".operator").forEach((button) => {
        button.addEventListener("click", () => updateDisplay(button.getAttribute("data-value")))
    })
});

function updateDisplay(value) {
    if (/(sin|cos|tan|ln|log|\^|√)/.test(value)) value += "("
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

    for (const [pattern, trigFunc] of Object.entries(patterns)) {
        expression = expression.replace(new RegExp(pattern, 'g'), (matchingTrig) => {
            const value = matchingTrig.match(/(?<=\().*?(?=\))/)[0];
            if (matchingTrig.includes("sin") || matchingTrig.includes("cos") || matchingTrig.includes("tan")) return trigFunc(toRadians(calculateBODMAS(value)));
            if (matchingTrig.includes("log") || matchingTrig.includes("√")) return trigFunc(calculateBODMAS(value))
        });
    }

    return expression;
}
// function convertFunctions(expression) {
//     const patterns = {
//         'sin\$([^()]*(?:\\([^()]*\$[^()]*)*)\\)': Math.sin,
//         'cos\$([^()]*(?:\\([^()]*\$[^()]*)*)\\)': Math.cos,
//         'tan\$([^()]*(?:\\([^()]*\$[^()]*)*)\\)': Math.tan,
//         'log\$([^()]*(?:\\([^()]*\$[^()]*)*)\\)': Math.log,
//         '\\√\$([^()]*(?:\\([^()]*\$[^()]*)*)\\)': Math.sqrt,
//     };

//     let result = expression;
//     let previousResult;

//     do {
//         previousResult = result;
//         for (const [pattern, trigFunc] of Object.entries(patterns)) {
//             const regex = new RegExp(pattern);
//             const match = regex.exec(result);
//             console.log({ regex, result, match })
//             if (match) {
//                 const innerExpression = match[1];
//                 const evaluatedInner = convertFunctions(innerExpression);

//                 const evaluated = calculateBODMAS(evaluatedInner.toString());
//                 const inRadians = (trigFunc === Math.sin || trigFunc === Math.cos || trigFunc === Math.tan)
//                     ? toRadians(evaluated)
//                     : evaluated;
//                 const calculated = trigFunc(inRadians);

//                 result = result.replace(match[0], calculated);
//             }
//         }
//     } while (result !== previousResult);


//     if (!isNaN(result)) {
//         return result;
//     }
//     return calculateBODMAS(result);
// }

function backspace() {
    const updatedValue = input.value.split("")
    updatedValue.pop()
    input.value = updatedValue.join("")
}
function clearDisplay() {
    input.value = '';
}

function calculateAnswer(equation) {
    equation = convertFunctions(equation)
    return calculateBODMAS(equation)
}

function displayAnswer() {
    const equation = input.value
    clearDisplay()
    try {
        if (/[\+]{2,}|[\-]{3,}|[\/]{2,}|[\*]{2,}|[\^]{2,}/.test(equation)) {
            throw new Error("Invalid operator repetition detected. Operators cannot be repeated (except -- for negative numbers).");
        }
        updateDisplay(calculateAnswer(equation))
    } catch (err) {
        if (err.message.includes("call stack" || "cannot")) {
            clearDisplay()
            window.alert("Invalid input")
        }
        else {
            clearDisplay()
            window.alert(err.message)
        }
    }
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

    const isExponent = beforeBracket.endsWith('^');

    if (isExponent) {
        let baseStr = '';
        let i = beforeBracket.length - 2;

        while (i >= 0 && !/[+\-*/]/.test(beforeBracket[i])) {
            baseStr = beforeBracket[i] + baseStr;
            i--;
        }

        const beforeBase = beforeBracket.substring(0, i + 1);
        const base = parseFloat(baseStr);
        const exponent = calculateBODMAS(insideBracket);


        const result = Math.pow(base, exponent);
        const newExpression = beforeBase + result + afterBracket;
        return calculateBODMAS(newExpression);
    }

    const evaluatedInside = calculateBODMAS(insideBracket);

    const newExpression = beforeBracket + evaluatedInside + afterBracket;
    return calculateBODMAS(newExpression);
}

function evaluateSimpleExpression(expr) {
    function calculateWithDecimals(a, b, operation) {
        const [aInt = '0', aDec = ''] = a.toString().split('.');
        const [bInt = '0', bDec = ''] = b.toString().split('.');
        
        if (operation === '*') {
            const aFactor = BigInt('1' + '0'.repeat(aDec.length));
            const bFactor = BigInt('1' + '0'.repeat(bDec.length));
            
            const aNumber = BigInt(aInt + aDec) || 0n;
            const bNumber = BigInt(bInt + bDec) || 0n;
            
            const result = (aNumber * bNumber).toString();
            
            const factorResult = (aFactor * bFactor).toString();

            const leadingZeros = factorResult.length - result.length;
            const paddedResult = '0'.repeat(Math.max(0, leadingZeros)) + result;
            
            return insertDecimalPoint(paddedResult, factorResult.toString().length - 1);
        }
        
        const decimalPlaces = Math.max(aDec.length, bDec.length);
        const aPaddedDec = aDec.padEnd(decimalPlaces, '0');
        const bPaddedDec = bDec.padEnd(decimalPlaces, '0');
        
        const aNumber = BigInt(aInt + aPaddedDec);
        const bNumber = BigInt(bInt + bPaddedDec);
        
        let result;
        if (operation === '+') {
            result = aNumber + bNumber;
        } else if (operation === '-') {
            result = aNumber - bNumber;
        }
        
        return insertDecimalPoint(result.toString(), decimalPlaces);
    }

    function insertDecimalPoint(numStr, decimalPlaces) {
        if (decimalPlaces === 0) return numStr;
        
        while (numStr.length <= decimalPlaces) {
            numStr = '0' + numStr;
        }
        
        const insertAt = numStr.length - decimalPlaces;
        let result = numStr.slice(0, insertAt) + '.' + numStr.slice(insertAt);
        result = result.replace(/\.?0+$/, '');
        
        return result;
    }


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
            const left = tokens[i - 1];
            const right = tokens[i + 1];
            let result;

            if (tokens[i] === '*') {
                result = calculateWithDecimals(left, right, '*');
            } else {
                if (right === '0') throw new Error("Division by zero");
                result = (Number(left) / Number(right)).toString();
            }

            tokens.splice(i - 1, 3, result);
            i--;
        }
        i++;
    }

    let result = tokens[0];
    for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const value = tokens[i + 1];
        
        result = calculateWithDecimals(result, value, operator);
    }

    return result;
}
