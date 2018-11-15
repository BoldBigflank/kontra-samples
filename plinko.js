kontra.init()
var sprites = []
var uiSprite = null;

// Constants
const BALL_MIN_RADIUS = 10
const BALL_START_VELOCITY = 1

const PEGS_POS_X = 30
const PEGS_POS_Y = 180
const PEGS_DISTANCE = 63
const MAX_BALLS = 5
const TILE_SIZE = 95
const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'

const Buckets = [
    {multiplier: 1, x:0.25, y: 0.25, color: '#3c6e6f'},
    {multiplier: 8, x:0.5, y: 0.25, color: '#007727'},
    {multiplier: 2, x:0.75, y: 0.25, color: '#b8aa01'},
    {multiplier: 4, x:0.25, y: 0.5, color: '#0350a0'},
    {multiplier: 0, x:0.75, y: 0.5, color: '#966401'},
    {multiplier: 5, x:0.25, y: 0.75, color: '#48019d'},
    {multiplier: 3, x:0.5, y: 0.75, color: '#730075'}
]

// Helper functions
var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}

function lerp (min, max, t) {
    return min * (1-t) + max * t
}

function damp (a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt))
}

function clamp (val, a, b) {
    if (a < b) {
        return Math.max(a, Math.min(b, val)) 
    } else {
        return Math.max(b, Math.min(a, val)) 
    }
}

// Hundreds Helper Functions
var normalize = function (n) {
    var magnitude = Math.sqrt(n.x*n.x + n.y*n.y)
    n = {
        x: n.x / magnitude,
        y: n.y / magnitude
    }
    return n
}

var dotProduct = function (v1, v2) {
    // The dot product is the sum of products of the vector elements, so for two 2D vectors v1=(dx1,dy1) and v2=(dx2,dy2) the Dot Product is:
    // Dot(v1,v2)=(dx1*dx2)+(dy1*dy2)
    return v1.x * v2.x + v1.y * v2.y
}

//
var circleCollidesWith = function(object) {
    let dx = this.x - object.x;
    let dy = this.y - object.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.radius + object.radius;
}

var circleBounceOff = function(object) {
    // http://www.gamasutra.com/view/feature/131424/pool_hall_lessons_fast_accurate_.php?page=3
    const v1 = { x: this.dx, y: this.dy }
    const v2 = { x: object.dx, y: object.dy }
    var n = normalize ({ x: this.x - object.x, y: this.y - object.y })
    var a1 = dotProduct(v1, n)
    var a2 = dotProduct(v2, n)

    var optimizedP = (2.0 * (a1 - a2)) / (this.mass + object.mass);

    this.dx = v1.x - optimizedP * object.mass * n.x
    this.dy = v1.y - optimizedP * object.mass * n.y
    
    object.dx = v2.x + optimizedP * this.mass * n.x
    object.dy = v2.y + optimizedP * this.mass * n.y
    
    // OPTIONAL Do sparks at the midpoint
    var midpoint = {
        x: this.x + (object.x - this.x) * this.radius / object.radius,
        y: this.y + (object.y - this.y) * this.radius / object.radius
    };
    doSpark(midpoint.x, midpoint.y, a1, this.color)
    doSpark(midpoint.x, midpoint.y, a2, object.color)
}

var ballUpdate = function (dt) {
    if (!this.released && kontra.pointer.pressed('left')) {
        this.x = kontra.pointer.x
        if (!this.lastPosition) this.lastPosition = {x:this.x, y:this.y}
        this.dx = this.x - this.lastPosition.x
        this.dy = this.y - this.lastPosition.y
        this.lastPosition = {x:this.x, y:this.y}
    } else {
        if (!this.released) {
            this.ttl = 20 * 60;
            // Add a little jitter to prevent same drops
            this.dx = Math.random() * 0.2 - 0.1
            this.dy = Math.random() * 0.2 - 0.1
        }
        this.released = true
        this.advance()
    }
    this.mass = Math.PI * this.radius * this.radius

    // Cap the velocity
    let velocity = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
    if (velocity > this.maxVelocity) {
        this.dx *= this.maxVelocity / velocity
        this.dy *= this.maxVelocity / velocity
    }

    let n = normalize({x:this.dx, y:this.dy})

    // friction
    if (this.friction && this.released) {
        this.dx *= (1 - this.friction)
        this.dy *= (1 - this.friction)
    }

    if (this.x - this.radius < 0) {
        this.dx = Math.abs(this.dx)
        this.x = this.radius
    }
    if (this.x + this.radius > kontra.canvas.width){
        this.dx = -1 * Math.abs(this.dx)
        this.x = kontra.canvas.width - this.radius
    }
    if (this.y - this.radius < 0) {
        this.dy = Math.abs(this.dy)
        this.y = this.radius
    }
    if (this.y - this.radius > kontra.canvas.height) {
        this.ttl = -1;
    }
}

