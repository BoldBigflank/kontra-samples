kontra.init('canvas')
var sprites = []
var playerSprite, pathSprite, uiSprite

// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_AMBER = '#FFBF00'
const PATH_DISTANCE = 40
const BAR_LEVELS = 60
const DELAY_BARS = 6

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

// Sprites
let player = {
    x: kontra.canvas.width * 0.5,
    desiredX: kontra.canvas.width * 0.5,
    y: 150,
    dy: 3,
    desiredDY: 3,
    width:50,
    height:50,
    speed: 4,
    color: "#ce251b",
    anchor: {
        x: 0.5,
        y: 1
    },
    update: function (dt) {
        if (this.data) {
            this.desiredX = (clamp(this.data, -23, 23) + 23) / 46 * kontra.canvas.width
        } else {
            this.desiredX = clamp(kontra.pointer.x, 0, kontra.canvas.width)
        }
        this.x = damp(this.x, this.desiredX, 4, dt)
        let pathIndex = Math.floor((kontra.canvas.height - this.y) / PATH_DISTANCE)
        let pathPoint = pathSprite.points[pathIndex]
        if (pathPoint) {
            let onThePath = Math.abs(pathPoint.x - this.x) < this.width
            let l = onThePath ? 2 : 8
            this.desiredDY = onThePath ? 6 : 2
            this.dy = damp(this.dy, this.desiredDY, l, dt)
        }

        // Did it squish any lemmings?
        sprites.forEach(s=>{
            if (s.type !== 'lemming') return
            if (this.collidesWith(s)) {
                s.color = '#ff0000'
                s.dx = 0
            }
        })
    }
}

let lemming = {
    type: 'lemming',
    x:0,
    y:0,
    anchor: {
        x: 0.5,
        y: 1
    },
    width:10,
    height:10,
    dy: -2,
    color: COLOR_AMBER,
    initialize: function () {
        this.x = Math.random() * kontra.canvas.width
        this.y = kontra.canvas.height + Math.random() * 150
        this.dx = Math.random() - 0.5
        this.dy = -0.75 - Math.random() * 0.5
        this.color = COLOR_AMBER
    },
    update: function(dt) {
        this.dy = (this.color == COLOR_AMBER) ? 3 - playerSprite.dy : -1 * playerSprite.dy
        this.advance()
        if (this.y < 0) this.initialize()
        if (this.x < 0) this.dx = Math.abs(this.dx)
        else if (this.x > kontra.canvas.width) this.dx = -1 * Math.abs(this.dx)
        this.x = clamp(this.x, 0, kontra.canvas.width)
        this.width = this.height = 10 + this.y / kontra.canvas.height * 10
    }, render: function (dt) {
        let anchorWidth = -this.width * this.anchor.x;
        let anchorHeight = -this.height * this.anchor.y;
        kontra.context.save()
        kontra.context.translate(this.x, this.y)
        kontra.context.fillStyle = this.color
        kontra.context.fillRect(anchorWidth, anchorHeight, this.width, this.height )
        kontra.context.restore()
    }
}

let path = {
    angle1: 0,
    angle2: 75,
    color: COLOR_GREEN,
    points: [{ x: 240, y: 0, width: 100 }],
    update: function (dt) {
        this.x = 0.5 * kontra.canvas.width
        this.y = kontra.canvas.height
        // move each point down
        this.points.forEach(p => p.y += playerSprite.dy)
        // Add a point if it's ready
        if (this.points[0].y > 0) {
            let firstPoint = this.points[0]
            this.points.unshift({ x: firstPoint.x + Math.random() * 30-15, y: firstPoint.y - PATH_DISTANCE, width: 100 })
        }
    },
    render: function (dt) {
        // draw the left side
        kontra.context.fillStyle = this.color
        let lastPoint
        this.points.forEach((p,i) => {
            if (i == 0) {
                lastPoint = p
                return
            }
            let width1 = lastPoint.width * (1 + (1 - lastPoint.y / kontra.canvas.height))
            let x1 = lastPoint.x - 0.5 * width1
            let x2 = lastPoint.x + 0.5 * width1
            let width2 = p.width * (1 + (1 - p.y / kontra.canvas.height))
            let x3 = p.x + 0.5 * width2
            let x4 = p.x - 0.5 * width2

            let y1 = kontra.canvas.height - lastPoint.y
            let y2 = kontra.canvas.height - p.y

            kontra.context.beginPath()
            kontra.context.moveTo(x1, y1)
            kontra.context.lineTo(x2, y1)
            kontra.context.lineTo(x3, y2)
            kontra.context.lineTo(x4, y2)
            kontra.context.closePath()
            kontra.context.fill()
            lastPoint = p
        })
    }
}

let background = {
    color: '#4b1503',
    color2: '#6e2003',
    render: function (dt) {
        for (let i = 0; i < 6; i++) {
            let a1 = degreesToRadians(i * 60)
            let a2 = degreesToRadians((i+1) * 60)
            kontra.context.save()
            // kontra.context.translate(0.5 * kontra.canvas.width, 0.5 * kontra.canvas.height)
            kontra.context.rotate(degreesToRadians(30))
            kontra.context.fillStyle = (i%2==0) ? this.color : this.color2
            kontra.context.beginPath()
            kontra.context.arc(0, 0, BAR_DISTANCE * BAR_LEVELS * BAR_LEVELS, a1, a2)
            kontra.context.lineTo(0, 0)
            kontra.context.fill()
            kontra.context.restore()
        }
    }
}

let ui = {
    time: 0,
    data: {

    },
    update: function (dt) {
        if (this.time === undefined) this.time = 0
        if (this.high === undefined) this.high = kontra.store.get('boulder-high') || 0

        this.time++
        if (this.time > this.high) {
            this.high = this.time
            kontra.store.set('boulder-high', this.time)
        }
    },
    render: function (dt) {
        let dataString = "test"
        if (this.data) dataString = JSON.stringify(this.data, null, 2)

        // Background box
        let w = kontra.context.measureText(dataString).width
        kontra.context.fillStyle = 'black'
        kontra.context.beginPath()
        kontra.context.moveTo(0,0)
        kontra.context.lineTo(w+25, 0)
        kontra.context.lineTo(w+10, 72)
        kontra.context.lineTo(0, 72)
        kontra.context.closePath()
        kontra.context.fill()

        // Time Text
        kontra.context.fillStyle = 'white'
        kontra.context.font = '36px Courier New'
        kontra.context.textBaseline = 'top'
        kontra.context.fillText(dataString, 0, 0)
        // kontra.context.fillText(highScore, 0, 0)
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    
    // Make a few lemmings to squish
    for (let i = 0; i < 12; i++) {
        let l = kontra.sprite(lemming)
        l.initialize()
        l.y = i * PATH_DISTANCE + kontra.canvas.height * 0.5
        sprites.push(l)
    }

    // Path
    pathSprite = kontra.sprite(path)
    sprites.unshift(pathSprite)

    // Player
    playerSprite = kontra.sprite(player)
    sprites.push(playerSprite)

    uiSprite = kontra.sprite(ui)
    sprites.push(uiSprite)

    loop.start()
}
kontra.keys.bind('r', function() {
    reset()
})

let gameOver = function() {
    loop.stop()
}

// Boilerplate gameloop
var loop = kontra.gameLoop({
    update: function(dt) {
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render: function(dt) {
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
loop.start();
var handleOrientation = function (e) {
    playerSprite.data = e.gamma
    uiSprite.data = e.gamma
}
window.addEventListener('deviceorientation', handleOrientation)