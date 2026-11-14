export class Component {
  constructor(data={}) { Object.assign(this,data); }
  static type() { return this.name; }
}
export class Transform extends Component {
  constructor(x=0,y=0,z=0) { super({x,y,z,rx:0,ry:0,rz:0}); }
}
export class Velocity extends Component {
  constructor(x=0,y=0,z=0) { super({x,y,z}); }
}
export class Sprite extends Component {
  constructor(src=null) { super({src,color:'#00ff88',width:32,height:32,visible:true,opacity:1}); }
}
export class MeshComponent extends Component {
  constructor(mesh=null) { super({mesh}); }
}
export class Collider extends Component {
  constructor(w=1,h=1,d=1,options={}) {
    super({w,h,d,isTrigger:options.isTrigger??false,enabled:options.enabled??true});
  }
}
export class Health extends Component {
  constructor(hp=100) { super({hp,maxHp:hp}); }
}