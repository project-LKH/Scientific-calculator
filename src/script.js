const input = document.getElementById("display")

window.addEventListener('load', () => {
    input.focus();

    document.querySelectorAll(".number, .operator").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.getAttribute("data-value");

            if (value === '√') {
                createRootModal();
            } else if (value === 'log') {
                createLogModal();
            } else {
                updateDisplay(value);
            }
        });
    });
});

function createRootModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rootModal';

    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <h2>Enter Root Values</h2>
            <div class="modal-inputs">
                    <label>Root (n):</label>
                    <input type="number" id="rootValue" min="1">
            </div>
            <div class="modal-buttons">
                <button class="operator" onclick="displayRoot()">Update</button>
                <button class="clear" onclick="closeModal('rootModal')">Cancel</button>
            </div>
        </div>
    `;

    document.querySelector('.modal-container').appendChild(modal);

    const overlay = modal.querySelector('.modal-overlay');
    overlay.addEventListener('click', closeModal);

    document.getElementById('rootValue').focus();
}

function createLogModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'logModal';

    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <h2>Enter Root Values</h2>
            <div class="modal-inputs">
                    <label>base (x):</label>
                    <input type="number" id="baseValue" min="1">
                    <label>value (y):</label>
                    <input type="number" id="value" min="1">
            </div>
            <div class="modal-buttons">
                <button class="operator" onclick="displayLog()">Update</button>
                <button class="clear" onclick="closeModal('logModal')">Cancel</button>
            </div>
        </div>
    `;

    document.querySelector('.modal-container').appendChild(modal);

    const overlay = modal.querySelector('.modal-overlay');
    overlay.addEventListener('click', closeModal);

    document.getElementById('baseValue').focus();
}

function closeModal(modalID) {
    const modal = document.getElementById(modalID);
    if (modal) {
        modal.remove();
    }
}

function displayRoot() {
    const rootValue = document.getElementById('rootValue').value;

    if (!rootValue) {
        alert('Please enter a value for the root');
        return;
    }

    input.value += `((${rootValue})√(`;

    closeModal("rootModal");
}

function displayLog() {
    const base = document.getElementById('baseValue').value;
    const value = document.getElementById('value').value;

    if (!base || !value) {
        alert('Please enter a base and value');
        return;
    }

    input.value += `log(${base},${value})`;

    closeModal("logModal");
}

function backspace() {
    if (!input.value) return '';

    const patterns = [
        'sin(',
        'cos(',
        'tan(',
        'log(',
        '^(',
        /\(\(\d+\)√\($/,
    ];

    for (const pattern of patterns) {
        if (typeof pattern === 'string') {
            if (input.value.endsWith(pattern)) {
                input.value = input.value.slice(0, -pattern.length);
                updateBracketValidation()
                return
            }
        } else if (pattern instanceof RegExp) {
            const match = input.value.match(pattern);
            if (match) {
                input.value = input.value.slice(0, -match[0].length);
                updateBracketValidation()
                return
            }
        }
    }


    input.value = input.value.slice(0, -1);
    updateBracketValidation()
}

function checkBrackets(expression) {
    const positions = [];
    let openBracketCount = 0
    let message = "";
    let isValid = true;

    for (let i = 0; i < expression.length; i++) {
        if (expression[i] === '(') {
            openBracketCount++;
            positions.push(i + 1);
        }
        else if (expression[i] === ')') {
            if (openBracketCount === 0) {
                message = `Extra closing bracket found at position ${i + 1}`;
                isValid = false;
                break;
            }
            openBracketCount--
            positions.pop();
        }
    }

    if (openBracketCount > 0 && isValid) {
        message = `Unclosed bracket(s) found at position(s): ${positions.join(', ')}`;
        isValid = false;
    }

    return isValid ? "" : message
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
    messageDiv.textContent = result;
}

function clearDisplay() {
    input.value = '';
    document.getElementById('validation-message').textContent = '';
}

function validateEquation(equation) {
    if (/[\+]{2,}|[\-]{3,}|[\/]{2,}|[\*]{2,}|[\^]{2,}/.test(equation)) {
        throw new Error("Invalid input: operator repetition detected. Operators cannot be repeated (except -- for negative numbers).");
    }
    if (/\d+(sin|cos|tan|log)/.test(equation)) {
        throw new Error('Invalid input: Implicit multiplication with functions is not allowed');
    }
    if (/\d+\(|\)[a-z\d]/.test(equation)) {
        throw new Error('Invalid input: Missing operators between terms');
    }
    if (/^[\/+*]/.test(equation)) {
        throw new Error('Invalid input: equation cannot start with /, + or *');
    }
}

function displayAnswer() {
    try {
        const equation = input.value
        clearDisplay()
        validateEquation(equation)
        updateDisplay(calculateAnswer(equation))
    } catch (err) {
        clearDisplay()
        alert(err.message.includes("call stack" || "cannot") ? "Invalid input" : err.message)
    }
}

function calculateAnswer(equation) {
    const roundResult = (number) => Number(parseFloat(number).toFixed(10));
    const answer = applyPEMDAS(evaluateFunctions(equation))
    return /\.\d{10,}$/.test(answer) ? roundResult(answer) : answer
}

const mathUtils = {
    toRadians: angle => angle * (Math.PI / 180),
    getValueBetweenBrackets: str => {
        const start = str.indexOf('(') + 1;
        const end = str.lastIndexOf(')');
        return str.substring(start, end);
    },
    getBaseLog: match => {
        const [x, y] = match.split(",");
        return Math.log(y) / Math.log(x);
    },
    nthRoot: (num, root) => num ** (1 / root)
};

function evaluateFunctions(expression) {
    const patterns = {
        'sin\\([^()]*\\)': Math.sin,
        'cos\\([^()]*\\)': Math.cos,
        'tan\\([^()]*\\)': Math.tan,
        'log\\([^()]*\\)': (match) => mathUtils.getBaseLog(match),
        '\\(\\((\\d+)\\)√\\([^()]*\\)\\)': (match) => {
            const root = match.match(/\d+/)[0];
            const num = match.match('√\\(([^()]*)\\)\\)')[1]
            return mathUtils.nthRoot(applyPEMDAS(num), root);
        },
    };

    function processNestedFunctions(expr) {
        let prevExpr;
        do {
            prevExpr = expr;
            for (const [pattern, matchingFunction] of Object.entries(patterns)) {
                expr = expr.replace(new RegExp(pattern, 'g'), (matchingTrig) => {
                    if (matchingTrig.includes('√')) return matchingFunction(matchingTrig);

                    const value = mathUtils.getValueBetweenBrackets(matchingTrig)

                    if (matchingTrig.includes('log')) return matchingFunction(value);

                    const processedValue = processNestedFunctions(value);

                    if (matchingTrig.includes("sin") || matchingTrig.includes("cos") || matchingTrig.includes("tan"))
                        return Number(matchingFunction(mathUtils.toRadians(Number(processedValue))));
                });
            }
        } while (prevExpr !== expr);

        return applyPEMDAS(expr);
    }

    return processNestedFunctions(expression);
}

function applyPEMDAS(expression) {
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
        const exponent = applyPEMDAS(insideBracket);


        const result = Math.pow(base, exponent);
        const newExpression = beforeBase + result + afterBracket;
        return applyPEMDAS(newExpression);
    }

    const evaluatedInside = applyPEMDAS(insideBracket);

    const newExpression = beforeBracket + evaluatedInside + afterBracket;
    return applyPEMDAS(newExpression);
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
