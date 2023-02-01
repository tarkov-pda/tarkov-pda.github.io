import { debounce, round, throttle } from "./util.js";
export class VMap extends HTMLElement {
  tileExtension = 'webp';
  emptyTile = null;
  maxZoom = 8;
  minZoom = 0;
  defaultZoom = 0;
  maxScrollOffsetX = 8000;
  maxScrollOffsetY = 8000;
  tileSize = { x: 100, y: 100 };
  tilePath = '';
  zooms = [];
  #viewFrame = { x: 0, y: 0 };
  #zoom = 0;
  #imgCache = {};
  get zoom() {
    return this.#zoom;
  }
  set zoom(value) {
    const old = this.#zoom;
    if (value > this.maxZoom) value = this.maxZoom;
    else if (value < this.minZoom) value = this.minZoom;
    if (old !== value) {
      console.log(value);
      this.#zoom = round(value, 0);
      this.#render();
    }
  }
  constructor() {
    super();
    this.setStyles([
      ['display', 'block'],
      ['box-sizing', 'border-box'],
      ['border', '1 px solid black']
    ]);

    this.attachShadow({ mode: "open" });
    this.canvas = document.createElement('canvas');
    this.setStyles.call(this.canvas, [['pointer-events', 'none']]);
    this.context2d = this.canvas.getContext('2d');
    this.styles = document.createElement('style');

    new ResizeObserver(this.onResizeCallback.bind(this)).observe(this);

    this.shadowRoot.appendChild(this.canvas);

    this.reset(true);
    this.updateCanvasSize();
  }
  render() {
    if (this.tilePath) {
      const [collCount, cellCount] = this.zooms[this.zoom];
      const { start, end } = this.#calcViewFrameCellsIdx();

      this.clear();

      for (let x = start.x; x < end.x; x++) {
        for (let y = start.y; y < end.y; y++) {
          this.loadImg(this.zoom, x, y)
            .then(img => {
              const [collCount, cellCount] = this.zooms[this.zoom];
              const { start, end } = this.#calcViewFrameCellsIdx();
              if (x >= start.x && x < end.x && y >= start.y && y < end.y) {
                const x_px = x * this.tileSize.x + this.#viewFrame.x;
                const y_px = y * this.tileSize.y + this.#viewFrame.y;
                this.context2d.drawImage(img, x_px, y_px);
              }
            });
        }
      }
    }
  }
  #render() {
    throttle.call(this, 'throttled-render', () => {
      this.render();
    }, 1000 / 60);
  }
  #calcViewFrameCellsIdx() {
    const [collCount, cellCount] = this.zooms[this.zoom];

    const start = {
      x: ~~(-this.#viewFrame.x / this.tileSize.x),
      y: ~~(-this.#viewFrame.y / this.tileSize.y)
    };
    const end = {
      x: ~~((-this.#viewFrame.x + this.canvas.width) / this.tileSize.x) + 1,
      y: ~~((-this.#viewFrame.y + this.canvas.height) / this.tileSize.y) + 1
    };

    start.x = start.x >= 0 ? start.x : 0;
    start.y = start.y >= 0 ? start.y : 0;
    end.x = end.x <= collCount ? end.x : collCount;
    end.y = end.y <= cellCount ? end.y : cellCount;

    return { start, end };
  }
  get scrollX() {
    return this.#viewFrame.x;
  }
  get scrollY() {
    return this.#viewFrame.y;
  }
  set scrollX(value) {
    if (value > this.maxScrollOffsetX || value < this.maxScrollOffsetX * -1) return;
    this.#viewFrame.x = value;
    this.#render();
  }
  set scrollY(value) {
    if (value > this.maxScrollOffsetY || value < this.maxScrollOffsetY * -1) return;
    this.#viewFrame.y = value;
    this.#render();
  }
  clear() {
    this.context2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  reset(noRender = false) {
    Object.assign(this.#viewFrame, { x: 0, y: 0 });
    this.zoom = this.defaultZoom;
    if(!noRender) this.#render();
  }

  /**
   *
   * @param {number} zoom
   * @param {number} x
   * @param {number} y
   * @returns {Promise<HTMLImageElement>}
   */

  async loadImg(zoom = this.zoom, x = 0, y = 0) {
    return new Promise((resolve, reject) => {
      if (!this.#imgCache[this.zoom]?.[`${x}-${y}`]) {
        const img = new Image(this.tileSize.x, this.tileSize.y);
        this.#imgCache[this.zoom] ??= {};
        this.#imgCache[this.zoom][`${x}-${y}`] = img;
        img.src = `${this.tilePath}/${zoom}/${x}/${y}.${this.tileExtension}`;
        img.decode()
          .then(() => resolve(img))
          .catch(err => {
            this.#imgCache[this.zoom][`${x}-${y}`] = this.emptyTile;
            this.emptyTile.decode()
              .then(() => {
                resolve(this.emptyTile);
              });
          });
      }
      else {
        resolve(this.#imgCache[this.zoom]?.[`${x}-${y}`]);
      }
    });
  }
  onConnectedCallback() {
    this.updateCanvasSize();
  }
  /** @type {ResizeObserverCallback} */
  onResizeCallback(entries, observer) {
    console.log('v-map resize: ', entries);
    this.updateCanvasSize();
    this.render();
  }
  updateCanvasSize() {
    const rect = this.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.canvas.style.setProperty('width', rect.width.toString());
    this.canvas.style.setProperty('height', rect.height.toString());
  }
  /** @param {[property:string, value:string, priority?: string][]} styles */
  setStyles(styles) {
    for (const s of styles) {
      this.style.setProperty(...s);
    }
  }
}
window.customElements.define('v-map', VMap);