
const SCREENSHOT_UPDATE_DELAY = 60; // send a screenshot every 60 frames
const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'
const COLOR_BLUE = '#0350a0'
const COLOR_DURATION = 150
var Foods = [
    {x:0.25, y: 0.25, color: '#3c6e6f'},
    {x:0.5, y: 0.25, color: '#007727'},
    {x:0.75, y: 0.25, color: '#b8aa01'},
    
    {x:0.25, y: 0.5, color: '#0350a0'},
    {x:0.75, y: 0.5, color: '#966401'},
    
    {x:0.25, y: 0.75, color: '#48019d'},
    {x:0.5, y: 0.75, color: '#730075'},
    {x:0.75, y: 0.75, color: '#9c0e3e'}
]
kontra.init();

var sprites = []

// Utility functions
var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}

function lerp (min, max, t) {
    return min * (1-t) + max * t
}

function damp (a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt))
}

function shuffle(array) {
  var m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

// Define the sprites
const FLOOR_COUNT = 24
const FLOOR_WIDTH = kontra.canvas.width / FLOOR_COUNT
const TANK_HEIGHT = 24
var floor = {
    type:'floor',
    ttl: Infinity,
    x:0,
    y:0,
    color: COLOR_GREEN,
    width: FLOOR_WIDTH,
    height: kontra.canvas.height,
    floorIndex: -1
}

var tank = {
    type: 'tank',
    ttl: Infinity,
    x:3 * FLOOR_WIDTH,
    y:0,
    color: COLOR_AMBER,
    width: kontra.canvas.width / FLOOR_COUNT,
    height: TANK_HEIGHT,
}

var score = kontra.sprite({
    x:0,
    y:480,
    hit:0,
    color: COLOR_GREEN,
    render: function () {
        // Make a progress bar
        this.context.fillStyle = '#333';
        this.context.fillRect(this.x, this.y, kontra.canvas.width, kontra.canvas.height - this.y)
        this.context.fillStyle = '#666';
        let percent = this.hit / 5.0;
        let percentWidth = percent * kontra.canvas.width
        this.context.fillRect(this.x, this.y, percentWidth, kontra.canvas.height - this.y)

        // Write the hunger
        this.context.fillStyle = this.color;
        this.context.font = "48px Courier New"
        this.context.textBaseline = 'top'
        this.context.fillText(this.hit + '/5', this.x, 0)
    }
})
sprites.push(score)

var missile = {
    type: 'missile',
    x: 0,
    y: 0,
    width:10,
    height:10,
    ddy: 0.5,
    ttl: 4 * 60,
    color: '#ff0000',
    update: function (dt) {
        this.advance()
            let b = kontra.sprite({
                x:this.x + this.width/2,
                y:this.y + this.height/2,
                color: '#ffffff',
                dx: (Math.random() - 0.5) * 0.25,
                dy: (Math.random() - 0.5) * 0.25,
                width:4,
                height:4,
                ttl: 1 * 60,
                update: function(dt){ // override to get desired behavior
                    this.advance()
                }
            })
            sprites.push(b)
        
        let hit = sprites.find(sprite => {
            return (sprite.type == 'tank' || sprite.type == 'floor') &&
                sprite.collidesWith(this)
        })
        if (hit) {
            let b = kontra.sprite({
                anchor: { x: 0.5, y: 0.5 },
                x:this.x + this.width/2,
                y:this.y + this.height/2,
                color: '#ff0000',
                dx: (Math.random() - 0.5) * 0.25,
                dy: (Math.random() - 0.5) * 0.25,
                width:24,
                height:24,
                ttl: 10,
                update: function(dt){ // override to get desired behavior
                    this.width--
                    this.height--
                    this.advance()
                }
            })
            sprites.push(b)

            this.ttl = 0;
            if (hit.type == 'floor') {
                hit.y += 10
            }
            if (hit.type == 'tank') {
                hit.ttl = 0
                score.hit++
                
                // Add another hard one
                let s = kontra.sprite(tank)
                s.update = function (dt) {
                    this.advance()
                    this.x = (this.x + kontra.canvas.width) % kontra.canvas.width
                }
                s.x = i * FLOOR_WIDTH
                s.dx = (Math.random() * 1 + 3) * (Math.floor(Math.random()*2) == 0 ? 1 : -1 )
                s.y = kontra.canvas.height * 0.05 + (Math.random() * kontra.canvas.height * 0.2)
                sprites.push(s)
            }
        }
        let tanksArray = sprites.filter(sprite => sprite.type == 'tank')
        let floorArray = sprites.filter(sprite => sprite.type == 'floor')
    }
}

var debugSprite = kontra.sprite({
    render: function() {
        kontra.context.save()
        this.context.fillStyle = "#ff00ff";
        this.context.font = "24px Courier New"
        this.context.textBaseline = 'top'
        // this.context.fillText("pointer: " + kontra.pointer.pressed('left'), 0, 0)

        kontra.context.restore()
    }
})
sprites.push(debugSprite)

// UI Sprites
var angleWidget = kontra.sprite({
    anchor: {
        x: 0.5,
        y: 0.5
    },
    x: 50,
    y: 540,
    width: 80,
    height: 80,
    selected: false,
    color: COLOR_AMBER,
    angle: 0,
    onDown: function() { this.selected = true },
    onUp: function() { this.selected = false },
    update: function(dt) {
        if (!kontra.pointer.pressed('left')) this.selected = false
        if (this.selected) {
            // make an angle
            let dx = kontra.pointer.x - this.x
            let dy = kontra.pointer.y - this.y

            this.angle = Math.atan2(-dx, dy) + degreesToRadians(90)
        }
    },
    render: function (dt) {
        kontra.context.save()
        kontra.context.translate(this.x, this.y)
        kontra.context.rotate(this.angle)
        kontra.context.strokeStyle = this.color
        kontra.context.beginPath()
        kontra.context.moveTo(-40,-20)
        kontra.context.lineTo(0, -20)
        kontra.context.lineTo(0, -40)
        kontra.context.lineTo(40, 0)
        kontra.context.lineTo(0, 40)
        kontra.context.lineTo(0, 20)
        kontra.context.lineTo(-40, 20)
        kontra.context.closePath()
        kontra.context.stroke()
        kontra.context.restore()
    }
})
sprites.push(angleWidget)
kontra.pointer.track(angleWidget)

let powerWidget = kontra.sprite({
    x: 120,
    y: 500,
    width:240,
    height:80,
    color: COLOR_AMBER,
    power: 1,
    maxWidth: 240,
    onDown: function() { this.selected = true },
    onUp: function() { this.selected = false },
    update: function (dt) {
        if (!kontra.pointer.pressed('left')) this.selected = false
        if (this.selected) {
            let dx = kontra.pointer.x - this.x
            this.width = Math.max(10, Math.min(dx, this.maxWidth))
            this.power = this.width / this.maxWidth
        }
    }
})
sprites.push(powerWidget)
kontra.pointer.track(powerWidget)

let shootButton = kontra.sprite({
    anchor: {
        x: 0.5,
        y: 0.5
    },
    x: kontra.canvas.width - 50,
    y: 540,
    width:80,
    height: 80,
    cooldownFrames: 0,
    color: '#ff0000',
    onDown: function() {
        if (this.cooldownFrames > 0) return;
        let player = sprites.find(sprite => sprite.type == 'player')
        // Shoot a missile
        let s = kontra.sprite(missile)
        s.x = player.x
        s.y = player.y
        s.dx = 20 * (powerWidget.power) * Math.cos(angleWidget.angle)
        s.dy = 20 * (powerWidget.power) * Math.sin(angleWidget.angle)
        sprites.push(s)
        this.cooldownFrames = 30
    },
    update: function (dt) {
        this.cooldownFrames--;
    }
})
sprites.push(shootButton)
kontra.pointer.track(shootButton)

let reset = function() {
    // Ground
    let floorHeight = kontra.canvas.height * 0.65
    for (let i = 0; i < FLOOR_COUNT; i++) {
        let s = kontra.sprite(floor)
        s.x = i * FLOOR_WIDTH
        s.floorIndex = i
        floorHeight += Math.floor(Math.random() * 15 - 10)
        floorHeight = Math.max(0, Math.min(480,floorHeight)) // clamp
        s.y = floorHeight
        sprites.unshift(s)
    }

    // Player
    var player = kontra.sprite(tank)
    player.type = 'player'
    player.color = COLOR_BLUE
    player.x = 3 * FLOOR_WIDTH
    player.y = sprites.find(sprite => sprite.floorIndex == 3).y - TANK_HEIGHT
    sprites.push(player)

    // Enemies
    // Three stationary targets
    for (let i = 0; i < 3; i++) {
        let s = kontra.sprite(tank)
        let floorI = (i+1) * 6
        s.x = floorI * FLOOR_WIDTH
        s.y = sprites.find(sprite => sprite.floorIndex == floorI).y - TANK_HEIGHT
        sprites.push(s)
    }

}

var loop = kontra.gameLoop({ // create the main game loop
    fps: 60,
    update(dt) { // update the game state
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render() { // render the game state
        sprites.forEach(sprite => sprite.render())
    }
});

reset()
loop.start(); 
this.loop = loop