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
    scale: 12,
    x: kontra.canvas.width * 0.5,
    y: kontra.canvas.height * 0.5,
    color: 'red',
    loaded: false,
    update: function(dt) {
        this.rotation += degreesToRadians(ROTATE_SPEED)
        if (!this.loaded) {
            this.loaded = true
            kontra.assets.load(boatImage)
                .then(() => {
                    this.image = kontra.assets.images[boatImage]
                })
        }
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
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    let d = kontra.sprite(boat)
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