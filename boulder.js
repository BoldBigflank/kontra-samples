kontra.init('canvas')
var sprites = []
var playerSprite, uiSprite

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
    y: kontra.canvas.height - 50,
    width:50,
    height:50,
    speed: 4,
    color: "#ce251b",
    anchor: {
        x: 0.5,
        y: 0.5
    },
    update: function (dt) {
        if (this.data) {
            this.x = (clamp(this.data, -23, 23) + 23) / 46 * kontra.canvas.width
            this.y = kontra.canvas.height - this.height
        } else {
            if (kontra.keys.pressed('left') || kontra.keys.pressed('a')) {
                this.x -= this.speed
            }
            if (kontra.keys.pressed('right') || kontra.keys.pressed('d')) {
                this.x += this.speed
            }
            this.x = clamp(this.x, 0, kontra.canvas.width)
        }
    }
}

let lemming = {
    x:0,
    y:0,
    anchor: {
        x: 0.5,
        y: 0.5
    },
    width:10,
    height:10,
    dy: 1,
    color: COLOR_AMBER,
    initialize: function () {
        this.x = Math.random() * kontra.canvas.width
        this.y = 0
        this.dx = Math.random() - 0.5
        this.dy = 0.75 + Math.random() * 0.5
    },
    update: function(dt) {
        this.advance()
        if (this.y > kontra.canvas.height + 0.5 * this.height) this.initialize()
        if (this.x < 0) this.dx = Math.abs(this.dx)
        else if (this.x > kontra.canvas.width) this.dx = -1 * Math.abs(this.dx)
        this.x = clamp(this.x, 0, kontra.canvas.width)
    }
}

let path = {
    color: COLOR_GREEN,
    points: [{ x: 240, y: 0, width: 100 }],
    dy: 2.4,
    update: function (dt) {
        // move each point down
        this.points.forEach(p => p.y += this.dy)
        // Add a point if it's ready
        if (this.points[0].y > 0) {
            let firstPoint = this.points[0]
            this.points.unshift({ x: firstPoint.x + Math.random() * 30-15, y: firstPoint.y - PATH_DISTANCE, width: 100 })
        }
    },
    render: function (dt) {
        // draw the left side
        kontra.context.fillStyle = this.color
        kontra.context.beginPath()
        this.points.forEach((p,i) => {
            if (i == 0) {
                kontra.context.moveTo(0, p.y)
            }
            kontra.context.lineTo(p.x - p.width * 0.5, p.y)
            if (i == this.points.length - 1) {
                kontra.context.lineTo(0, p.y)
            }
        })
        kontra.context.closePath()
        kontra.context.fill()

        // // draw the right side
        kontra.context.beginPath()
        this.points.forEach((p,i) => {
            if (i == 0) {
                kontra.context.moveTo(kontra.canvas.width, p.y)
            }
            kontra.context.lineTo(p.x + p.width * 0.5, p.y)
            if (i == this.points.length - 1) {
                kontra.context.lineTo(kontra.canvas.width, p.y)
            }
        })
        kontra.context.closePath()
        kontra.context.fill()
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
        if (this.high === undefined) this.high = kontra.store.get('high') || 0

        this.time++
        if (this.time > this.high) {
            this.high = this.time
            kontra.store.set('high', this.time)
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
        l.y = -1 * i * 90
        sprites.push(l)
    }
    // // background
    // let b = kontra.sprite(background)
    // sprites.push(b)

    // // Create 1-4 bars for each level, push them out 
    // for (let i = 0; i < BAR_LEVELS; i++) {
    //     let barNumber = 2 + Math.floor(Math.random() * 3)
    //     let barStartAngle = Math.floor(Math.random() * 5) * 60
    //     for (let j = 0; j < barNumber; j++) {
    //         // Rotate it around the hexagon
    //         let s = kontra.sprite(bar)
    //         s.level = i + DELAY_BARS
    //         s.a1 = barStartAngle + j * 60
    //         s.a2 = s.a1 + 60
    //         sprites.push(s)
    //     }
    // }

    // Path
    let p = kontra.sprite(path)
    sprites.unshift(p)

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