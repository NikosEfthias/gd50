import swal from "sweetalert";
const canvas = document.querySelector('canvas');
const deviceRatio = (window.devicePixelRatio || 1);
const sceneHeight = canvas.clientHeight;
const sceneWidth = canvas.clientWidth;
const halfWidth = sceneWidth / 2;
let last_frame = performance.now();
canvas.width = sceneWidth * deviceRatio;
canvas.height = sceneHeight * deviceRatio;
const ctx = canvas.getContext('2d');
ctx.scale(deviceRatio, deviceRatio);

abstract class Entity {
    abstract draw(delta: number);
}
class Scene extends Entity {
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number, color: string) {
        super();
        this.x = x; this.y = y; this.width = width; this.height = height;
        this.color = color;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
class FpsCounter extends Entity {
    private sum = 0;
    private prev_sum = this.sum;
    private count = 0;
    private update_every_n_frames = 15;
    draw(delta: number) {
        this.sum += 1000 / delta;
        if (++this.count % this.update_every_n_frames === 0) {
            this.prev_sum = this.sum
            this.sum = 0;
        }
        ctx.font = "14px Arial black";
        const txt = `FPS -> ${(this.prev_sum / this.update_every_n_frames).toFixed(2)}`
        const txtDetails = ctx.measureText(txt);
        ctx.strokeStyle = "black"
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText(txt, sceneWidth - txtDetails.width - 10, 15)
    }
}
class Player extends Entity {
    width: number = sceneWidth / 10;
    private initial_x = (sceneWidth / 2) - (this.width / 2);;
    x: number = this.initial_x
    private speed = sceneWidth / 2;
    y = sceneHeight - 15;
    private next_x = this.initial_x;

    constructor() {
        super();
        window.addEventListener("keydown", e => {
            switch (e.key.toLowerCase()) {
                case "arrowleft":
                case "j":
                case "h":
                    this.next_x = 0
                    break
                case "arrowright":
                case "k":
                case "l":
                    this.next_x = sceneWidth - this.width;
                    break
            }
        })
        window.addEventListener("keyup", e => {
            switch (e.key.toLowerCase()) {
                case "arrowleft":
                case "j":
                case "h":
                    this.next_x = this.x;
                    break
                case "arrowright":
                case "k":
                case "l":
                    this.next_x = this.x;
                    break
            }
        })
    }
    reset() {
        this.x = this.initial_x;
    }
    draw(delta: number) {
        let speed = Math.ceil((delta * (this.speed / 1000)));
        if (this.x < this.next_x) {
            this.x = Math.min(this.next_x, this.x + speed)
        } else if (this.x > this.next_x) {
            this.x = Math.max(this.next_x, this.x - speed)
        }
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, this.width, 10)
    }
}
class Ball extends Entity {
    r = 10;
    x = halfWidth - this.r
    y = sceneHeight - this.r;
    private player: Player;
    private initial_speed: number;
    down = false;
    speed: number;
    private stop = false;
    private _score = 0;
    private next_y = this.r;
    public get score() {
        return this._score;
    }
    private set score(value) {
        this._score = value;
    }
    constructor(player: Player) {
        super();
        this.player = player;
        this.speed = this.initial_speed = player.y - this.r
    }
    reset() {
        this.speed = this.initial_speed;
    }
    move() {
        if (!this.stop) {
            if (this.down && this.r + this.y >= player.y) {
                // if (this.x + (this.r) < this.player.x || this.x - (this.r) > this.player.x + this.player.width) {
                //     this.stop = true;
                //     this.y = sceneHeight
                //     swal({
                //         title: `Your score is ${this.score}`,
                //         text: "Do you want to try again?",
                //         buttons: ["No", "Yes"]
                //     }).then((val) => {
                //         this.score = 0;
                //         this.speed = this.initial_speed;
                //         this.player.reset()
                //         val && (this.stop = false);
                //     })
                // } else {
                //     const score = ++this.score;
                //     if (!(score % 5)) {
                //         this.speed += score / 5;
                //     }

                // }
                this.down = false;
            }
            else if (!this.down && this.y - this.r <= 0) this.down = true;
            if (this.down) {
                this.y = this.y + this.speed;
            }
            else {
                this.y = this.y - this.speed;
            }

        }
    }

    draw(delta: number) {
        const speed = Math.ceil(delta * (this.speed / 1000));
        const top = this.r;
        const bottom = this.player.y - this.r;
        if (this.stop) { }
        else if (this.y < this.next_y) {
            this.y = Math.min(bottom, this.y + speed);
        }
        else if (this.y > this.next_y) {
            this.y = Math.max(top, this.y - speed)
        }
        else if (this.y === this.next_y) {
            this.next_y = this.y === top ? bottom : top;
        }

        ctx.beginPath()
        ctx.fillStyle = "black";
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}
class ScoreBoard extends Entity {
    ball: Ball;
    constructor(ball: Ball) {
        super();
        this.ball = ball;
    }
    draw(delta: number) {
        const score = `Score: ${this.ball.score}`
        const speed = `Speed: ${(this.ball.speed / 20).toFixed(0)}`
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText(speed, 10, 20)
        ctx.fillText(score, 10, 35)
    }
}
const player = new Player();
const ball = new Ball(player);
const items = [
    new Scene(0, 0, sceneWidth, sceneHeight, "#bada55"),
    ball,
    player,
    new ScoreBoard(ball),
    new FpsCounter()
];
function drawAll(t: DOMHighResTimeStamp) {
    items.forEach(i => i.draw(t - last_frame));
    last_frame = t;
    if (items.length > 0) {
        // setTimeout(window.requestAnimationFrame.bind(null, drawAll), 30)
        window.requestAnimationFrame(drawAll);
    }

}
window.requestAnimationFrame(drawAll);