kontra.init('canvas')
var loop
var sprites = []
var uiSprite
const trackImage = 'images/track2.png'

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

var ui = {
    time: 0,
    update: function (dt) {
        if (this.time === undefined) this.time = 0
        if (this.high === undefined) this.high = kontra.store.get('kart-high') || 30000
        this.time++
    },
    raceComplete: function (lapNumber) {
        if (this.high === undefined) this.high = kontra.store.get('kart-high') || Infinity
        if (this.time < this.high) {
            this.high = this.time
            kontra.store.set('hexagon-high', this.time)
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

let terrain = {
    anchor: {x: 0.5, y: 0.5},
    width:1024*2,
    height:1024*2,
    color: 'green',
    image: '',
    x: 0,
    y: 0,
    angle1: 0,
    angle2: 83,
    update: function(dt) {
        if (this.player) {
            this.anchor = {
                x: this.player.x / this.width,
                y: this.player.y / this.height
            }
            this.angle1 = this.player.rotation
        }
    },
    render: function(dt) {
        // Terrain
        let {angle1, angle2} = this
        let cs = Math.cos(degreesToRadians(angle1)),
            sn = Math.sin(degreesToRadians(angle1)),
            h = Math.cos(degreesToRadians(angle2)),
            a = cs, // Horizontal scaling
            b = h * sn, // Horizontal skewing
            c = -1 * sn, // Vertical skewing
            d = h * cs, // Vertical scaling
            e = 0.5 * kontra.canvas.width, // Horizontal moving
            f = 0.75 * kontra.canvas.height // Vertical moving
        kontra.context.save()
        kontra.context.setTransform(a, b, c, d, e, f)
        this.draw()
        kontra.context.restore()
        // Perspective
        for (let y = 0; y < kontra.canvas.height; y=y+10) {
            let destWidth = kontra.canvas.width * ( 1 + 0.3 * y / kontra.canvas.height)
            let xOffset = (kontra.canvas.width - destWidth) * 0.5
            kontra.context.drawImage(kontra.canvas,
                0, y, kontra.canvas.width, 10, // sx, sy, sw, sh
                xOffset, y, destWidth, 10 // dx, dy, dw, dh
            )
        }
    }
}

let player = {
    anchor: {x: 0.5, y:1.0},
    x: 314, // Terrain position
    y: 1108,
    width: 16,
    height:16,
    speed: 10,
    rotation: 0,
    rotateSpeed: 2,
    color: 'red',
    update: function (dt) {
        // Keyboard Controls
        if (kontra.keys.pressed('a')) this.rotation += this.rotateSpeed
        if (kontra.keys.pressed('d')) this.rotation -= this.rotateSpeed
        this.rotation = ( this.rotation + 360 ) % 360
        if (kontra.keys.pressed('w')) {
            // this.x -= Math.sin(degreesToRadians(this.angle1)) * this.speed
            // this.y -= Math.cos(degreesToRadians(this.angle1)) * this.speed
            this.dx = -Math.sin(degreesToRadians(this.rotation)) * this.speed
            this.dy = -Math.cos(degreesToRadians(this.rotation)) * this.speed
        } else if (kontra.keys.pressed('s')) {
            // this.x += Math.sin(degreesToRadians(this.angle1)) * this.speed
            // this.y += Math.cos(degreesToRadians(this.angle1)) * this.speed
            this.dx = Math.sin(degreesToRadians(this.rotation)) * this.speed
            this.dy = Math.cos(degreesToRadians(this.rotation)) * this.speed
        } else if (kontra.pointer.pressed('left')) {
            // Touch controls
            
            // Always forward
            this.dx = -Math.sin(degreesToRadians(this.rotation)) * this.speed
            this.dy = -Math.cos(degreesToRadians(this.rotation)) * this.speed
            this.rotation -= 2 * (kontra.pointer.x / kontra.canvas.width - 0.5) * this.rotateSpeed
        } else {
            this.dx = this.dy = 0
        }

        this.advance()
        console.log(">", this.x, this.y)
    },
    render: function (dt) {
        // Player is always drawn at the bottom middle
        kontra.context.save()
        kontra.context.fillStyle = this.color
        kontra.context.fillRect(
            (kontra.canvas.width - this.width) * 0.5,
            kontra.canvas.height * 0.75 - this.height,
            this.width, this.height
        )
        kontra.context.restore()
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)

    kontra.assets.load(trackImage)
    .then(images => {
        let t = kontra.sprite(terrain)
        t.image = kontra.assets.images[trackImage]
        let p = kontra.sprite(player)
        t.player = p
        sprites.push(t)
        sprites.push(p)
        uiSprite = kontra.sprite(ui)

        loop.start();
    }) 
}

kontra.keys.bind('r', function() {
    console.log("resettting")
    reset()
})

let gameOver = function() {
    loop.stop()
}

var loop = kontra.gameLoop({
    update(dt) {
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
        uiSprite.update(dt)
    },
    render(dt) {
        // Sprites
        sprites.forEach(sprite => sprite.render(dt))
        uiSprite.render(dt)
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
