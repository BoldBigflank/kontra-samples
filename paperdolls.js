const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'
var Background = {
    src: 'https://via.placeholder.com/480/480/ffffff/000000/?text=background'
}
var Items = [
    { src: 'https://via.placeholder.com/64/3c6e6f/000000/?text=A', color: '#3c6e6f'},
    { src: 'https://via.placeholder.com/64/007727/000000/?text=B', color: '#007727'},
    { src: 'https://via.placeholder.com/64/b8aa01/000000/?text=C', color: '#b8aa01'},
    { src: 'https://via.placeholder.com/64/0350a0/000000/?text=D', color: '#0350a0'},
    { src: 'https://via.placeholder.com/64/966401/000000/?text=E', color: '#966401'},
    { src: 'https://via.placeholder.com/64/48019d/000000/?text=F', color: '#48019d'},
    { src: 'https://via.placeholder.com/64/730075/000000/?text=G', color: '#730075'},
    { src: 'https://via.placeholder.com/64/9c0e3e/000000/?text=H', color: '#9c0e3e'}
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

var background = {
    x:0,
    y:0,
    width:480,
    height:480,
    update: function() {
        if (!this.image) {
            this.image = new Image()
            this.image.src = Background.src;
        }
    }
}

let article = {
    x: 0,
    y: 0,
    width: 64,
    height: 64,
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
        // Stick it to the background?
        if (this.lastPosition.y < 480) {
            this.desiredX = this.x;
            this.desiredY = this.y;
            this.stuck = true;
        }
    },
    update: function(dt) {
        // One time setup
        if (!this.image && this.article) {
            this.image = new Image()
            this.image.src = this.article.src;
            this.color = this.article.color;
        }
        // Pointer behavior
        if (!kontra.pointer.pressed('left')) {
            this.selected = false
            this.lastPosition = null;
        }
        if (this.selected) {
            let dx = kontra.pointer.x - this.lastPosition.x
            let dy = kontra.pointer.y - this.lastPosition.y

            this.x += dx
            this.y += dy
        } else {
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
        }
        // Move as a slider
        if (!this.stuck && kontra.pointer.pressed('left') && kontra.pointer.y > 480) {
            if (this.lastPosition) this.desiredX -= this.lastPosition.x - kontra.pointer.x;
        }

        // Save for next frame
        if (kontra.pointer.pressed('left')) {
            this.lastPosition = {
                x: kontra.pointer.x,
                y: kontra.pointer.y
            }
        }
    }
}

kontra.keys.bind('r', function() {
    reset()
})

let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    let backgroundSprite = kontra.sprite(background);
    sprites.push(backgroundSprite);
    
    // Position items
    for (let i = 0; i < Items.length; i++) {
        let s = kontra.sprite(article)
        s.desiredX = s.x = 68 * i;
        s.desiredY = s.y = 480+32;
        s.article = Items[i]
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