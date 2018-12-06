kontra.init('canvas')
var loop
var sprites = []
var uiSprite

// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_AMBER = '#FFBF00'

// Helper functions
var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}

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

function clamp (val, a, b) {
    if (a < b) {
        return Math.max(a, Math.min(b, val)) 
    } else {
        return Math.max(b, Math.min(a, val)) 
    }
}

var warningFlash = {
    anchor: {x: 0.5, y: 0.5},
    ttl: 15,
    speed: 1,
    color: '#ff0000',
    width: 25,
    height: 25,
    radius: 25,
    update: function (dt) {
        this.radius += this.speed
        this.width += this.speed
        this.height += this.speed
        this.advance()
    },
    render: function (dt) {
        kontra.context.save()
        kontra.context.strokeStyle = this.color
        kontra.context.beginPath()
        // kontra.context.moveTo(this.x, this.y)
        kontra.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
        kontra.context.stroke()
        kontra.context.restore()
    }
}

var airplane = {
    type: 'plane',
    anchor: {
        x: 0.5,
        y: 0.5
    },
    x: 0,
    y: 240,
    width: 25,
    height: 25,
    radius: 12.5,
    dx: 1,
    dy: 1,
    speed: 0.5,
    angle: 0,
    color: COLOR_GREEN,
    warningCooldown: 0,
    onDown: function () {
        this.selected = true
        this.path = []
    },
    onUp: function () {
        this.selected = false
    },
    update: function (dt) {
        if (!kontra.pointer.pressed('left')) this.selected = false
        this.warningCooldown --
        if (this.selected) {
            // Add to the line
            let newPoint = {x: Math.floor(kontra.pointer.x), y: Math.floor(kontra.pointer.y)}
            let lastPoint = (this.path.length > 0) ? this.path[this.path.length-1] : null
            if (!lastPoint || newPoint.x !== lastPoint.x || newPoint.y !== lastPoint.y) {
                this.path.push(newPoint)
            }
        }
        // Move along line speed distance
        // If there's more line to follow
        if (this.path && this.path.length > 0) {
            // Update the angle
            let point = this.path[0]
            this.angle = Math.atan2(point.y - this.y, point.x - this.x)
        }
        // If we are out of bounds, turn towards the center
        if (this.x < 50 || this.x > kontra.canvas.width- 50 ||
            this.y < 50 || this.y > kontra.canvas.height - 50) {
            let targetVector = {x: kontra.canvas.width * 0.5 - this.x, y: kontra.canvas.height * 0.5 - this.y}
            let targetAngle = Math.atan2(targetVector.y, targetVector.x)
            if (Math.abs(targetAngle - this.angle) > Math.PI) targetAngle += 2 * Math.PI
            this.angle += (this.angle > targetAngle) ? degreesToRadians(-2) : degreesToRadians(2)
        }
        if (this.angle < 0) this.angle += degreesToRadians(360)

        // Set dx and dy to the angle of the line it's following
        this.dx = Math.cos(this.angle) * this.speed
        this.dy = Math.sin(this.angle) * this.speed
        this.advance()
        // If we made it to the point, delete it
        while(this.path && this.path.length > 0) {
            let point = this.path[0]
            let vec = {
                x: point.x - this.x,
                y: point.y - this.y
            }

            var distance = Math.sqrt(vec.x * vec.x + vec.y * vec.y)
            if (distance > 1) {
                break;
            }
            this.path.shift()
        }

        // Am I near another plane?
        var planes = sprites.filter(s => s.type == 'plane')
        planes.forEach(p => {
            if (this == p || this.landed || p.landed) return
            let x = this.x - p.x
            let y = this.y - p.y
            let distance = Math.sqrt(x*x + y*y)
            if (distance < this.radius + p.radius) {
                // Crashed!
                loop.stop()
            } else if (distance < 3 * (this.radius + p.radius) ) {
                // Warning!
                if (this.warningCooldown < 0) {
                    let l = kontra.sprite(warningFlash)
                    l.x = this.x
                    l.y = this.y
                    sprites.push(l)
                    this.warningCooldown = 25
                }
            }
        })

        // Am I landed?
        // TODO: Move this to the pad
        var pads = sprites.filter(s => s.type == 'pad')
        pads.forEach(p => {
            if (p.collidesWith(this)) {
                // Score!
                uiSprite.score++
                this.color = "#999999"
                this.landed = true
                this.angle = p.rotation
                this.path = []
                kontra.pointer.untrack(this)
                this.ttl = 90
            }
        })
    },
    render: function (dt) {
        // First the path
        let context = kontra.context
        let line = this.path
        if (!this.landed && line && line.length > 0) {
            context.strokeStyle = this.color
            context.lineWidth = 2,
            context.beginPath();
            context.moveTo(this.x, this.y)
            // context.moveTo(line[0].x, line[0].y)
            line.forEach((point) => {
                context.lineTo(point.x, point.y)
            })
            // context.closePath()
            context.stroke()
        }
        // Then the plane
        context.save()
        context.translate(this.x, this.y)
        context.rotate(this.angle)
        context.fillStyle = this.color
        context.fillRect(-this.radius,  -this.radius, 2*this.radius, 2*this.radius)
        context.restore()
        // kontra.context.font = '36px Courier New'
        // context.fillText(""+this.angle, 0,50)

    }
}

