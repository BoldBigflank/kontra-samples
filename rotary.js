kontra.init('canvas')
var sprites = []

// Constants
const COLOR_ERASER = '#ffffff'
const COLOR_BLACK = '#000000'
const COLOR_TEAL = '#3c6e6f'
const COLOR_GREEN = '#007727'
const COLOR_YELLOW = '#b8aa01'
const COLOR_BLUE = '#0350a0'
const COLOR_ORANGE = '#966401'
const COLOR_PURPLE = '#48019d'
const COLOR_VIOLET = '#730075'
const COLOR_RED = '#9c0e3e'

const COLORS = [
    COLOR_BLACK,
    COLOR_ERASER,
    COLOR_TEAL,
    COLOR_GREEN,
    COLOR_YELLOW,
    COLOR_BLUE,
    COLOR_ORANGE,
    COLOR_PURPLE,
    COLOR_VIOLET,
    COLOR_RED
]

const SPRITE_WIDTH = 16
const SPRITE_HEIGHT = 16
const PIXEL_SIZE = kontra.canvas.width / SPRITE_WIDTH

// Helper Functions
var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}

// Sprites
let dial = {
    x: 50,
    y: 50,
    width: kontra.canvas.width - 100,
    height: kontra.canvas.height - 100,
    angle: 0.3,
    rotationSpeed: Math.PI / 90,
    radius: 75,
    onDown: function() {
        this.selected = true
        let center = { x: this.x + this.width * 0.5, y: this.y + this.height * 0.5 }
        this.startAngle = Math.atan2((kontra.pointer.y - center.y), (kontra.pointer.x - center.x)) + Math.PI
        console.log("startAngle", this.startAngle / Math.PI * 180)
    },
    onOver: function() {
        if (this.selected) {
            let center = { x: this.x + this.width * 0.5, y: this.y + this.height * 0.5 }
            var newAngle = Math.atan2((kontra.pointer.y - center.y), (kontra.pointer.x - center.x)) + Math.PI
            if (newAngle < this.startAngle) newAngle += 2 * Math.PI
            console.log("newAngle", (newAngle - this.startAngle)/Math.PI * 180)
            this.angle = newAngle - this.startAngle

        }
          
    },
    update: function(dt) {
        if (!kontra.pointer.pressed('left')) this.selected = false
        if (!this.selected) {
            if (this.angle > 0) {
                this.angle = this.angle - this.rotationSpeed
            }
        }
        this.angle = Math.max(0, this.angle)
        // this.angle++
    },
    render: function(dt) {
        kontra.context.save()
        kontra.context.translate(this.x + 0.5 * this.width, this.y + 0.5 * this.height)
        // Numbers
        for (let i = 0; i < 10; i++) {
            let angle = degreesToRadians(-30 + i * -27)
            let numX = Math.cos(angle) * 150
            let numY = Math.sin(angle) * 150
            kontra.context.fillText((i+1)%10, numX, numY)
        }

        // Stop circle
        let angle = degreesToRadians(45)
        let numX = Math.cos(angle) * 150
        let numY = Math.sin(angle) * 150
        kontra.context.beginPath()
        kontra.context.fillStyle = '#8b8b8b'
        kontra.context.arc(numX, numY, 30, 0, 2 * Math.PI)
        kontra.context.fill()
        
        // Finger wheel
        kontra.context.beginPath()
        kontra.context.arc(0, 0, 200, 0, 2 * Math.PI)
        kontra.context.stroke()
        kontra.context.beginPath()
        kontra.context.arc(0, 0, 20, 0, 2 * Math.PI)
        kontra.context.stroke()
        for (let i = 0; i < 10; i++) {
            let angle = degreesToRadians(-30 + i * -27) + this.angle
            let numX = Math.cos(angle) * 150
            let numY = Math.sin(angle) * 150
            kontra.context.beginPath()
            kontra.context.arc(numX, numY, 30, 0, 2 * Math.PI)
            kontra.context.stroke()
        }

        kontra.context.restore()
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    let d = kontra.sprite(dial)
    sprites.push(d)
    kontra.pointer.track(d)
    // Drawing
    // let s = kontra.sprite(sketch)
    // kontra.pointer.track(s)
    // sprites.push(s)
    // for (let i = 0; i < COLORS.length; i++) {
    //     let c = kontra.sprite(swatch) 
    //     c.color = COLORS[i]
    //     c.width = PIXEL_SIZE
    //     c.height = PIXEL_SIZE
    //     c.y = PIXEL_SIZE*SPRITE_HEIGHT + 4
    //     c.x = (PIXEL_SIZE+2)*i
    //     sprites.push(c)
    //     kontra.pointer.track(c)
    // }
    // let p = kontra.sprite(preview)
    // sprites.push(p)
    // kontra.pointer.track(p)
    // sprites.find(s => s.type === 'swatch').onDown()
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
    render() {
        sprites.forEach(sprite => sprite.render())
    }
});
this.loop = loop

reset()
loop.start();