kontra.init('canvas')
var sprites = []

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

var airplane = {
    anchor: {
        x: 0.5,
        y: 0.5
    },
    x: 0,
    y: 240,
    width: 25,
    height: 25,
    dx: 1,
    dy: 1,
    speed: 1,
    angle: 0,
    color: COLOR_GREEN,
    onDown: function () {
        this.selected = true
        this.path = []
    },
    onUp: function () {
        this.selected = false
    },
    update: function (dt) {
        if (!kontra.pointer.pressed('left')) this.selected = false
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
    },
    render: function (dt) {
        // First the path
        let context = kontra.context
        let line = this.path
        if (line && line.length > 0) {
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
        context.fillRect(-this.width * this.anchor.x,  -this.height * this.anchor.y, this.width, this.height)
        context.restore()
        // kontra.context.font = '36px Courier New'
        // context.fillText(""+this.angle, 0,50)

    }
}

var landing = {
    x: 300,
    y: 400,
    width: 50,
    height: 10,
    color: COLOR_GREEN
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

    // Landing pad
    let l = kontra.sprite(landing)
    sprites.push(l)

    let a = kontra.sprite(airplane)
    kontra.pointer.track(a)
    sprites.push(a)
}

// Boilerplate gameloop
var loop = kontra.gameLoop({
    update(dt) {
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render() {
        sprites.forEach(sprite => sprite.render())
    }
});
this.loop = loop

reset()
loop.start();