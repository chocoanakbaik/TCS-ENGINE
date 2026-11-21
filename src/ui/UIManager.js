export class UIManager {
  constructor(container=document.body) {
    if(!container?.appendChild)throw new TypeError('UIManager requires a DOM container.');
    this.root=document.createElement('div');this.root.id='tcs-ui-root';
    this.root.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1000;font-family:system-ui,sans-serif;color:#fff;';
    if(getComputedStyle(container).position==='static')container.style.position='relative';
    container.appendChild(this.root);
  }
  createHUD(id,html,css='') {
    const safeId=String(id).replace(/[^a-zA-Z0-9_-]/g,'-');
    const element=document.createElement('div');element.id=`tcs-${safeId}`;
    element.innerHTML=String(html);element.style.cssText=css;
    const previous=this.root.querySelector(`#tcs-${safeId}`);previous?.remove();
    this.root.appendChild(element);return element;
  }
  get(id) { const safeId=String(id).replace(/[^a-zA-Z0-9_-]/g,'-');return this.root.querySelector(`#tcs-${safeId}`); }
  remove(id) { const element=this.get(id);if(!element)return false;element.remove();return true; }
  clear() { this.root.replaceChildren(); }
  dispose() { this.root.remove(); }
}
