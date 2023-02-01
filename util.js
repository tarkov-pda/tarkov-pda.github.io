export function round(num = 0, precision = 2) {
  const mult = parseFloat('1'.padEnd(precision, '0'));
  const res = Math.round((num + Number.EPSILON) * mult) / mult;
  const s = res.toString();
  const dotPos = s.indexOf('.');
  if (~dotPos) {
    return parseFloat(s.slice(0, dotPos + precision));
  }
  else {
    return res;
  }
}

export function debounce(debounceName, callback, delay) {
  let debounces, current;
  if (debounce._contexts.has(this)) {
    debounces = debounce._contexts.get(this);
    current = debounces[debounceName];
  }
  else {
    debounces = {};
    debounce._contexts.set(this, debounces);
  }
  if (current) {
    clearInterval(current.id);
  }
  else {
    current = debounces[debounceName] = { id: 0 };
  }

  current.id = setTimeout(() => {
    delete debounces[debounceName];
    callback();
  }, delay);
}
Object.defineProperty(debounce, '_contexts', { value: new Map });

export function throttle(debounceName, callback, delay) {
  let throttles, current;
  if (debounce._contexts.has(this)) {
    throttles = debounce._contexts.get(this);
    current = throttles[debounceName];
  }
  else {
    throttles = {};
    debounce._contexts.set(this, throttles);
  }
  if (current) {
    current.callback = callback;
  }
  else {
    throttles[debounceName] = { callback };
    setTimeout(() => {
      throttles[debounceName].callback();
      delete throttles[debounceName];
    }, delay);
  }
}
Object.defineProperty(throttle, '_contexts', { value: new Map });