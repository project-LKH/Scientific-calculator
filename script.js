const input = document.getElementById("display")

window.addEventListener('load', () => {
    input.focus();
});

function updateDisplay(value) {
    if (/[a-z]/.test(value)) value += "("
    input.value += value;

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function convertTrigFunctions(expression) {
    const patterns = {
        'sin\\(.*?\\)': Math.sin,
        'cos\\(.*?\\)': Math.cos,
        'tan\\(.*?\\)': Math.tan,
    };

    function toRadians(angle) {
        return angle * (Math.PI / 180);
    }

    function parseExpression(expr) {

        const tokens = expr.split(/([+\-*/])/);

        // Calculate basic arithmetic
        let result = parseFloat(tokens[0]);

        for (let i = 1; i < tokens.length; i += 2) {
            const operator = tokens[i];
            const value = parseFloat(tokens[i + 1]);

            switch (operator) {
                case '+': result += value; break;
                case '-': result -= value; break;
                case '*': result *= value; break;
                case '/': result /= value; break;
                default: break;
            }
        }
        return result;
    }

    let result = expression;

    for (const [pattern, func] of Object.entries(patterns)) {
        result = result.replace(new RegExp(pattern, 'g'), (match, p1) => {
            const value = match.match(/(?<=\().*?(?=\))/)[0];
            console.log({ match, p1, value })

            const arg = parseExpression(value);
            return func(toRadians(arg));
        });
    }

    return result;
}

function backspace() {
    let updatedValue = input.value.split("")
    updatedValue.pop()
    input.value = updatedValue.join("")
}
function clearDisplay() {
    input.value = '';
    input.focus();
}
function calculateAnswer(equation) {
    equation = convertTrigFunctions(equation)
    return eval(equation)
}
function displayAnswer() {
    const equation = input.value
    clearDisplay()
    updateDisplay(calculateAnswer(equation))
}