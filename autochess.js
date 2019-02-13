kontra.init('canvas')
var loop
var sprites = []
var ss // spritesheet

// Constants
const TILE_WIDTH = TILE_HEIGHT = 48
const FPS = 60

const COLOR_RED = '#d04648'
const COLOR_BLUE = '#1e4a9d'
const COLOR_YELLOW = '#c8913e'
const COLOR_GREEN = '#466300'
const COLOR_AMBER = '#FFBF00'

var Background = {
    src: 'https://via.placeholder.com/480/480/ffffff/000000/?text=background'
}

var Pieces = [
    { class: 'skeleton' },
    { class: 'parrot' },
    { class: 'parrot2' },
    { class: 'mate' },
    { class: 'mate2' },
    { class: 'mate3' },
    { class: 'mate4' },
    { class: 'p1' }
]

// Assets
const ssImage = 'images/pirates.v1.png'

// Helper Functions
var DegreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}

function Lerp (min, max, t) {
    return min * (1-t) + max * t
}

function Damp (a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt))
}

function GridAvailable(x, y) {
    return (sprites.find( s => { return (s.gridX == x && s.gridY == y) }) === undefined)
}

function WorldToGridPos(p) {
    let g = sprites.find(s => { return (s.type == 'grid') })
    if (!g) return null
    if (p.x < g.x || p.x > g.x + g.width ||
        p.y < g.y || p.y > g.y + g.height ) return null
    return {
        x: Math.floor((p.x - g.x) / TILE_WIDTH),
        y: Math.floor((p.y - g.y) / TILE_HEIGHT)
    }
}

function GridToWorldPos(x, y) {
    let g = sprites.find(s => { return (s.type == 'grid') })
    if (!g) return
    return {
        x: g.x + (x + 0.5) * TILE_WIDTH,
        y: g.y + (y + 0.5) * TILE_HEIGHT
    }
}


// Sprites
var attackParticle = {
    type: 'particle',
    anchor: {x: 0.5, y: 0.5},
    ttl: 15,
    width: 60,
    height: 60,
    color: COLOR_YELLOW,
    update: function(dt) {
        this.width -= 4
        this.height -= 4
        this.advance()
    }
}

var piece = {
    anchor: {x: 0.5, y: 0.5},
    width: 48,
    height: 48,
    active: false,

    type: 'piece',
    team: 'p1',
    class: 'skeleton',
    health: 5,
    range: 1,
    damage: 1,
    cooldown: 0,
    gridX: -1,
    gridY: -1,
    onDown: function() {
        if (this.gridX < 0) { // Only unplaced pieces get to be dragged
            this.selected = true
            this.lastPosition = {
                x: kontra.pointer.x,
                y: kontra.pointer.y
            }
        }
    },
    onUp: function() {
        this.selected = false
        let pos = WorldToGridPos(this)
        if (!pos) return
        if (GridAvailable(pos.x, pos.y)) {
            this.gridX = pos.x
            this.gridY = pos.y
        }
        let p = GridToWorldPos(this.gridX, this.gridY)
        this.x = p.x
        this.y = p.y
    },
    action: function() {
        this.cooldown = 1 * FPS
        // Find closest enemy
        let enemy = undefined
        let enemyDistance = Infinity
        sprites
        .filter(s=>{return (s.type === 'piece' && s.team !== this.team && s.gridX !== -1)})
        .forEach(s => {
            let distance = Math.abs(s.gridX - this.gridX) + Math.abs(s.gridY - this.gridY)
            if ( distance < enemyDistance ) {
                enemy = s
                enemyDistance = distance
            }
        })
        if (!enemy) return
        if (
            (Math.abs(this.gridX - enemy.gridX) <= this.range && this.gridY == enemy.gridY) ||
            (Math.abs(this.gridY - enemy.gridY) <= this.range && this.gridX == enemy.gridX)
        ) {
            // if in attack range, init an attack
            enemy.health -= this.damage
            var p = kontra.sprite(attackParticle)
            p.x = enemy.x
            p.y = enemy.y
            sprites.push(p)
            // Set attack cooldown
            this.cooldown = 45
        } else {
            // else find a closer tile to move
            let moved = false
            if (!moved && enemy.gridX > this.gridX) {
                if (GridAvailable(this.gridX + 1, this.gridY)) {
                    this.gridX++
                    moved = true
                }
            }
            if (!moved && enemy.gridX < this.gridX) {
                if (GridAvailable(this.gridX - 1, this.gridY)) {
                    this.gridX--
                    moved = true
                }
            }
            if (!moved && enemy.gridY > this.gridY) {
                if (GridAvailable(this.gridX, this.gridY + 1)) {
                    this.gridY++
                    moved = true
                }
            }
            if (!moved && enemy.gridY < this.gridY) {
                if (GridAvailable(this.gridX, this.gridY - 1)) {
                    this.gridY--
                    moved = true
                }
            }
            if  (moved) {
                let p = GridToWorldPos(this.gridX, this.gridY)
                this.x = p.x
                this.y = p.y
            }
            // Set move cooldown
            this.cooldown = 1 * FPS
        }
    },
    update: function (dt) {
        if (this.selected && !kontra.pointer.pressed('left')) {
            this.onUp()
        }

        if (this.selected) {
            let dx = kontra.pointer.x - this.lastPosition.x
            let dy = kontra.pointer.y - this.lastPosition.y
            this.x += dx
            this.y += dy
            this.lastPosition = {x: kontra.pointer.x , y: kontra.pointer.y }
        }

        // If no health, die
        if (this.health < 1) this.ttl = 0

        // tick cooldown
        this.cooldown--

        // If off cooldown, this.action
        if (this.active && this.cooldown < 1) { this.action() }
        this.advance()
    },
    render: function (dt) {
        kontra.context.save()
        kontra.context.translate(this.x, this.y)
        kontra.context.fillStyle = this.team
        kontra.context.fillRect(-0.5 * TILE_WIDTH, -0.5 * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT)
        kontra.context.fillStyle = 'white'
        kontra.context.fillText(this.health, -0.5 * TILE_WIDTH, -0.5 * TILE_HEIGHT + 6)
        kontra.context.restore()
        this.draw()
    }
}

