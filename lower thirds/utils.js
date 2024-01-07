class Storable {
  _value;

  constructor(id, defaultValue) {
    this.id = id;
    this.defaultValue = defaultValue;
    this.loadValue();
  }

  loadValue() {
    const item = JSON.parse(localStorage.getItem(this.id));
    if (item == undefined) {
      this.value = this.defaultValue;
    } else {
      this.value = item;
    }
  }

  update() {
    this.value = this._value;
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    this._value = newValue;

    if (newValue !== undefined) {
      newValue = JSON.stringify(newValue);
      localStorage.setItem(this.id, newValue);
    }
  }
}

class Readable {
  value;

  constructor(id) {
    this.id = id;
    this.update();
  }

  update() {
    this.value = JSON.parse(localStorage.getItem(this.id));
  }
}

function parseBool(val) {
  return val == "true" ? true : false;
}
function parseStr(val) {
  return val;
}

