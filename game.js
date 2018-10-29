kontra.init()
var sprites = []
var tiles = [
    '1','2','3',
    '4','5','6',
    '7','8',' '
]

// Constants
const PUZZLE_POS_X = 50
const PUZZLE_POS_Y = 50
const TILE_SIZE = 120
const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'

// Helper functions
function lerp (min, max, t) {
    return min * (1-t) + max * t
}

function damp (a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt))
}

function tileCanMoveToPosition(tileIndex, newIndex) {
    if (tiles[newIndex] !== ' ') return false // not open
    if (newIndex === tileIndex) return false // same position
    if (tileIndex === newIndex - 3) return true // above
    if (tileIndex === newIndex + 3) return true // below
    if (Mathfloor(tileIndex / 3) === Math.floor(newIndex / 3)) {
        if (tileIndex - 1 === newIndex) return true // left
        if (tileInex + 1 === newIndex) return true // right
    }
    return false
}

var tile = {
    index: 0,
    face: 'A',
    width: TILE_SIZE,
    height:TILE_SIZE,
    color: COLOR_GREEN,
    update: function (dt) {
        // While not touching, damp to its correct position
        this.desiredX = PUZZLE_POS_X + (this.index % 3) * TILE_SIZE
        this.desiredY = PUZZLE_POS_Y + Math.floor(this.index / 3) * TILE_SIZE
        this.x = damp(this.x, this.desiredX, 8, dt)
        this.y = damp(this.y, this.desiredY, 8, dt)
    },
    render: function (dt) {
        kontra.context.save()
        kontra.context.strokeStyle = this.color
        kontra.context.fillStyle = this.color
        this.context.font = "96px Courier New"
        this.context.textBaseline = 'top'
        kontra.context.strokeRect(this.x, this.y, this.width, this.height)
        kontra.context.fillText(this.face, this.x, this.y)
        kontra.context.restore()
    }
}

let ui = kontra.sprite({
    render: function (dt) {
        // fill a background
    }
})

// Set up the GUI
let reset = function() {
    // Create 8 tiles
    for (let i = 0; i < 8; i++) {
        let s = kontra.sprite(tile)
        s.index = i
        s.face = '' + (i+1)
        // Put it in its spot
        s.update()
        s.x = s.desiredX
        s.y = s.desiredY

        // Make it touchable

        this.sprites.push(s)
    }
    // OLD CODE
    // // Place the critter in the middle
    // let critterSprite = kontra.sprite(critter)
    // sprites.push(critterSprite)
    // kontra.pointer.track(critterSprite)
    // // Position operators
    // for (let i = 0; i < Operators.length; i++) {
    //     let s = kontra.sprite(food)
    //     s.critter = critterSprite
    //     s.color = Operators[i].color
    //     s.operator = Operators[i].operator
    //     s.x = s.desiredX = Operators[i].x * kontra.canvas.width // remove - 24 when anchor works
    //     s.y = s.desiredY = Operators[i].y * kontra.canvas.width // Squared screen
    //     kontra.pointer.track(s)
    //     sprites.push(s)
    // }
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
