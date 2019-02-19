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

var sketch = {
    type: 'sketch',
    x: 0,
    y: 0,
    width: PIXEL_SIZE * SPRITE_WIDTH,
    height: PIXEL_SIZE * SPRITE_HEIGHT,
    data: null,
    color: COLOR_BLACK,
    onDown: function() {
        this.onOver()
    },
    onOver: function() {
        if (!this.data) return
        if (kontra.pointer.pressed('left')) {
            // Color the hovered pixel with the selected color
            let y = Math.floor((kontra.pointer.y - this.y) / PIXEL_SIZE)
            let x = Math.floor((kontra.pointer.x - this.x) / PIXEL_SIZE)
            if (x >= 0 && y >= 0 && x < SPRITE_WIDTH && y < SPRITE_HEIGHT)
                this.data[y][x] = this.color
        }
    },
    update: function(dt) {
        if (!this.data) {
            this.data = []
            for(let y = 0; y < SPRITE_HEIGHT; y++) {
                let row = []
                for (let x = 0; x < SPRITE_WIDTH; x++) {
                    row.push(-1)
                }
                this.data.push(row)
            }
        }
    },
    render: function(dt) {
        if (!this.data) return;
        // For each
        // Draw the grid
        for(let y = 0; y < SPRITE_HEIGHT; y++) {
            for (let x = 0; x < SPRITE_WIDTH; x++) {
                let cell = this.data[y][x]
                if (cell !== -1) {
                    kontra.context.save()
                    kontra.context.translate(x*PIXEL_SIZE, y*PIXEL_SIZE)
                    kontra.context.fillStyle = cell
                    kontra.context.fillRect(0,0,PIXEL_SIZE,PIXEL_SIZE)
                    kontra.context.restore()
                }
                kontra.context.save()
                kontra.context.translate(x*PIXEL_SIZE, y*PIXEL_SIZE)
                kontra.context.fillStyle = 'black'
                kontra.context.fillRect(-1,-1,1,1)
                kontra.context.restore()
            }
        }
    }
}

let preview = {
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
    scale: 4,
    color: 'black',
    update: function(dt) {
        if (!this.sketch) this.sketch = sprites.find(s => s.type === 'sketch')
        this.width = SPRITE_WIDTH * this.scale
        this.height = SPRITE_HEIGHT * this.scale
        this.x = kontra.canvas.width - this.width
        this.y = kontra.canvas.height - this.height
    },
    onDown: function(dt) {
        this.scale = this.scale * 2
        if (this.scale > 8) this.scale = 1
    },
    render: function(dt) {
        if (!this.sketch || !this.sketch.data) return
        kontra.context.save()
        kontra.context.translate(this.x, this.y)
        kontra.context.lineWidth = 1
        kontra.context.strokeStyle = 'black'
        kontra.context.strokeRect(0, 0, this.width, this.height)
        kontra.context.restore()
        for(let y = 0; y < SPRITE_HEIGHT; y++) {
            for (let x = 0; x < SPRITE_WIDTH; x++) {
                let cell = this.sketch.data[y][x]
                if (cell !== -1) {
                    kontra.context.save()
                    kontra.context.translate(this.x + x*this.scale, this.y + y*this.scale)
                    kontra.context.fillStyle = cell
                    kontra.context.fillRect(0,0,this.scale,this.scale)
                    kontra.context.restore()
                }
            }
        }
    }
}

let swatch = {
    type: 'swatch',
    color: COLOR_BLACK,
    sketch: null,
    selected: false,
    onDown: function() {
        if (!this.sketch) this.sketch = sprites.find(s => s.type === 'sketch')
        this.sketch.color = this.color
        sprites.forEach(s => {
            if (s.type === 'swatch')
                s.selected = false 
        })
        this.selected = true
    },
    render: function(dt) {
        this.draw()
        if (this.selected) {
            kontra.context.save()
            kontra.context.translate(this.x, this.y)
            kontra.context.strokeStyle = 'black'
            kontra.context.lineWidth = 4
            kontra.context.strokeRect(0, 0, this.width, this.height)
            kontra.context.restore()
        }
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    // Drawing
    let s = kontra.sprite(sketch)
    kontra.pointer.track(s)
    sprites.push(s)
    for (let i = 0; i < COLORS.length; i++) {
        let c = kontra.sprite(swatch) 
        c.color = COLORS[i]
        c.width = PIXEL_SIZE
        c.height = PIXEL_SIZE
        c.y = PIXEL_SIZE*SPRITE_HEIGHT + 4
        c.x = (PIXEL_SIZE+2)*i
        sprites.push(c)
        kontra.pointer.track(c)
    }
    let p = kontra.sprite(preview)
    sprites.push(p)
    kontra.pointer.track(p)
    sprites.find(s => s.type === 'swatch').onDown()
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