var landing = {
    type: 'pad',
    anchor: {
        x: 0.5, y: 0.5
    },
    x: 300,
    y: 400,
    rotation: degreesToRadians(180),
    width: 50,
    height: 10,
    color: COLOR_GREEN,
    update: function (dt) {
        if (this.rotation < 0) this.rotation += 2 * Math.PI
    },
    collidesWith: function (p) {
        if (this.color !== p.color) return false
        if (p.landed) return false
        if (Math.abs(p.angle - this.rotation) > Math.PI/2) {
            return false
        }
        
        let x = this.x - p.x
        let y = this.y - p.y
        let distance = Math.sqrt(x*x + y*y)
        return (distance < p.radius)
    },
    render: function (dt) {
        kontra.context.save()
        let x = this.x
        let y = this.y
        kontra.context.translate(this.x, this.y)
        kontra.context.rotate(this.rotation)
        kontra.context.rotate(-Math.PI * 0.5)

        // Runway
        kontra.context.fillStyle = "#14141f"
        kontra.context.fillRect( -this.width * this.anchor.x, -this.height * this.anchor.y, this.width, this.height + 100 )
        

        // Entrance
        kontra.context.fillStyle = this.color
        kontra.context.fillRect( -this.width * this.anchor.x, -this.height * this.anchor.y, this.width, this.height )
        kontra.context.restore()
    }
}

var ui = {
    score: 0,
    planes: 0,
    nextPlane: 1,
    update: function (dt) {
        if (this.highScore === undefined) {
            this.highScore = kontra.store.get('flight-high') || 0
        }
        if (this.score > this.highScore) {
            this.highScore = this.score
            kontra.store.set('flight-high', this.score)
        }
        // time out some planes to fly in
        if (this.nextPlane === undefined) this.nextPlane = 60 * 6
        this.nextPlane--
        if (this.nextPlane === 0) {
            this.planes++
            let a = kontra.sprite(airplane)
            a.color = (Math.random() > 0.66) ? COLOR_AMBER : COLOR_GREEN;
            a.speed = (a.color == COLOR_GREEN) ? 0.3 : 0.45
            let angle = Math.random() * 2 * Math.PI
            a.x = Math.cos(angle) * kontra.canvas.width + 0.5 * kontra.canvas.width
            a.x = clamp(a.x, -a.radius, kontra.canvas.width + a.radius)
            a.angle = angle - Math.PI
            a.y = Math.sin(angle) * kontra.canvas.height + 0.5 * kontra.canvas.height
            a.y = clamp(a.y, -a.radius, kontra.canvas.height + a.radius)
            kontra.pointer.track(a)
            sprites.push(a)
            this.nextPlane = 60 * 6 - this.planes*5
            this.nextPlane = clamp(60 * 6 - this.planes*5, 60 * 3, 6000)
        }
    },
    render: function (dt) {
        // blue water
        kontra.context.save()
        kontra.context.fillStyle = "#0033cc"
        kontra.context.fillRect(0, 0, kontra.canvas.width, kontra.canvas.height)
        // green land
        kontra.context.fillStyle = "#009900"
        kontra.context.fillRect(120, 80, 280, 320)
        kontra.context.fillRect(70, 190, 280, 320)
        // Score
        kontra.context.fillStyle = "#ffffff"
        kontra.context.font = '36px Courier New'
        kontra.context.textBaseline = 'top'
        let message = "Score:" + this.score
        kontra.context.fillText(message, 0, 0)
        let highText = "High:" + this.highScore
        let w = kontra.context.measureText(highText).width
        kontra.context.fillText(highText, kontra.canvas.width - w, 0)
    }
}

var sketch = {
    x: 0,
    y: 0,
    width: kontra.canvas.width,
    height:kontra.canvas.height,
    lines: [],
    color: COLOR_GREEN,
    thickness: 5,
    onDown: function () {
        this.drawing = true;
        // Add a new line
        this.lines.push([{x: kontra.pointer.x, y: kontra.pointer.y}])
    },
    onOver: function () {
        if (this.drawing) {
            let line = this.lines[this.lines.length-1]
            line.push({x: kontra.pointer.x, y: kontra.pointer.y})
        }
    },
    onUp: function () {
        this.drawing = false;
    },
    render: function (dt) {
        let context = kontra.context
        context.strokeStyle = this.color
        context.lineWidth = this.thickness,
        this.lines.forEach((line) => {
            context.beginPath();
            context.moveTo(line[0].x, line[0].y)
            line.forEach((point) => {
                context.lineTo(point.x, point.y)
            })
            // context.closePath()
            context.stroke()
        })
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    // // Drawing
    // let s = kontra.sprite(sketch)
    // kontra.pointer.track(s)
    // sprites.push(s)

    uiSprite = kontra.sprite(ui)
    sprites.push(uiSprite)

    // Landing pads
    let l = kontra.sprite(landing)
    l.x = 300
    l.y = 400
    l.rotation = degreesToRadians(180)
    sprites.push(l)
    
    let l2 = kontra.sprite(landing)
    l2.x = 150
    l2.y = 200
    l2.rotation = 0
    sprites.push(l2)

    let l3 = kontra.sprite(landing)
    l3.color = COLOR_AMBER
    l3.x = 250
    l3.y = 250
    l3.rotation = degreesToRadians(120)
    sprites.push(l3)

    loop.start();
}

kontra.keys.bind('r', function() {
    console.log("resettting")
    reset()
})

let gameOver = function() {
    loop.stop()
}

// Boilerplate gameloop
loop = kontra.gameLoop({
    update(dt) {
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render() {
        sprites.forEach(sprite => sprite.render())
    }
});
this.loop = loop

kontra.canvas.addEventListener('mousedown', function (e) {
    if (loop.isStopped) reset()
})
kontra.canvas.addEventListener('touchstart', function (e) {
    if (loop.isStopped) reset()
})

reset()
