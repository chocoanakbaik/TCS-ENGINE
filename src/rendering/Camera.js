export class Camera {
  constructor(options={}) {
    this.x=options.x??0;this.y=options.y??0;this.z=options.z??10;
    this.fov=options.fov??60;this.near=options.near??0.1;this.far=options.far??1000;
    this.zoom=options.zoom??1;
  }
}
