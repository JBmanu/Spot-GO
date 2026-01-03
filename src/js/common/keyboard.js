export class Keyboard {
    constructor({ input, keyboard, overlay, onInput }) {
        this.input = input;
        this.keyboard = keyboard;
        this.overlay = overlay;
        this.onInput = onInput;
        this._isBound = false;
        this._isKeyboardActive = false;
        this._handleInput = this._handleInput.bind(this);
        this._handleFocus = this._handleFocus.bind(this);
        this._handleBlur = this._handleBlur.bind(this);
        this._handleOverlayClick = this._handleOverlayClick.bind(this);
        this._handleKeyboardMouseDown = this._handleKeyboardMouseDown.bind(this);
        this._bindEvents();
    }

    _bindEvents() {
        if (this._isBound) return;
        if (!this.input || !this.keyboard || !this.overlay) return;
        this._isBound = true;
        this.input.addEventListener("focus", this._handleFocus);
        this.input.addEventListener("blur", this._handleBlur);
        this.input.addEventListener("input", this._handleInput);
        this._bindKeyboardButtons();
        this._bindCloseButton();
        this.overlay.addEventListener("click", this._handleOverlayClick);
        this.keyboard.addEventListener("mousedown", this._handleKeyboardMouseDown);
    }

    _bindKeyboardButtons() {
        const buttons = this.keyboard.querySelectorAll(".kb-key, .kb-space, .kb-backspace");
        buttons.forEach((button) => {
            if (button.dataset.bound === "true") return;
            button.dataset.bound = "true";
            button.addEventListener("click", (e) => {
                e.preventDefault();
                const key = button.dataset.key;
                if (key === "backspace") this.input.value = this.input.value.slice(0, -1);
                else if (key === " ") this.input.value += " ";
                else if (key) this.input.value += key.toLowerCase();
                this.input.focus();
                this.input.dispatchEvent(new Event("input", { bubbles: true }));
            });
        });
    }

    _bindCloseButton() {
        const closeBtn = this.keyboard.querySelector(".kb-close");
        if (closeBtn && closeBtn.dataset.bound !== "true") {
            closeBtn.dataset.bound = "true";
            closeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.hide();
                this.input.blur();
            });
        }
    }

    _handleFocus() {
        this.show();
        this._isKeyboardActive = true;
    }

    _handleBlur() {
        setTimeout(() => {
            if (!this._isKeyboardActive) this.hide();
        }, 100);
    }

    _handleOverlayClick(e) {
        e.preventDefault();
        this.hide();
        this.input.blur();
    }

    _handleKeyboardMouseDown(e) {
        e.preventDefault();
        this._isKeyboardActive = true;
        setTimeout(() => {
            this._isKeyboardActive = false;
        }, 200);
    }

    show() {
        this.keyboard.classList.add("keyboard-visible");
        this.overlay.classList.add("overlay-visible");
        this.keyboard.style.transform = "translateY(0)";
        this.overlay.style.transform = "translateY(0)";
        // L'overlay ora occupa tutto il contenitore padre, non serve più settare top/height/position
        this.overlay.style.top = null;
        this.overlay.style.height = null;
        this.overlay.style.left = null;
        this.overlay.style.right = null;
        this.overlay.style.position = null;
    }

    hide() {
        this.keyboard.classList.remove("keyboard-visible");
        this.overlay.classList.remove("overlay-visible");
        this.keyboard.style.transform = "translateY(100%)";
        this.overlay.style.transform = "translateY(100%)";
        this.overlay.style.top = null;
        this.overlay.style.height = null;
        this.overlay.style.left = null;
        this.overlay.style.right = null;
        this.overlay.style.position = null;
    }

    _handleInput() {
        if (typeof this.onInput === "function") {
            this.onInput(this.input.value);
        }
    }

    destroy() {
        if (!this._isBound) return;
        this.input.removeEventListener("focus", this._handleFocus);
        this.input.removeEventListener("blur", this._handleBlur);
        this.input.removeEventListener("input", this._handleInput);
        this.overlay.removeEventListener("click", this._handleOverlayClick);
        this.keyboard.removeEventListener("mousedown", this._handleKeyboardMouseDown);
        this._isBound = false;
    }
}
