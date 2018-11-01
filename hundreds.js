kontra.init()
var sprites = []
var uiSprite = null;

// Constants
const BALL_MIN_RADIUS = 40
const BALL_START_VELOCITY = 1

const PUZZLE_POS_X = 50
const PUZZLE_POS_Y = 50
const PUZZLE_COLUMNS = 4
const TILE_SIZE = 95
const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'

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

// Sprites
var ball = {
    type: 'ball',
    radius: 10,
    width: 2 * BALL_MIN_RADIUS,
    height: 2 * BALL_MIN_RADIUS,
    color: 'white',
    value: 0,
    dy: 1,
    dx: 1,
    collidesWithPointer: function(pointer) {
        // perform a circle v circle collision test
        let dx = pointer.x - this.x;
        let dy = pointer.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius;
    },
    onDown: function () {
        this.selected = true
    },
    onUp: function () {
        this.selected = false
    },
    collidesWith: function(object) {
        let dx = this.x - object.x;
        let dy = this.y - object.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.radius + object.radius;
    },
    bounceOff: function(object) {
        // http://www.gamasutra.com/view/feature/131424/pool_hall_lessons_fast_accurate_.php?page=3
        const v1 = {
            x: this.dx,
            y: this.dy
        }

        const v2 = {
            x: object.dx,
            y: object.dy
        }

        var n = normalize ({
            x: this.x - object.x,
            y: this.y - object.y
        })
        
        var a1 = dotProduct(v1, n)
        var a2 = dotProduct(v2, n)

        var optimizedP = (2.0 * (a1 - a2)) / (this.mass + object.mass);
        
        this.dx = v1.x - optimizedP * object.mass * n.x
        this.dy = v1.y - optimizedP * object.mass * n.y
        
        object.dx = v2.x + optimizedP * this.mass * n.x
        object.dy = v2.y + optimizedP * this.mass * n.y
    },
    update: function (dt) {
        if (this.selected) {
            this.value++
        } else {
            this.advance()
        }
        this.radius = BALL_MIN_RADIUS + this.value
        this.mass = Math.PI * this.radius * this.radius

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
        if (this.y + this.radius > kontra.canvas.height) {
            this.dy = -1 * Math.abs(this.dy)
            this.y = kontra.canvas.height - this.radius
        }
    },
    render: function (dt) {
        kontra.context.save()
        kontra.context.strokeStyle = this.selected ? COLOR_AMBER : COLOR_GREEN
        kontra.context.beginPath();
        kontra.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
        kontra.context.stroke()
        this.context.font = (this.radius*0.9) + 'px Courier New'
        this.context.textBaseline = 'middle'
        kontra.context.fillStyle = this.selected ? COLOR_AMBER : COLOR_GREEN
        kontra.context.fillText(this.value, this.x - 0.5*this.radius, this.y)
        kontra.context.restore()
    }
}

// Set up the GUI
let reset = function(ballCount) {
    ballCount = ballCount || 4
    sprites.forEach(s=>s.ttl=-1)
    for (let i = 0; i < ballCount; i++) {
        let s = kontra.sprite(ball)
        s.x = 0.5 * kontra.canvas.width + Math.cos( 2 * Math.PI * i / ballCount ) * kontra.canvas.width * 0.25
        s.y = 0.5 * kontra.canvas.height + Math.sin( 2 * Math.PI * i / ballCount ) * kontra.canvas.height * 0.25
        let randomAngle = Math.random() * 2 * Math.PI
        s.dx = Math.cos(randomAngle) * BALL_START_VELOCITY
        s.dy = Math.sin(randomAngle) * BALL_START_VELOCITY
        kontra.pointer.track(s)
        sprites.push(s)
    }

    let ui = kontra.sprite({
        type: 'ui',
        tota: 0,
            gameWon: false,
        gameOver: false,
        ballCount: ballCount,
        update: function (dt) {
            this.total = sprites.reduce((t, s) => t + parseInt(s.value || 0), 0)
            if (!this.gameWon && this.total >= 100) {
                this.gameWon = true
                reset(++this.ballCount)
                doFirework()
            }

        },
        render: function (dt) {
            kontra.context.save()
            kontra.context.strokeStyle = COLOR_AMBER
            this.context.font = (TILE_SIZE * ((this.gameOver) ? 0.4 : 0.9)) + 'px Courier New'
            this.context.textBaseline = 'top'
            kontra.context.strokeRect(this.x+1, this.y+1, this.width-2, this.height-2)
            kontra.context.fillStyle = this.gameOver ? COLOR_AMBER : COLOR_GREEN
            if (this.gameOver) {
                kontra.context.fillText("Highest level: " + ballCount, 0, kontra.canvas.height * 0.5)
                kontra.context.fillText("touch to restart", 0, kontra.canvas.height - TILE_SIZE)
            }
            else
                kontra.context.fillText(this.total, 0, kontra.canvas.height - TILE_SIZE)
            kontra.context.restore()
        }
    })
    sprites.push(ui)
    uiSprite = ui
}

kontra.keys.bind('r', function() {
    reset(4)
})

kontra.pointer.onDown(function () {
    if (kontra.pointer.pressed('left'))
        if (uiSprite.gameOver) reset(4)
})

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
    update(dt) {
        // first a pass for physics
        var balls = sprites.filter(s => s.type === 'ball' && s.isAlive())
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
