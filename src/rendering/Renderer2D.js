import { Camera } from './Camera.js';
export class Renderer2D {
  constructor(container) {
    if(!container?.appendChild)throw new TypeError('Renderer2D requires a DOM container.');
    this.container=container;this.canvas=document.createElement('canvas');
    this.canvas.style.display='block';this.canvas.style.width='100%';this.canvas.style.height='100%';
    this.canvas.style.touchAction='none';container.appendChild(this.canvas);
    this.ctx=this.canvas.getContext('2d');
    if(!this.ctx)throw new Error('Canvas 2D context is unavailable.');
    this.camera=new Camera();this.clearColor='#0a0a0a';this._disposed=false;
    this._resize=this._resize.bind(this);window.addEventListener('resize',this._resize);this._resize();
  }
  _resize() {
    if(this._disposed)return;
    const rect=this.container.getBoundingClientRect();
    const width=Math.max(1,Math.floor(rect.width||window.innerWidth));
    const height=Math.max(1,Math.floor(rect.height||window.innerHeight));
    const ratio=Math.min(window.devicePixelRatio||1,2);
    this.canvas.width=Math.floor(width*ratio);this.canvas.height=Math.floor(height*ratio);
    this.ctx.setTransform(ratio,0,0,ratio,0,0);
    this.width=width;this.height=height;this.pixelRatio=ratio;
  }
  render(world) {
    const ctx=this.ctx,w=this.width,h=this.height;
    ctx.clearRect(0,0,w,h);ctx.fillStyle=this.clearColor;ctx.fillRect(0,0,w,h);
    const ids=world.query('Transform','Sprite');
    for(const id of ids) {
      const transform=world.getComponent(id,'Transform'),sprite=world.getComponent(id,'Sprite');
      if(sprite.visible===false)continue;
      const width=sprite.width??32,height=sprite.height??32;
      const x=(transform.x-this.camera.x)*this.camera.zoom+w/2-width/2;
      const y=-(transform.y-this.camera.y)*this.camera.zoom+h/2-height/2;
      ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,sprite.opacity??1));
      if(sprite.src&&typeof sprite.src!=='string'&&sprite.src.complete) {
        ctx.drawImage(sprite.src,x,y,width*this.camera.zoom,height*this.camera.zoom);
      } else if(sprite.src&&typeof sprite.src==='string') {
        sprite._image??=new Image();if(!sprite._image.src)sprite._image.src=sprite.src;
        if(sprite._image.complete&&sprite._image.naturalWidth)ctx.drawImage(sprite._image,x,y,width*this.camera.zoom,height*this.camera.zoom);
        else {ctx.fillStyle=sprite.color??'#00ff88';ctx.fillRect(x,y,width*this.camera.zoom,height*this.camera.zoom);}
      } else {
        ctx.fillStyle=sprite.color??'#00ff88';ctx.fillRect(x,y,width*this.camera.zoom,height*this.camera.zoom);
      }
      ctx.restore();
    }
  }
  dispose() {
    if(this._disposed)return;this._disposed=true;
    window.removeEventListener('resize',this._resize);this.canvas.remove();
  }
}