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

function clearDisplay() {
    input.value = '';
    input.focus();
}
function calculateAnswer(equation){
    
    return eval(equation)
}
function displayAnswer() {
    const equation = input.value
    clearDisplay()
    updateDisplay(calculateAnswer(equation))
}