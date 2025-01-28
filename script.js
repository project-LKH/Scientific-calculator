const input = document.getElementById("display")

// Add these functions
function createRootModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rootModal';

    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <h2>Enter Root Values</h2>
            <div class="modal-inputs">
                <div class="input-group">
                    <label>Root (n):</label>
                    <input type="number" id="rootValue" min="1">
                </div>
            </div>
            <div class="modal-buttons">
                <button class="operator" onclick="calculateRoot()">Update</button>
                <button class="clear" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;

    document.querySelector('.modal-container').appendChild(modal);

    const overlay = modal.querySelector('.modal-overlay');
    overlay.addEventListener('click', closeModal);

    // Focus on first input
    document.getElementById('rootValue').focus();
}

function closeModal() {
    const modal = document.getElementById('rootModal');
    if (modal) {
        modal.remove();
    }
}

function calculateRoot() {
    const rootValue = document.getElementById('rootValue').value;

    if (!rootValue ) {
        alert('Please enter a value for the root');
        return;
    }

    input.value += `((${rootValue})√(`;

    closeModal();
}

window.addEventListener('load', () => {
    input.focus();

    document.querySelectorAll(".number, .operator").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.getAttribute("data-value");

            if (value === '√') {
                createRootModal();
            } else {
                updateDisplay(value);
            }
        });
    });
});


function backspace() {
    input.value = input.value.length ? input.value.slice(0, -1) : '';
    updateBracketValidation();
}

function checkBrackets(expression) {
    const stack = [];
    let message = "";
    let isValid = true;
    
    const positions = [];
    
    for (let i = 0; i < expression.length; i++) {
        if (expression[i] === '(') {
            stack.push('(');
            positions.push(i + 1); 
        }
        else if (expression[i] === ')') {
            if (stack.length === 0) {
                message = `Extra closing bracket found at position ${i + 1}`;
                isValid = false;
                break;
            }
            stack.pop();
            positions.pop();
        }
    }
    
    if (stack.length > 0 && isValid) {
        message = `Unclosed bracket(s) found at position(s): ${positions.join(', ')}`;
        isValid = false;
    }
    
    return {
        isValid,
        message: isValid ? "" : message
    };
}


function updateDisplay(value) {
    if (/(sin|cos|tan|ln|log|\^|√)/.test(value)) value += "(";
    input.value += value;

    updateBracketValidation();

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function updateBracketValidation() {
    const messageDiv = document.getElementById('validation-message');
    const result = checkBrackets(input.value);
    
    messageDiv.textContent = result.message;
    messageDiv.className = 'validation-message ' + (result.isValid ? 'success' : 'error');
}

function clearDisplay() {
    input.value = '';
    document.getElementById('validation-message').textContent = '';
}

const nthRoot = (num, root) => num ** (1 / root);

function convertFunctions(expression) {
    const patterns = {
        'sin\\([^()]*\\)': Math.sin,
        'cos\\([^()]*\\)': Math.cos,
        'tan\\([^()]*\\)': Math.tan,
        'log\\([^()]*\\)': Math.log,
        '\\(\\((\\d+)\\)√\\([^()]*\\)\\)': (match) => {
            console.log(match)
            const root = match.match(/\d+/)[0];
            const num = match.match('√\\(([^()]*)\\)\\)')[1]
            return nthRoot(calculateBODMAS(num), root);
        },
    };

    function toRadians(angle) {
        return angle * (Math.PI / 180);
    }

    function getValue(str) {
        return str.substring(
            str.indexOf('(') + 1,
            str.lastIndexOf(')')
        );
    }

    function processNestedFunctions(expr) {
        let prevExpr;
        do {
            prevExpr = expr;
            for (const [pattern, trigFunc] of Object.entries(patterns)) {
                expr = expr.replace(new RegExp(pattern, 'g'), (matchingTrig) => {
                    console.log(matchingTrig)
                    if (matchingTrig.includes('√')) {
                        return trigFunc(matchingTrig);
                    }
                    const value = getValue(matchingTrig)
                    const processedValue = processNestedFunctions(value);

                    if (matchingTrig.includes("sin") || matchingTrig.includes("cos") || matchingTrig.includes("tan")) {
                        return Number(trigFunc(toRadians(Number(processedValue))));
                    }
                    return Number(trigFunc(Number(processedValue)));
                });
            }
        } while (prevExpr !== expr);

        return calculateBODMAS(expr);
    }

    return processNestedFunctions(expression);
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
function roundResult(number) {
    return Number(parseFloat(number).toFixed(10));
}
function calculateBODMAS(expression) {
    if (!expression.includes('(')) {
        console.log
        return roundResult(evaluateSimpleExpression(expression));
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
