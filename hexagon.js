kontra.init('canvas')
var sprites = []
var playerSprite, uiSprite

// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_AMBER = '#FFBF00'
const BAR_DISTANCE = 40
const BAR_LEVELS = 60
const DELAY_BARS = 6

// Helper functions
var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}

let tiltCamera = {
    update: function (dt) {
   },
    shift: function () {
        
    },
    unshift: function () {

    }
}

// Sprites
let player = {
    angle: 180,
    speed: 6,
    color: "#ce251b",
    width:10,
    height:10,
    level: 1.2,
    anchor: {
        x: 0.5,
        y: 0.5
    },
    update: function (dt) {
        if (kontra.pointer.pressed('left')) {
            this.angle += (kontra.pointer.x > 0.5 * kontra.canvas.width) ? this.speed : -1 * this.speed
        }
        if (kontra.keys.pressed('left') || kontra.keys.pressed('a')) {
            this.angle += -1 * this.speed
        }
        if (kontra.keys.pressed('right') || kontra.keys.pressed('d')) {
            this.angle += this.speed
        }
        this.angle = (360 + this.angle) % 360
        this.radius = this.level * this.level * BAR_DISTANCE
    },
    render: function (dt) {
        kontra.context.save()
        // kontra.context.translate(kontra.canvas.width * 0.5, kontra.canvas.height * 0.5)
        kontra.context.rotate(degreesToRadians(this.angle))
        kontra.context.fillStyle = this.color
        kontra.context.fillRect(-0.5 * this.width, -0.5 * this.height + this.radius, this.width, this.height)
        kontra.context.strokeRect(-0.5 * this.width, -0.5 * this.height + this.radius, this.width, this.height)
        kontra.context.restore()
    }
}

let bar = {
    a1: 0,
    a2: 360 * 0.2,
    level: 12,
    speed: 1 / 36,
    height: 30,
    color: "#ce251b",
    update: function (dt) {
        // Tick down
        // If we're in the player's viciinity, see if we hit the player
        this.level -= this.speed
        this.radius = (this.level > 1) ? this.level * this.level * BAR_DISTANCE : this.level * BAR_DISTANCE
        if (this.radius < -1 * this.height) {
            // reset or hide
            this.level += BAR_LEVELS
        }
        if (playerSprite.radius < this.radius + this.height &&
            playerSprite.radius > this.radius &&
            playerSprite.angle >= this.a1 &&
            playerSprite.angle <= this.a2) {
            gameOver()
        }
    },
    render: function (dt) {
        kontra.context.save()
        kontra.context.fillStyle = this.color
        // kontra.context.translate(kontra.canvas.width * 0.5, kontra.canvas.height * 0.5)
        kontra.context.beginPath()
        kontra.context.rotate(degreesToRadians(this.a1))
        kontra.context.moveTo(0, Math.max(this.radius, 0))
        kontra.context.lineTo(0, this.radius+this.height)
        kontra.context.rotate(degreesToRadians(this.a2 - this.a1))
        kontra.context.lineTo(0, this.radius + this.height)
        kontra.context.lineTo(0, Math.max(this.radius, 0))
        kontra.context.closePath()
        kontra.context.fill()
        kontra.context.restore()
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
        let highSeconds = Math.floor(this.high / 60)
        if (highSeconds < 10) highSeconds = "0" + highSeconds
        let highMillis = Math.floor((this.high % 60)*100/60)
        if (highMillis < 10) highMillis = "0" + highMillis
        let highScore = "BEST:" + highSeconds + "." + highMillis

        let seconds = Math.floor(this.time / 60)
        if (seconds < 10) seconds = "0" + seconds
        let millis = Math.floor((this.time % 60)*100/60)
        if (millis < 10) millis = "0" + millis
        let score = "TIME:" + seconds + "." + millis

        // Background box
        let w = kontra.context.measureText(highScore).width
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
        kontra.context.fillText(score, 0, 36)
        kontra.context.fillText(highScore, 0, 0)
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    
    // background
    let b = kontra.sprite(background)
    sprites.push(b)

    // Create 1-4 bars for each level, push them out 
    for (let i = 0; i < BAR_LEVELS; i++) {
        let barNumber = 2 + Math.floor(Math.random() * 3)
        let barStartAngle = Math.floor(Math.random() * 5) * 60
        for (let j = 0; j < barNumber; j++) {
            // Rotate it around the hexagon
            let s = kontra.sprite(bar)
            s.level = i + DELAY_BARS
            s.a1 = barStartAngle + j * 60
            s.a2 = s.a1 + 60
            sprites.push(s)
        }
    }

    // Player
    playerSprite = kontra.sprite(player)
    sprites.push(playerSprite)

    uiSprite = kontra.sprite(ui)
    
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
        if (this.time === undefined) this.time = 0
        if (this.angle1 === undefined) this.angle1 = 0
        this.time++
        this.angle1 = this.time * 0.7
        this.angle2 = 45 // Math.sin(degreesToRadians(this.time))

        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
        uiSprite.update()
    },
    render: function(dt) {
        let {angle1, angle2, time} = this
        let cs = Math.cos(degreesToRadians(angle1)),
            sn = Math.sin(degreesToRadians(angle1)),
            h = Math.cos(degreesToRadians(angle2)),
            a = cs, // Horizontal scaling
            b = h * sn, // Horizontal skewing
            c = -1 * sn, // Vertical skewing
            d = h * cs, // Vertical scaling
            e = 0.5 * kontra.canvas.width, // Horizontal moving
            f = 0.5 * kontra.canvas.height // Vertical moving
        kontra.context.save()
        kontra.context.setTransform(a, b, c, d, e, f)
        sprites.forEach(sprite => sprite.render())
        kontra.context.restore()
        uiSprite.render()
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