var pegUpdate = function (dt) {
    this.advance();
    this.dx = 0;
    this.dy = 0;
    return
}

var circleRender = function (dt) {
    kontra.context.save()
    // Circle
    kontra.context.strokeStyle = this.color;
    kontra.context.beginPath();
    kontra.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
    kontra.context.stroke()

    // Text
    if (this.value > 0) {
        kontra.context.fillStyle = this.color;
        this.context.font = (this.radius) + 'px Courier New'
        this.context.textBaseline = 'middle'
        let displayValue = Math.floor(this.value*10)/10;
        kontra.context.fillText(displayValue, this.x - 0.6*this.radius, this.y)
    }

    kontra.context.restore()
}

// Sprites
var peg = {
    type: 'peg',
    radius: 5,
    width: 2 * BALL_MIN_RADIUS,
    height: 2 * BALL_MIN_RADIUS,
    color: COLOR_GREEN,
    value: 0,
    mass: Number.MAX_SAFE_INTEGER,
    dy: 0,
    dx: 0,
    collidesWith: circleCollidesWith,
    bounceOff: circleBounceOff,
    update: pegUpdate,
    render: circleRender
}

var bucket = {
    width: PEGS_DISTANCE,
    height: 100,
    color: COLOR_AMBER,
    multiplier: 1,
    update: function (dt) {
        // Eat balls
        let balls = sprites.filter(s=>s.type=='ball')
        balls.forEach(ball=>{
            if (
                ball.x > this.x && 
                ball.x < this.x+this.width &&
                ball.y > this.y && 
                ball.y < this.y + this.height
            ) {
                ball.ttl = -1;
                uiSprite.updateScore(ball.value * this.multiplier)
                for (let i = 0; i < this.multiplier; i++) {
                    doFirework()
                }
            }
        })
        this.advance()
    },
    render: function (dt) {
        kontra.context.save()
        kontra.context.fillStyle = this.color
        kontra.context.fillRect(this.x, this.y, this.width, this.height)

        this.context.font = (this.width * 0.7) + 'px Courier New'
        this.context.textBaseline = 'middle'
        kontra.context.fillStyle = COLOR_GREEN;
        kontra.context.fillText(this.multiplier, this.x + 0.3*this.width, this.y + this.height * 0.5)
        
        kontra.context.restore()
    }
}

var ball = {
    type: 'ball',
    radius: 12,
    width: 2 * BALL_MIN_RADIUS,
    height: 2 * BALL_MIN_RADIUS,
    color: COLOR_AMBER,
    value: 10,
    dy: 0,
    dx: 0,
    maxVelocity: 10,
    ddy: .06,
    friction: 0.005,
    collidesWith: circleCollidesWith,
    bounceOff: circleBounceOff,
    update: ballUpdate,
    render: circleRender
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            let s = kontra.sprite(peg)
            s.x = PEGS_POS_X + col * PEGS_DISTANCE;
            if (row % 2 == 0) s.x += 30;
            s.y = PEGS_POS_Y + row * PEGS_DISTANCE;
            sprites.push(s);

            // Also a bucket at the bottom
            if (row == 5) {
                let b = kontra.sprite(bucket)
                b.color = Buckets[col].color;
                b.multiplier = Buckets[col].multiplier;
                b.x = s.x
                b.y = s.y
                sprites.unshift(b)
            }
        }
    }

    let ui = kontra.sprite({
        type: 'ui',
        total: 0,
        gameWon: false,
        gameOver: false,
        ballNumber: 0,
        updateScore: function(score) {
            this.ballNumber++
            this.total += score
            if (this.ballNumber >= MAX_BALLS) {
                this.gameOver = true;
            }
        },
        render: function (dt) {
            kontra.context.save()
            kontra.context.strokeStyle = COLOR_AMBER
            this.context.font = (TILE_SIZE * ((this.gameOver) ? 0.4 : 0.9)) + 'px Courier New'
            this.context.textBaseline = 'top'
            kontra.context.strokeRect(this.x+1, this.y+1, this.width-2, this.height-2)
            kontra.context.fillStyle = COLOR_AMBER
            let displayTotal = Math.floor(this.total*10)/10
            if (this.gameOver) {
                kontra.context.fillText("Score: " + displayTotal, 0, kontra.canvas.height * 0.5)
                kontra.context.fillText("touch to restart", 0, kontra.canvas.height - TILE_SIZE)
            }
            else {
                let displayBalls = (this.ballNumber+1) + "/" + MAX_BALLS
                kontra.context.fillText(displayBalls + "-" + displayTotal, 0, 0)
            }
            kontra.context.restore()
        }
    })
    sprites.push(ui)
    uiSprite = ui
}

