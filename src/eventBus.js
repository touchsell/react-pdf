/* eslint-disable no-console, no-continue, no-underscore-dangle, no-restricted-syntax */

function dispatchDOMEvent(eventName, args = null) {
  const details = Object.create(null);

  if (args && args.length > 0) {
    const obj = args[0];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        continue;
      }

      const value = obj[key];

      if (key === 'source') {
        if (value === window || value === document) {
          return;
        }

        continue;
      }

      details[key] = value;
    }
  }

  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(eventName, true, true, details);
  document.dispatchEvent(event);
}

export default class EventBus {
  constructor({
    dispatchToDOM = false,
  } = {}) {
    this._listeners = Object.create(null);
    this._dispatchToDOM = dispatchToDOM === true;

    if (dispatchToDOM) {
      console.error('The `eventBusDispatchToDOM` option/preference is deprecated, add event listeners to the EventBus instance rather than the DOM.');
    }
  }

  on(eventName, listener) {
    this._on(eventName, listener, {
      external: true,
    });
  }

  off(eventName, listener) {
    this._off(eventName, listener);
  }

  dispatch(eventName, ...args) {
    const eventListeners = this._listeners[eventName];

    if (!eventListeners || eventListeners.length === 0) {
      if (this._dispatchToDOM) {
        dispatchDOMEvent(eventName, args);
      }

      return;
    }

    let externalListeners;
    eventListeners.slice(0).forEach(({
      listener,
      external,
    }) => {
      if (external) {
        if (!externalListeners) {
          externalListeners = [];
        }

        externalListeners.push(listener);
        return;
      }

      listener(...args);
    });

    if (externalListeners) {
      externalListeners.forEach(listener => listener(...args));
      externalListeners = null;
    }

    if (this._dispatchToDOM) {
      dispatchDOMEvent(eventName, args);
    }
  }

  _on(eventName, listener, options = {}) {
    let eventListeners = this._listeners[eventName];

    if (!eventListeners) {
      eventListeners = [];
      this._listeners[eventName] = eventListeners;
    }

    eventListeners.push({
      listener,
      external: options.external === true,
    });
  }

  _off(eventName, listener) {
    const eventListeners = this._listeners[eventName];

    if (!eventListeners) {
      return;
    }

    for (let i = 0, ii = eventListeners.length; i < ii; i += 1) {
      if (eventListeners[i].listener === listener) {
        eventListeners.splice(i, 1);
        return;
      }
    }
  }
}
