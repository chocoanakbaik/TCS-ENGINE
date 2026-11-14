export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const damp=(a,b,lambda,dt)=>lerp(a,b,1-Math.exp(-lambda*dt));
export const randRange=(min,max)=>min+Math.random()*(max-min);
export const degToRad=degrees=>degrees*Math.PI/180;
export const radToDeg=radians=>radians*180/Math.PI;
export class Vec2 {
  constructor(x=0,y=0) { this.x=x; this.y=y; }
  set(x,y) { this.x=x; this.y=y; return this; }
  copy(v) { return this.set(v.x,v.y); }
  clone() { return new Vec2(this.x,this.y); }
  add(v) { this.x+=v.x; this.y+=v.y; return this; }
  sub(v) { this.x-=v.x; this.y-=v.y; return this; }
  mul(s) { this.x*=s; this.y*=s; return this; }
  length() { return Math.hypot(this.x,this.y); }
  normalize() { const length=this.length(); if (length>0) this.mul(1/length); return this; }
}
export class Vec3 {
  constructor(x=0,y=0,z=0) { this.x=x; this.y=y; this.z=z; }
  set(x,y,z) { this.x=x; this.y=y; this.z=z; return this; }
  copy(v) { return this.set(v.x,v.y,v.z); }
  clone() { return new Vec3(this.x,this.y,this.z); }
  add(v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; return this; }
  sub(v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; return this; }
  mul(s) { this.x*=s; this.y*=s; this.z*=s; return this; }
  length() { return Math.hypot(this.x,this.y,this.z); }
  normalize() { const length=this.length(); if (length>0) this.mul(1/length); return this; }
}
export function aabbOverlap(a,b) {
  return a.x < b.x+b.w && a.x+a.w > b.x &&
    a.y < b.y+b.h && a.y+a.h > b.y;
}