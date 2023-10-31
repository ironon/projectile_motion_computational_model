class World {
    private static objects: GameObject[] = []
    private static world_info: WorldInfo
    public static time:number = 0
    public static table: number[][] = []
    public static paused = false
    static update(delta_time: number, world_info: WorldInfo) {
        if (this.paused) {
            return
        }
        this.world_info = world_info
        this.time = this.time + delta_time
        this.objects.forEach((obj) => {
            obj.update(delta_time, world_info);
        })
        let obj = GameObject.lastCreated
        if (!obj) {
            return
        }
        if (GameObject.lastCreated.isPathTime()) {
            let data = [obj.x_kinematics[0], world_info.height-obj.y_kinematics[0], obj.x_kinematics[1], obj.y_kinematics[1], obj.x_kinematics[2], obj.y_kinematics[2]].map(a => this.toMeters(a))
            data.unshift(World.time)
            this.table.push(data)
        }
      
    }
    static toMeters(pixels: number) {
        return pixels / this.world_info.scale
    }
    static toPixels(meters: number) {
        return meters * this.world_info.scale
    }
    static getComponentsOfKinematics(ball_launch_settings: number[], ball_launch_angle: number[]) {
        let ball_launch_settings_x = ball_launch_settings.map((value, index) => this.toPixels(value * Math.cos(ball_launch_angle[index] * (Math.PI / 180))))
        let ball_launch_settings_y = ball_launch_settings.map((value, index) => this.toPixels(value * Math.sin(ball_launch_angle[index] * (Math.PI / 180))))
        return [ball_launch_settings_x, ball_launch_settings_y]
    }
    static clearTable() {
        World.table = []
        World.time = 0
    }
    static pause() {
  
        this.paused = true
    }
    static unpause() {

        this.paused = false
    }
    static realCoordsToZoomCoords(x: number, y:number) {
        let align_x = 0
        let align_y = 0
        if (this.world_info.alignment == "left") {
            align_x = this.world_info.width/2
            align_y = this.world_info.height/2
        }
      
        
        let nx = (this.world_info.zoom_percentage * (x - this.world_info.zoom_x)) + this.world_info.width/2 - align_x
        let ny = (this.world_info.zoom_percentage * (y - this.world_info.zoom_y)) + this.world_info.height/2 + align_y
        return [nx, ny]
    }
    static zoomCoordsToRealCoords(x:number, y:number) {
        let ax = 0
        let ay = 0
        if (this.world_info.alignment == "left") {
            ax = this.world_info.width/2
            ay = this.world_info.height/2
        }
        let w2 = this.world_info.width/2
        let h2 = this.world_info.height/2
        let zp = this.world_info.zoom_percentage
        let zx = this.world_info.zoom_x
        let zy = this.world_info.zoom_y

        let nx = ((x-w2+ax)/(zp))+zx
        let ny = ((y-h2+ay)/(zp))+zy
        return [nx, ny]
      
        
    }
    static clearAll(){
        World.objects = []
        this.time = 0
        this.paused = false
    }
    static display(ctx: CanvasRenderingContext2D) {
        
        this.objects.forEach((obj) => {
            obj.predisplay(ctx)
        })
    }
    static addToWorld(obj: GameObject) {
        World.objects.push(obj);
        obj.world = this
    }
}

interface ObjectShape {
    predisplay(ctx: CanvasRenderingContext2D): void
    display(ctx: CanvasRenderingContext2D, x:number, y:number): void;
    update(dt: number, world_info:WorldInfo): void;
    updateCollisions() : void
}

