kontra.init()
var sprites = []
var tiles = [
    '1','2','3',
    '4','5','6',
    '7','8',''
]
var emptyTile = null

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

function clamp (val, a, b) {
    if (a < b) {
        return Math.max(a, Math.min(b, val)) 
    } else {
        return Math.max(b, Math.min(a, val)) 
    }
}

function tileCanMoveToPosition(tileIndex, newIndex) {
    console.log('tileCanMoveToPosition', tileIndex, newIndex)
    if (tiles[newIndex] !== '') return false // not open
    if (newIndex === tileIndex) return false // same position
    if (tileIndex === newIndex - 3) return true // above
    if (tileIndex === newIndex + 3) return true // below
    if (Math.floor(tileIndex / 3) === Math.floor(newIndex / 3)) {
        if (tileIndex - 1 === newIndex) return true // left
        if (tileIndex + 1 === newIndex) return true // right
    }
    return false
}

function swapTiles(tileIndex, newIndex) {
    var temp = tiles[newIndex]
    tiles[newIndex] = tiles[tileIndex]
    tiles[tileIndex] = temp
}

var tile = {
    index: 0,
    face: 'A',
    width: TILE_SIZE,
    height:TILE_SIZE,
    color: COLOR_GREEN,
    onDown: function() {
        if (!tileCanMoveToPosition(this.index, emptyTile.index)) return
        this.selected = true
        this.lastPosition = {
            x: kontra.pointer.x,
            y: kontra.pointer.y
        }
    },
    onUp: function() {
        this.selected = false;
        // If
    },
    update: function (dt) {
        if (this.selected && !kontra.pointer.pressed('left')) {
            this.onUp()
        }
        if (!this.selected) { // While not touching, damp to its correct position
            this.desiredX = PUZZLE_POS_X + (this.index % 3) * TILE_SIZE
            this.desiredY = PUZZLE_POS_Y + Math.floor(this.index / 3) * TILE_SIZE
            this.x = damp(this.x, this.desiredX, 8, dt)
            this.y = damp(this.y, this.desiredY, 8, dt)
        } else { // If it's touching, only move along the path it can slide
            let dx = kontra.pointer.x - this.lastPosition.x
            let dy = kontra.pointer.y - this.lastPosition.y

            this.x += dx
            this.y += dy

            // Clamp to the line segment between this and the empty face
            this.x = clamp(this.x, this.desiredX, emptyTile.desiredX)
            this.y = clamp(this.y, this.desiredY, emptyTile.desiredY)

            this.lastPosition = {
                x: kontra.pointer.x,
                y: kontra.pointer.y
            }
        }
    },
    render: function (dt) {
        if (!this.face) return; // The empty one doesn't get rendered
        kontra.context.save()
        kontra.context.fillStyle = 'black'
        kontra.context.fillRect(this.x, this.y, this.width, this.height)
        kontra.context.strokeStyle = this.color
        this.context.font = "96px Courier New"
        this.context.textBaseline = 'top'
        kontra.context.strokeRect(this.x, this.y, this.width, this.height)
        kontra.context.fillStyle = this.color
        kontra.context.fillText(this.face, this.x, this.y)
        kontra.context.restore()
    }
}

// Set up the GUI
let reset = function() {
    // Create 9 tiles
    for (let i = 0; i < 9; i++) {
        let s = kontra.sprite(tile)
        s.index = i
        s.face = tiles[i]
        // Put it in its spot
        s.update()
        s.x = s.desiredX
        s.y = s.desiredY


        this.sprites.push(s)
        // Make it touchable
        if (s.face) kontra.pointer.track(s)
        else emptyTile = s // This is a special tile
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
        // Black background
        // kontra.context.fillStyle = 'black'
        kontra.context.fillRect(0,0,kontra.canvas.width, kontra.canvas.height)

        sprites.forEach(sprite => sprite.render())
    }
});
this.loop = loop

reset()
loop.start(); 
