kontra.init('canvas')
var sprites = []

// Constants
const COLOR_RED = '#d04648'
const COLOR_BLUE = '#1e4a9d'
const COLOR_YELLOW = '#c8913e'
const COLOR_GREEN = '#466300'
const COLOR_BROWN = '#603915'
const COLOR_WHITE = '#f6f1e3'
const COLOR_AMBER = '#FFBF00'

const SETS = {
    red: COLOR_RED,
    green: COLOR_GREEN,
    blue: COLOR_BLUE,
    yellow: COLOR_YELLOW
}

// Helper Functions
var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}


var flash = {
    type: 'particle',
    anchor: {x: 0.5, y: 0.5},
    width: 20,
    height:20,
    ttl: 15,
    color: COLOR_RED,
    ddy: 1,
    update: function(dt) {
        if (!this.dx || !this.dy) {
            this.dx = Math.random() * 15 - 5
            this.dy = Math.random() * 15 - 13
        }
        this.advance()
        this.width--
        this.height--
    }
}


let cyclone = {
    anchor: { x: 0.5, y: 0.5 },
    x: 240,
    y: 240,
    angle: 0,
    speed: 3,
    combo: 0,
    score: 0,
    lastTap: 0,
    width: kontra.canvas.width - 100,
    height: kontra.canvas.height - 100,
    zones: [
        {start: 75, size: 10, bonus: 2, color: COLOR_BLUE},
        {start: 85, size: 10, bonus: 5, color: COLOR_RED},
        {start: 95, size: 10, bonus: 2, color: COLOR_BLUE}
    ],
    update: function(dt) {
        if (!kontra.pointer.pressed('left')) this.selected = false
        if (this.high === undefined) this.high = kontra.store.get('cyclone-high') || 0

        // Listen for all taps
        // The zone under the dot
        let zone = this.zones.find(zone => this.angle > zone.start && this.angle < zone.start + zone.size)
        if (!this.selected && kontra.pointer.pressed('left')) {
            if (!zone) {
                this.combo = 0
                this.score = 0
            } else {
                this.lastTap = 0
                this.score += zone.bonus
                this.combo++
                if (this.score > this.high) {
                    this.high = this.score
                    kontra.store.set('cyclone-high', this.score)
                }
                for (let i = 0; i < 15; i++) {
                    let s = kontra.sprite(flash)
                    s.x = this.x
                    s.y = this.y
                    s.color = zone.color
                    sprites.push(s)
                }
            }
            this.selected = true
        }
        this.angle = (this.angle + this.speed) % 360
        this.speed = Math.min(3 + this.combo / 6, 10)
        this.lastTap += this.speed
        if (this.lastTap > 360 && !zone) {
            this.score = 0
            this.combo = 0
        }
        this.advance(dt)
    },
    render: function(dt) {
        kontra.context.save()
        kontra.context.translate(this.x, this.y)

        // Draw the outline
        kontra.context.fillStyle = COLOR_WHITE
        kontra.context.beginPath()
        kontra.context.arc(0, 0, 0.5 * this.width, 0, 2 * Math.PI)
        kontra.context.fill()

        // Draw the zones
        this.zones.forEach((zone) => {
            kontra.context.save()
            kontra.context.rotate(degreesToRadians(zone.start))
            kontra.context.beginPath()
            kontra.context.moveTo(0,0)
            kontra.context.arc(0,0,this.width * 0.5, 0, degreesToRadians(zone.size))
            kontra.context.closePath()
            kontra.context.fillStyle = zone.color
            kontra.context.fill()
            kontra.context.restore()
        })
        // Draw the circle
        kontra.context.save()
        kontra.context.rotate(degreesToRadians(this.angle))
        kontra.context.beginPath()
        kontra.context.moveTo(this.width, 0)
        kontra.context.arc(this.width * 0.5 - 5, 0, 10, 0, 2 * Math.PI)
        kontra.context.fillStyle = 'black'
        kontra.context.fill()
        kontra.context.restore()
        
        // // Text info
        kontra.context.font = '32px Arial'
        kontra.context.fillStyle = COLOR_BROWN
        kontra.context.textBaseline = 'top'
        kontra.context.textAlign = 'center'
        kontra.context.fillText("Combo:" + this.combo + " Score: " + this.score + " High: " + this.high, 0, 0.5 * this.height)
        kontra.context.restore()
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    let d = kontra.sprite(cyclone)
    sprites.push(d)
    kontra.pointer.track(d)
}

kontra.keys.bind('r', function(e){
    reset()
})

// Boilerplate gameloop
var loop = kontra.gameLoop({
    update(dt) {
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render(dt) {
        sprites.forEach(sprite => sprite.render(dt))
    }
});
this.loop = loop

reset()
loop.start();