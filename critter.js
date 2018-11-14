
const SCREENSHOT_UPDATE_DELAY = 60; // send a screenshot every 60 frames
const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'
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

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

var score = kontra.sprite({
    x:0,
    y:480,
    hunger:0,
    color: COLOR_AMBER,
    render: function () {
        // Make a progress bar
        this.context.fillStyle = '#333';
        this.context.fillRect(this.x, this.y, kontra.canvas.width, kontra.canvas.height - this.y)
        this.context.fillStyle = '#666';
        let percent = this.hunger / 40.0;
        let percentWidth = percent * kontra.canvas.width
        this.context.fillRect(this.x, this.y, percentWidth, kontra.canvas.height - this.y)

        // Write the hunger
        this.context.fillStyle = this.color;
        this.context.font = "48px Courier New"
        this.context.textBaseline = 'top'
        this.context.fillText(this.hunger + '/40', this.x, this.y)
    }
})
sprites.unshift(score)

var critter = {
    anchor: {
        x: 0.5,
        y: 0.5
    },
    x: kontra.canvas.width * 0.5, // remove - 48 when anchor works with pointers
    y: kontra.canvas.width * 0.5, // Width bc we don't want to count the bar at the bottom
    width:96,
    height:96,
    color: COLOR_GREEN,
    selected: false,
    colorFrames: 0,
    sick: false,
    desiredRotation: 0,
    collidesWith(object) {
      // We're ok with the collision being a rough estimate, ignore rotation
      // if (this.rotation || object.rotation) return null;

      // take into account sprite anchors
      let x = this.x - this.width * this.anchor.x;
      let y = this.y - this.height * this.anchor.y;

      let objX = object.x;
      let objY = object.y;
      if (object.anchor) {
        objX -= object.width * object.anchor.x;
        objY -= object.height * object.anchor.y;
      }

      return x < objX + object.width &&
             x + this.width > objX &&
             y < objY + object.height &&
             y + this.height > objY;
    },
    update: function (dt) {
        if (!this.colorFrames || this.colorFrames<=0){
            this.newColor()
            this.sick = false
        }
        this.colorFrames--
        if (this.colorFrames < 15) {
            this.desiredRotation = degreesToRadians(-45)
        }
        this.advance()
        this.rotation = damp(this.rotation, this.desiredRotation, 8, dt)
        
        if (this.sick && this.colorFrames > 25) {
            if (Math.floor(Math.random()*4) == 0) { // One in 4 chance
                let b = kontra.sprite({
                    x:this.x,
                    y:this.y + this.height*0.25,
                    color: '#ffffff',
                    dx: Math.random()*9-2,
                    dy:1,
                    ddy: 1.0,
                    width:12,
                    height:12,
                    ttl: 4 * 60,
                    update: function(dt){ // override to get desired behavior
                        this.advance()
                    }
                })
                sprites.push(b)
                // b.x = this.x
                // b.y = this.y
                // b.radius = b.width = 8
                // b.dx = {'up':0, 'down':0, 'left':5, 'right':-5}[this.direction]
                // b.dy = {'up':5, 'down':-5, 'left':0, 'right':0}[this.direction]
                // sprites.push(b)
            }
        }
    },
    feed: function (color) {
        if (this.sickFrames>0) return
        if (this.color !== color) { // Fail
            this.sick = true
            this.color = "#ff00ff"
            this.colorFrames = 4 * 60

        } else { // Success
            score.hunger++
            this.colorFrames = 0

            // Throw some particles
            for (let i = 0; i < 18; i++) {
                let particle = kontra.sprite({
                    type:'particle',
                    x: this.x,
                    y: this.y,
                    dx: 24 * Math.cos(degreesToRadians(i*20)),
                    dy: 24 * Math.sin(degreesToRadians(i*20)), 
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
            // Shuffle the foods
            shuffle(Foods)
            let foodIndex = 0;
            sprites.forEach(sprite => {
                if (sprite.type == 'food') {
                    sprite.desiredX = Foods[foodIndex].x * kontra.canvas.width
                    sprite.desiredY = Foods[foodIndex].y * kontra.canvas.width
                    sprite.dx = Math.floor(Math.random() * 2) == 0 ? -1 : 1
                    sprite.dy = Math.floor(Math.random() * 2) == 0 ? -1 : 1
                    foodIndex++
                }
            })
        }
    },
    newColor: function (dt) {
        this.color = Foods[Math.floor(Math.random()*Foods.length)].color
        this.colorFrames = COLOR_DURATION
        this.rotation -= degreesToRadians(180)
        this.desiredRotation = 0
    }
}

let food = {
    type: 'food',
    anchor: {
        x: 0.5,
        y: 0.5
    },
    x: kontra.canvas.width/2, // remove - 48 when anchor works with pointers
    y: kontra.canvas.width/2, // Width bc we don't want to count the bar at the bottom
    desiredX: 240,
    desiredY: 480,
    width:48,
    height:48,
    color: COLOR_GREEN,
    selected: false,
    onDown: function() {
        this.selected = true;
        this.lastPosition = {
            x: kontra.pointer.x,
            y: kontra.pointer.y
        }
    },
    onUp: function() {
        this.selected = false;
        if (this.critter) {
            if (this.critter.collidesWith(this)) {
                this.critter.feed(this.color)
            }
        }
    },
    update: function(dt) {
        if (!kontra.pointer.pressed('left')) this.selected = false
        if (!this.selected) {
            // damp it back to desiredX
            this.desiredX += this.dx
            this.desiredY += this.dy
            if (this.desiredX < 0) this.dx = Math.abs(this.dx)
            if (this.desiredX > kontra.canvas.width) this.dx = -1 * Math.abs(this.dx)
            if (this.desiredY < 0) this.dy = Math.abs(this.dx)
            if (this.desiredY > kontra.canvas.width) this.dy = -1 * Math.abs(this.dy)
            
            this.x = damp(this.x, this.desiredX, 8, dt)
            this.y = damp(this.y, this.desiredY, 8, dt)
            this.advance()
        } else {
            let dx = kontra.pointer.x - this.lastPosition.x
            let dy = kontra.pointer.y - this.lastPosition.y

            this.x += dx
            this.y += dy

            // // Flinging
            // this.dx = dx
            // this.dy = dy

            this.lastPosition = {
                x: kontra.pointer.x,
                y: kontra.pointer.y
            }

            // Collision

        }
    },
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

let reset = function() {
    // Place the critter in the middle
    let critterSprite = kontra.sprite(critter)
    sprites.push(critterSprite)
    kontra.pointer.track(critterSprite)
    // Position foods
    for (let i = 0; i < Foods.length; i++) {
        let s = kontra.sprite(food)
        s.critter = critterSprite
        s.color = Foods[i].color
        s.x = s.desiredX = Foods[i].x * kontra.canvas.width // remove - 24 when anchor works
        s.y = s.desiredY = Foods[i].y * kontra.canvas.width // Squared screen
        kontra.pointer.track(s)
        sprites.push(s)
    }
}

var loop = kontra.gameLoop({  // create the main game loop
    fps: 60,
  update(dt) {        // update the game state
    sprites.forEach(sprite => {
      sprite.update(dt)
    })
    sprites = sprites.filter(sprite => sprite.isAlive());
  },
  render() {        // render the game state
    sprites.forEach(sprite => {
      sprite.render();
    })
  }
});

reset()
loop.start(); 
this.loop = loop