type Coordinate = [
    number,
    number
]
interface WorldInfo {
    elasticity: number,
    gravity: number,
    height: number,
    width: number,
    scale: number,
    // display_scale: number,
    zoom_x: number,
    zoom_y: number,
    zoom_percentage: number
    alignment: string
    time_scale: number
    max_steps: number,
    show_path: boolean

}
class GameObject implements ObjectShape {
    x_kinematics: number[] = [0, 2]
    y_kinematics: number[] = [0, 2]
    color: string
    map_width: number
    map_height: number
    world_info: WorldInfo
    world: World | undefined
    path: Coordinate[]
    max_steps: number
    step: number
    static lastCreated: GameObject
    // each index of kinnematics represents a derivative of position
    // i.e, the 0th index is position itself, the 1st is velocity, and so on.
    constructor(x_kinematics: number[], y_kinematics: number[], color: string, world_info: WorldInfo) {
        this.x_kinematics = x_kinematics
        this.y_kinematics = y_kinematics.map((value) => -value)
        this.y_kinematics[0] = this.y_kinematics[0] * -1
        this.color = color
        this.map_width = world_info.width
        this.map_height = world_info.height
        this.world_info = world_info
        this.path = []
        this.max_steps = world_info.max_steps
        this.step = 0
        
        GameObject.lastCreated = this
        World.clearTable()

    }
    updateCollisions() {
        throw Error("Not Implemented")
    }
    isPathTime() {
        if (this.step == 0) {
            return true
        }
        return false
    }
    update(delta_time: number, world_info: WorldInfo) {
        // iterate through x kinematics backwards
        this.world_info = world_info
        this.step++
        if (this.step == this.max_steps) {
            this.step = 0
            this.path.push([this.x_kinematics[0], this.y_kinematics[0]])
        }
        for (let i=this.x_kinematics.length-1; i>0; --i){
            if (!isNaN(this.x_kinematics[i])){
                let dx = delta_time * this.x_kinematics[i];
                // let oldX = this.x_kinematics[0]
                this.x_kinematics[i-1] += dx
           
            }
        }
        for (let i=this.y_kinematics.length-1; i>0; --i){
            if (!isNaN(this.y_kinematics[i])){
                let dx = delta_time * this.y_kinematics[i];
                this.y_kinematics[i-1] += dx
            }
        }
        this.updateCollisions()
       
        
    }
    predisplay(ctx: CanvasRenderingContext2D): void {
        let x_pos = this.x_kinematics[0]
        let y_pos = this.y_kinematics[0]
        ctx.fillStyle = this.color
        let align_x = 0
        let align_y = 0
        if (this.world_info.alignment == "left") {
            align_x = this.world_info.width/2
            align_y = this.world_info.height/2
        }
        ctx.beginPath()
        if (this.world_info.show_path) {
            this.path.forEach((p) => {
                ctx.lineWidth = 0.1
                ctx.fillStyle = "black"
                let [jx, jy] = World.realCoordsToZoomCoords(p[0], p[1])
                ctx.lineTo(jx,jy)
            })
        }
        ctx.stroke()

        let new_x = (this.world_info.zoom_percentage * (x_pos - this.world_info.zoom_x)) + this.world_info.width/2 - align_x
        let new_y = (this.world_info.zoom_percentage * (y_pos - this.world_info.zoom_y)) + this.world_info.height/2 + align_y
        this.display(ctx, new_x, new_y)
    }   
    display(ctx: CanvasRenderingContext2D, x: number, y:number): void {
        throw Error("Not Implemented")
    }


}


class Ball extends GameObject {

    radius: number
    constructor(x_kinematics:number[], y_kinematics:number[], color: string, world_info: WorldInfo, radius: number) {
        super(x_kinematics,y_kinematics,color, world_info)
        this.radius = radius
    }
    static createWithVector(x_pos:number, y_pos:number, velocity:number, angle:number, world_info:WorldInfo, other_derivatives_x?: number[], other_derivatives_y?: number[]) {
        let x_velo = velocity * Math.cos(angle)
        let y_velo = velocity * Math.sin(angle)
        let default_x = [x_pos, x_velo]
        let default_y = [y_pos, y_velo]
        if (other_derivatives_x) {
            other_derivatives_x.forEach(a => default_x.push(a))
        }
        if (other_derivatives_y) {
            other_derivatives_y.forEach(a => default_y.push(a))
        } else {
            default_y.push(world_info.gravity)
        }
        return new Ball(default_x, default_y, "black", world_info, 10)
    }
    updateCollisions() {

        if (this.y_kinematics[0] >= this.map_height) {
            this.y_kinematics[0] = this.map_height
            this.y_kinematics[1] *= -1 * this.world_info.elasticity
            if (this.world_info.elasticity == -1) {
                this.x_kinematics[1] = 0
                this.y_kinematics[1] = 0
            }
        }
        if (this.y_kinematics[0] < 0) {
            this.y_kinematics[0] = 0
            this.y_kinematics[1] *= -1 * this.world_info.elasticity
            if (this.world_info.elasticity == -1) {
                this.x_kinematics[1] = 0
                this.y_kinematics[1] = 0
            }

        }
        if (this.x_kinematics[0] >= this.map_width) {
            this.x_kinematics[0] = this.map_width
         
            this.x_kinematics[1] *= -1 * this.world_info.elasticity
            if (this.world_info.elasticity == -1) {
                this.x_kinematics[1] = 0
                this.y_kinematics[1] = 0
            }
        }
        if (this.x_kinematics[0] < 0) {
            this.x_kinematics[0] = 0
            this.x_kinematics[1] *= -1 * this.world_info.elasticity
            if (this.world_info.elasticity == -1) {
                this.x_kinematics[1] = 0
                this.y_kinematics[1] = 0
            }
        }

    }
    display(ctx: CanvasRenderingContext2D, x:number, y:number): void {
     
        let radius =  (this.world_info.zoom_percentage *this.radius) / this.world_info.scale
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
        // ctx.fillRect(x_pos, y_pos, 10, 10)
    }

}

function drawCircle(ctx: CanvasRenderingContext2D, x:number, y:number, radius:number, inner_color: string) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = inner_color;
    ctx.fill();
    
}
export {World, GameObject, Ball};
export type {WorldInfo}