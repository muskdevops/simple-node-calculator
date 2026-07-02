(function () {
  'use strict';

  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const keys = document.querySelectorAll('.key');

  const OP_SYMBOLS = { '+': '+', '\u2212': '-', '\u00d7': '*', '\u00f7': '/' };

  let currentValue = '0';
  let previousValue = null;
  let operator = null;
  let overwrite = true; // next digit press replaces the display
  let expressionText = '';

  function formatNumber(numStr) {
    if (numStr === 'Error') return numStr;
    const [intPart, decPart] = numStr.split('.');
    const negative = intPart.startsWith('-');
    const digits = negative ? intPart.slice(1) : intPart;
    const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let out = (negative ? '-' : '') + withCommas;
    if (decPart !== undefined) out += '.' + decPart;
    return out;
  }

  function render() {
    resultEl.textContent = formatNumber(currentValue);
    expressionEl.textContent = expressionText || '\u00a0';
  }

  function flicker() {
    resultEl.classList.remove('flicker');
    // force reflow so the animation can restart
    void resultEl.offsetWidth;
    resultEl.classList.add('flicker');
  }

  function inputDigit(digit) {
    if (currentValue === 'Error') { clearAll(); }
    if (overwrite) {
      currentValue = digit === '.' ? '0.' : digit;
      overwrite = false;
      return;
    }
    if (digit === '.' && currentValue.includes('.')) return;
    if (currentValue === '0' && digit !== '.') {
      currentValue = digit;
    } else {
      if (currentValue.replace(/[-.]/g, '').length >= 12) return;
      currentValue += digit;
    }
  }

  function clearAll() {
    currentValue = '0';
    previousValue = null;
    operator = null;
    overwrite = true;
    expressionText = '';
  }

  function backspace() {
    if (currentValue === 'Error' || overwrite) { clearAll(); return; }
    currentValue = currentValue.slice(0, -1);
    if (currentValue === '' || currentValue === '-') currentValue = '0';
  }

  function negate() {
    if (currentValue === '0' || currentValue === 'Error') return;
    currentValue = currentValue.startsWith('-') ? currentValue.slice(1) : '-' + currentValue;
  }

  function percent() {
    if (currentValue === 'Error') return;
    currentValue = String(parseFloat(currentValue) / 100);
  }

  function compute(a, b, op) {
    const x = parseFloat(a);
    const y = parseFloat(b);
    switch (op) {
      case '+': return x + y;
      case '-': return x - y;
      case '*': return x * y;
      case '/': return y === 0 ? NaN : x / y;
      default: return y;
    }
  }

  function trimResult(num) {
    if (!isFinite(num)) return 'Error';
    let s = num.toFixed(10);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '' || s === '-0') s = '0';
    if (s.replace(/[-.]/g, '').length > 12) {
      s = num.toPrecision(10);
      s = parseFloat(s).toString();
    }
    return s;
  }

  function chooseOperator(symbol) {
    if (currentValue === 'Error') return;
    const opCode = OP_SYMBOLS[symbol];
    if (previousValue !== null && !overwrite) {
      const res = compute(previousValue, currentValue, operator);
      currentValue = trimResult(res);
    }
    previousValue = currentValue;
    operator = opCode;
    overwrite = true;
    expressionText = formatNumber(previousValue) + ' ' + symbol;
  }

  function equals() {
    if (operator === null || previousValue === null || currentValue === 'Error') return;
    expressionText = formatNumber(previousValue) + ' ' + Object.keys(OP_SYMBOLS).find(k => OP_SYMBOLS[k] === operator) + ' ' + formatNumber(currentValue);
    const res = compute(previousValue, currentValue, operator);
    currentValue = trimResult(res);
    previousValue = null;
    operator = null;
    overwrite = true;
    flicker();
  }

  function handleAction(action, el) {
    switch (action) {
      case 'number': inputDigit(el.dataset.num); break;
      case 'decimal': inputDigit('.'); break;
      case 'clear': clearAll(); break;
      case 'backspace': backspace(); break;
      case 'negate': negate(); break;
      case 'percent': percent(); break;
      case 'operator': chooseOperator(el.textContent.trim()); break;
      case 'equals': equals(); break;
    }
    render();
  }

  keys.forEach((key) => {
    key.addEventListener('click', () => handleAction(key.dataset.action, key));
  });

  // Visual press feedback + keyboard support
  const keyByChar = {};
  keys.forEach((key) => {
    if (key.dataset.action === 'number') keyByChar[key.dataset.num] = key;
  });
  const operatorKeys = Array.from(document.querySelectorAll('[data-action="operator"]'));
  const findOperatorKey = (ch) => operatorKeys.find(k => OP_SYMBOLS[k.textContent.trim()] === ch);

  function pressVisual(el) {
    if (!el) return;
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 110);
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k >= '0' && k <= '9') {
      handleAction('number', { dataset: { num: k } });
      pressVisual(keyByChar[k]);
    } else if (k === '.') {
      handleAction('decimal', {});
      pressVisual(document.querySelector('[data-action="decimal"]'));
    } else if (k === '+' || k === '-' || k === '*' || k === '/') {
      const symbolMap = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' };
      handleAction('operator', { textContent: symbolMap[k] });
      pressVisual(findOperatorKey(k));
    } else if (k === 'Enter' || k === '=') {
      e.preventDefault();
      handleAction('equals', {});
      pressVisual(document.querySelector('[data-action="equals"]'));
    } else if (k === 'Backspace') {
      handleAction('backspace', {});
      pressVisual(document.querySelector('[data-action="backspace"]'));
    } else if (k === 'Escape') {
      handleAction('clear', {});
      pressVisual(document.querySelector('[data-action="clear"]'));
    } else if (k === '%') {
      handleAction('percent', {});
      pressVisual(document.querySelector('[data-action="percent"]'));
    }
  });

  render();
})();
