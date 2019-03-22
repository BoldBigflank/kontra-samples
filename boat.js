kontra.init('canvas')
var sprites = []

// Constants
const boatImage = './images/boat.png'
const ROTATE_SPEED = 1
const BOAT_IMAGE_HEIGHT = 8

// Helper Functions
var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}
let boat = {
    anchor: {x: 0.5, y: 0.5},
    width: 24,
    height: 8,
    scale: 4,
    x: kontra.canvas.width * 0.5,
    y: kontra.canvas.height * 0.5,
    color: 'red',
    loaded: false,
    update: function(dt) {
        // this.rotation += degreesToRadians(ROTATE_SPEED)
        this.rotation = Math.atan2(this.dy, this.dx)
        if (!this.loaded) {
            this.loaded = true
            kontra.assets.load(boatImage)
                .then(() => {
                    this.image = kontra.assets.images[boatImage]
                })
        }
        if (this.x < 0) this.dx = Math.abs(this.dx)
        if (this.x > kontra.canvas.width) this.dx = -1 * Math.abs(this.dx)
        if (this.y < 0) this.dy = Math.abs(this.dy)
        if (this.y > kontra.canvas.height) this.dy = -1 * Math.abs(this.dy)
        this.ddx = (kontra.canvas.width * 0.5 - this.x) * 0.0001
        this.ddy = (kontra.canvas.height * 0.5 - this.y) * 0.0001
        this.advance()
    },
    render: function(dt) {
        if (!this.image) {
            this.draw()
            return
        }
        // Draw each layer
        // this.draw()
        kontra.context.save()
        kontra.context.translate(this.x, this.y)
        let slices = Math.floor(this.image.height / BOAT_IMAGE_HEIGHT)
        for (let i = slices - 1; i >= 0; i--) {
            kontra.context.save()
            kontra.context.translate(0, (i - slices) * this.scale) // Go down for each
            kontra.context.rotate(this.rotation) // Rotate the amount
            // kontra.context.fillRect(-this.width * this.anchor.x, -this.height * this.anchor.y, this.width, this.height)
            kontra.context.drawImage(
                this.image,
                0, i * BOAT_IMAGE_HEIGHT, this.image.width, BOAT_IMAGE_HEIGHT,
                -this.width * this.anchor.x * this.scale, -this.height * this.anchor.y * this.scale, this.width * this.scale, this.height * this.scale
            )
            kontra.context.restore()
        }
        kontra.context.restore()
    }
}
// Set up the GUI
let reset = function(count) {
    sprites.forEach(s=>s.ttl=-1)
    for (let i = 0; i < 10; i++) {
        let d = kontra.sprite(boat)
        d.x = Math.random() * kontra.canvas.width
        d.y = Math.random() * kontra.canvas.height
        d.dx = Math.random() * 2 - 1
        d.dy = Math.random() * 2 - 1
        // d.ddx = Math.random() * 0.1 - 0.05
        // d.ddy = Math.random() * 0.1 - 0.05
        d.rotation = Math.random() * 2 * Math.PI
        sprites.push(d)
        kontra.pointer.track(d)
    }
}

kontra.keys.bind('r', function(e){
    reset()
})
kontra.keys.bind('')

// Boilerplate gameloop
var loop = kontra.gameLoop({
    update(dt) {
        sprites.forEach(sprite => sprite.update(dt))
        // Sort based on y
        sprites = sprites.sort((a,b) => a.y - b.y )
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render(dt) {
        sprites.forEach(sprite => sprite.render(dt))
    }
});
this.loop = loop

reset()
loop.start();