kontra.keys.bind('r', function() {
    reset()
})

kontra.pointer.onDown(function () {
    if (uiSprite.gameOver) {
        console.log("resetting");
        reset()  
        return
    }
    // While there's no active ball, start a ball
    if (!sprites.find(s=>s.type=='ball')) {
        let s = kontra.sprite(ball)
        s.x = kontra.canvas.width * 0.5;
        s.y = kontra.canvas.height * 0.2;
        sprites.push(s)
    }
})

function doSpark(x,y,n,color) {
    let count = Math.abs(Math.floor(n))
    for(let i = 0; i < count; i++) {
        let angle = Math.random()*360;
        let particle = kontra.sprite({
            type:'particle',
            x: x,
            y: y,
            dx: n * Math.cos(degreesToRadians(angle)),
            dy: n * Math.sin(degreesToRadians(angle)),
            ttl: 20,
            radius:3,
            friction: 0.1,
            color:color,
            update: function (dt) {
                if (!this.startTtl) this.startTtl = this.ttl;
                // this.color = '#' + (this.ttl*15).toString(16) + (this.ttl*15).toString(16) + '00'
                if (this.friction) {
                    this.dx *= (1-this.friction)
                    this.dy *= (1-this.friction)
                }
                this.advance()

            },
            render: function () {
                kontra.context.save()
                kontra.context.fillStyle = this.color
                kontra.context.beginPath()
                kontra.context.arc(this.x, this.y, this.radius, 0, 2*Math.PI)
                kontra.context.fill()
                kontra.context.restore()
            }
        })
        sprites.push(particle)
    }
}

function doFirework() {
    let x = Math.random() * kontra.canvas.width
    let y = Math.random() * kontra.canvas.height/2
    for (let i = 0; i < 18; i++) {
        let particle = kontra.sprite({
            type:'particle',
            x: x,
            y: y,
            dx: 12 * Math.cos(degreesToRadians(i*20)),
            dy: 12 * Math.sin(degreesToRadians(i*20)),
            ddy:0.6, 
            ttl: 20,
            width:16,
            height:16,
            color:'#fff',
            update: function (dt) {
                // this.color = '#' + (this.ttl*15).toString(16) + (this.ttl*15).toString(16) + '00'
                this.advance()
            },
            render: function () {
                kontra.context.save()
                kontra.context.fillStyle = this.color
                kontra.context.beginPath()
                kontra.context.arc(this.x, this.y, 16, 0, 2*Math.PI)
                kontra.context.fill()
                kontra.context.restore()
            }
        })
        sprites.push(particle)
    }
}

function gameOver() {
    uiSprite.gameOver = true
}

// Boilerplate gameloop
var loop = kontra.gameLoop({
    fps: 60,
    update(dt) {
        // first a pass for physics
        var balls = sprites.filter(s => ['ball', 'peg'].indexOf(s.type) !== -1 && s.isAlive())
        for (let i = 0; i < balls.length-1; i++) {
            for (let j = i+1; j < balls.length; j++) {
                if (balls[i].collidesWith(balls[j])) {
                    if (balls[i].selected) {
                        gameOver()
                        balls[i].selected = false
                    } else if (balls[j].selected) {
                        gameOver()
                        balls[j].selected = false
                    } else {
                        balls[i].bounceOff(balls[j])
                    }
                }
            }
        }
        // then update
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render() {
        // Black background
        // kontra.context.fillStyle = 'black'
        kontra.context.fillRect(0,0,kontra.canvas.width, kontra.canvas.height)

        sprites.forEach(sprite => sprite.render())
    }
});
this.loop = loop

reset()
loop.start();