kontra.init()
var sprites = []
const SOLVED = [
    'A','B','C',
    'D','E','F',
    'G','H',''
]
var tiles = [
    'A','B','C',
    'D','E','F',
    'G','H',''
]
var emptyTile = null

// Constants
const PUZZLE_POS_X = 50
const PUZZLE_POS_Y = 50
const TILE_SIZE = 120
const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'

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

// Puzzle Helper Functions
function tileCanMoveToPosition(tileIndex, newIndex) {
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

function availableMoves(tileIndex) {
    var result = []
    tiles.forEach((t, i) => {if (tileCanMoveToPosition(i, tileIndex)) result.push(i)})
    return result
}

function shufflePuzzle(turns) {
    for(let i = 0; i < turns; i++) {
        let emptyIndex = tiles.indexOf('')
        let moveTiles = availableMoves(emptyIndex)
        let swapIndex = parseInt(moveTiles[Math.floor(Math.random()*moveTiles.length)])
        swapTiles(emptyIndex, swapIndex)

    }
}

function isSolved() {
    for(let i = 0; i < SOLVED.length; i++) {
        if (tiles[i] !== SOLVED[i]) return false
    }
    return true
}

// Sprites
var tile = {
    index: 0,
    face: 'A',
    width: TILE_SIZE,
    height:TILE_SIZE,
    color: COLOR_GREEN,
    onDown: function() {
        if (!tileCanMoveToPosition(this.index, emptyTile.index)) return
        swapTiles(this.index, emptyTile.index)
        if (isSolved()) {
            gameOver()
        }
    },
    update: function (dt) {
        // Find the index in the array
        this.index = tiles.indexOf(this.face)
        this.desiredX = PUZZLE_POS_X + (this.index % 3) * TILE_SIZE
        this.desiredY = PUZZLE_POS_Y + Math.floor(this.index / 3) * TILE_SIZE
        this.x = damp(this.x, this.desiredX, 12, dt)
        this.y = damp(this.y, this.desiredY, 12, dt)
    },
    render: function (dt) {
        if (!this.face) return; // The empty one doesn't get rendered
        kontra.context.save()
        kontra.context.fillStyle = 'black'
        kontra.context.fillRect(this.x, this.y, this.width, this.height)
        kontra.context.strokeStyle = this.color
        this.context.font = (TILE_SIZE*0.9) + 'px Courier New'
        this.context.textBaseline = 'top'
        kontra.context.strokeRect(this.x, this.y, this.width, this.height)
        kontra.context.fillStyle = this.color
        kontra.context.fillText(this.face, this.x + 0.2*TILE_SIZE, this.y)
        kontra.context.restore()
    }
}

// Set up the GUI
let reset = function() {
    // Create 9 tiles
    shufflePuzzle(50)
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
}

function gameOver() {
    // Do fireworks
    let s = kontra.sprite({
        x: kontra.canvas.width/2,
        y: kontra.canvas.height/2,
        fireworkCooldown: -1,
        ttl: 10 * 60,
        update: function (dt) {
            this.advance()
            if (this.fireworkCooldown < 0) {
                let x = Math.random() * kontra.canvas.width
                let y = Math.random()*kontra.canvas.height/2
                for (let i = 0; i < 18; i++) {
                    let particle = kontra.sprite({
                        type:'particle',
                        x: x,
                        y: y,
                        dx: 12 * Math.cos(degreesToRadians(i*20)),
                        dy: 12 * Math.sin(degreesToRadians(i*20)),
                        ddy:0.6, 
                        ttl: 20,
                        width:16,
                        height:16,
                        color:'#fff',
                        update: function (dt) {
                            // this.color = '#' + (this.ttl*15).toString(16) + (this.ttl*15).toString(16) + '00'
                            this.advance()
                        },
                        render: function () {
                            kontra.context.save()
                            kontra.context.fillStyle = this.color
                            kontra.context.beginPath()
                            kontra.context.arc(this.x, this.y, 16, 0, 2*Math.PI)
                            kontra.context.fill()
                            kontra.context.restore()
                        }
                    })
                    sprites.push(particle)
                }
                this.fireworkCooldown = 15
            }
            this.fireworkCooldown--
        }
    })
    sprites.push(s)
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