import { VMap } from "./v-map.js";
import maps from "./maps.js";

const TARGET_MAP_NAME = 'customs';

const vMap = document.querySelector('v-map');
if (vMap && vMap instanceof VMap) {
  const updateZoom = (delta = 0, zoomPoint) => {
    delta = delta > 0 ? -1 : 1;
    if (vMap.zoom + delta > vMap.maxZoom || vMap.zoom + delta < vMap.minZoom) return;
    if (delta > 0) {
      vMap.scrollX += ((zoomPoint.x - vMap.scrollX) - ((zoomPoint.x*2 - vMap.scrollX*2))) * delta;
      vMap.scrollY += ((zoomPoint.y - vMap.scrollY) - ((zoomPoint.y*2 - vMap.scrollY*2))) * delta;
    }
    else {
      vMap.scrollX -= ((zoomPoint.x - vMap.scrollX) - ((zoomPoint.x/2 - vMap.scrollX/2))) * delta;
      vMap.scrollY -= ((zoomPoint.y - vMap.scrollY) - ((zoomPoint.y/2 - vMap.scrollY/2))) * delta;
    }
    vMap.zoom += delta;
    zoomValue.textContent = vMap.zoom.toString();
    vMap.render();
  };
  vMap.addEventListener('wheel', onWheel, { passive: true });
  initZoom(vMap);

  vMap.maxZoom = maps[TARGET_MAP_NAME].zooms.length - 1;
  vMap.tileSize = maps[TARGET_MAP_NAME].size;
  vMap.tilePath = `./maps/${TARGET_MAP_NAME}`;
  vMap.zooms = maps[TARGET_MAP_NAME].zooms;
  const emptyTile = new Image(maps[TARGET_MAP_NAME].size.x, maps[TARGET_MAP_NAME].size.y);
  emptyTile.src = './empty.webp';
  emptyTile.decode();
  vMap.emptyTile = emptyTile;
  vMap.defaultZoom = 3;

  const zoomValue = document.createElement('div');
  zoomValue.style.setProperty('user-select', 'none');
  zoomValue.style.setProperty('position', 'absolute');
  zoomValue.style.setProperty('background-color', 'white');
  zoomValue.style.setProperty('border-radius', '50%');
  zoomValue.style.setProperty('width', '64px');
  zoomValue.style.setProperty('height', '64px');
  zoomValue.style.setProperty('text-align', 'center');
  zoomValue.style.setProperty('line-height', '64px');
  zoomValue.style.setProperty('top', `${24 + 64 + 2}px`);
  zoomValue.style.setProperty('left', '24px');
  zoomValue.style.setProperty('font-size', '3em');
  zoomValue.style.setProperty('font-family', 'monospace');
  zoomValue.textContent = vMap.zoom.toString();
  document.body.appendChild(zoomValue);

  const resetBtn = document.createElement('button');
  resetBtn.style.setProperty('user-select', 'none');
  resetBtn.style.setProperty('position', 'absolute');
  resetBtn.style.setProperty('width', '64px');
  resetBtn.style.setProperty('height', '64px');
  resetBtn.style.setProperty('text-align', 'center');
  resetBtn.style.setProperty('line-height', '64px');
  resetBtn.style.setProperty('top', '24px');
  resetBtn.style.setProperty('left', '24px');
  resetBtn.style.setProperty('font-family', 'monospace');
  resetBtn.textContent = 'reset';
  resetBtn.addEventListener('click', () => { vMap.reset(); zoomValue.textContent = vMap.zoom.toString();});
  document.body.appendChild(resetBtn);

  vMap.reset();
  zoomValue.textContent = vMap.zoom.toString();


  /**
   * @param {WheelEvent} e
   * @this {VMap}
   */
  function onWheel(e) {
    updateZoom(e.deltaY, { x: e.clientX, y: e.clientY });
  }

  const evCache = [];
  let prevDist = -1;
  let lastDiff = 0;

  function initZoom(el) {
    el.onpointerdown = pointerdownHandler;
    el.onpointermove = pointermoveHandler;

    el.onpointerup = pointerupHandler;
    el.onpointercancel = pointerupHandler;
  }
  /**
   * @param {PointerEvent} ev
   */
  function pointerdownHandler(ev) {
    evCache.push(ev);
  }
  /**
   * @param {PointerEvent} ev
   */
  function pointermoveHandler(ev) {
    const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId);
    if (~index) {
      this.scrollX -= (evCache[index].clientX - ev.clientX) / evCache.length;
      this.scrollY -= (evCache[index].clientY - ev.clientY) / evCache.length;
      this.render();
      evCache[index] = ev;
    }
    else {
      return;
    }
    if (evCache.length > 0) {
      this.setPointerCapture(ev.pointerId);
      if (evCache.length === 2) {
        const curDist = Math.abs(Math.sqrt((evCache[0].clientX - evCache[1].clientX) ** 2 + (evCache[0].clientY - evCache[1].clientY) ** 2));
        const diff = prevDist - curDist;
        if (prevDist > 0) {
          console.log(diff);
          if (Math.abs(lastDiff - diff) > 100) {
            const midPoint = {
              x: (evCache[0].clientX + evCache[1].clientX) / 2,
              y: (evCache[0].clientY + evCache[1].clientY) / 2
            };
            lastDiff = diff;
            updateZoom(prevDist - curDist, midPoint);
            prevDist = curDist;
          }
        }
        else {
          prevDist = curDist;
        }

      }
    }
  }
  function pointerupHandler(ev) {
    removeEvent(ev);

    if (evCache.length < 2) {
      prevDist = -1;
      lastDiff = 0;
    }
  }
  function removeEvent(ev) {
    const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId);
    evCache.splice(index, 1);
  }
}