var grid = {
    type: 'grid',
    x: 48,
    y: 48,
    width: TILE_WIDTH * 8,
    height: TILE_HEIGHT * 10,
    color: COLOR_YELLOW,
    render: function (dt) {
        kontra.context.save()
        kontra.context.translate(this.x, this.y)
        kontra.context.fillStyle = this.color
        // Draw vertical lines
        for (let x = 0; x <= this.width; x=x+TILE_WIDTH) {
            kontra.context.fillRect(x-1, 0, 2, this.height)
        }
        // Draw horizontal lines
        for (let y = 0; y <= this.height; y=y+TILE_HEIGHT) {
            kontra.context.fillRect(0, y-1, this.width, 2)
        }
        kontra.context.restore()
    }
}

let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    // let backgroundSprite = kontra.sprite(background);
    // sprites.push(backgroundSprite);
    
    kontra.assets.load(ssImage)
    .then((images) => {
        // Spritesheet
        if (!ss) {
            ss = kontra.spriteSheet({
                image: kontra.assets.images[ssImage],
                frameWidth: 16,
                frameHeight: 16,
                animations: {
                    p1: { frames: 18, loop: false },
                    p2: { frames: 19, loop: false },
                    p3: { frames: 20, loop: false },
                    p4: { frames: 21, loop: false },
                    skeleton: { frames: 17, loop: false },
                    parrot: { frames: 24, loop: false },
                    parrot2: { frames: 25, loop: false },
                    mate: { frames: 16 * 4 + 1, loop: false },
                    mate2: { frames: 16 * 4 + 2, loop: false },
                    mate3: { frames: 16 * 4 + 3, loop: false },
                    mate4: { frames: 16 * 4 + 4, loop: false },
                    hat: { frames: 0, loop: false}
                }
            })
        }

        // Grid
        let g = kontra.sprite(grid)
        sprites.push(g)

        // Options across the bottom
        for ( let t = 0; t < 2; t++) {
            let team = t ? 'red' : 'blue'
            let y = t ? 24 : 480 + 48 + 40
            for (let i = 0; i < Pieces.length; i++) {
                let s = kontra.sprite(piece)
                s.team = team
                s.x = 68 * i + 40;
                s.y = y;
                s.class = Pieces[i].class
                s.animations = ss.animations
                s.playAnimation(Pieces[i].class)
                kontra.pointer.track(s)
                sprites.push(s)
            }
        }

    })
}

loop = kontra.gameLoop({  // create the main game loop
    fps: FPS,
  update(dt) {        // update the game state
    sprites.forEach(sprite => { sprite.update(dt) })
    sprites = sprites.filter(sprite => sprite.isAlive());
  },
  render() {        // render the game state
    sprites.forEach(sprite => { sprite.render() })
  }
});

kontra.keys.bind('r', function() {
    reset()
})

kontra.keys.bind('space', function() {
    sprites.forEach(s => {
        if (s.type == 'piece' && s.gridX !== -1) {
            s.active = true
        }
    })
})

reset()
loop.start(); 
this.loop = loop