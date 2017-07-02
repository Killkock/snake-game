var canvas = document.getElementById('canvas');
var canvasContext = canvas.getContext('2d');
var container = document.getElementById('container');
var startButton = document.getElementById('start');
var rules = document.querySelector('.rules');
var rulesSlider = document.querySelector('.rules-slider');
var slider = document.getElementById('slider');
var slide = document.getElementById('settings');
var shadow = document.querySelector('.shadow-start');
var pauseScreen = document.querySelector('.shadow-pause');
var complexitySelector = document.querySelector('select[name=complexity]');
var gameModeSelector = document.querySelector('select[name=game-mode]');
var bestScoreSpan = document.getElementById('best-score');

var gameComplexity = 5;
var gameMode = 0;
var bestScore;
var currentScore = 0;
var position = canvas.getBoundingClientRect();
var x = 0, y = 0, snakeSpeed = 20, snakeSize = 20;
var isGoing = false;
var isEnded = true;
var gameInterval;
var meal;
var amountOfMealTaken = 0;
var amountOfSuperFoodCreated = 0;
// var wasSuperFoodTaken = false;
var isSuperFoodOnTheCanvas = false;
var axis = 'X';
var previousDirection = 'Right';
var suggestedDirection = 'Right';
var suggestedSpeed = snakeSpeed;

var snakeBody = [{
  x: roundToTwenty(canvas.width / 2),
  y: roundToTwenty(canvas.height / 2)
}]
var walls = [];

var oppositeDirections = {
  'Left': "Right",
  'Right': 'Left',
  'Up': 'Down',
  'Down': 'Up'
};

if (!localStorage.bestScore) {
  localStorage.setItem('bestScore', '0');
}

bestScore = +localStorage.bestScore;

var gameModes = {
  // different games mode, player can choose between them.
  // creates walls on the canvas

  0: function() { return; },
  1: function() {
    canvasContext.fillStyle = 'brown';
    canvasContext.fillRect(0, 0, canvas.width, snakeSize);
    canvasContext.fillRect(0, 0, snakeSize, canvas.height);
    canvasContext.fillRect(canvas.width - snakeSize, 0, snakeSize, canvas.height);
    canvasContext.fillRect(0, canvas.height - snakeSize, canvas.width, snakeSize);

    if (walls.length !== 0) {
      return;
    }

    for (var i = 0; i < canvas.width / snakeSize; i++) {
      walls.push({
        x: i * snakeSize,
        y: 0
      });
      walls.push({
        x: i * snakeSize,
        y: canvas.width - snakeSize
      });
      walls.push({
        x: 0,
        y: i * snakeSize
      });
      walls.push({
        x: canvas.height - snakeSize,
        y: i * snakeSize
      });
    }
  },
  2: function() {
    gameModes[1]();
    canvasContext.fillRect(roundToTwenty(canvas.width / 4),
                           roundToTwenty(canvas.height / 4),
                           canvas.width / 2, snakeSize);
    canvasContext.fillRect(roundToTwenty(canvas.width / 4),
                           roundToTwenty(canvas.height / 4 * 3),
                           canvas.width / 2, snakeSize);

    if (walls.length === 120) {
      for (var i = roundToTwenty(canvas.width / 4) / snakeSize;
           i < roundToTwenty(canvas.width / 4 * 3) / snakeSize;
           i++) {
        walls.push({
          x: i * snakeSize,
          y: roundToTwenty(canvas.height / 4)
        });
        walls.push({
          x: i * snakeSize,
          y: roundToTwenty(canvas.height / 4 * 3)
        })
      }
    }
  },
  3: function() {
    canvasContext.fillStyle = 'brown';
    canvasContext.fillRect(0, roundToTwenty(canvas.height / 2) - snakeSize, canvas.width, snakeSize)

    if (walls.length === 0) {
      for (var i = 0; i < canvas.width / snakeSize; i++) {
        walls.push({
          x: i * snakeSize,
          y: canvas.height / 2 - snakeSize
        })
      }
    }
  },
  4: function() {
    gameModes[3]();

    canvasContext.fillRect(roundToTwenty(canvas.width / 2) - snakeSize + 20, 0, snakeSize, canvas.height);

    if (walls.length === 30) {
      for (var i = 0; i < canvas.height / snakeSize; i++) {
        walls.push({
          x: canvas.width / 2 - snakeSize + 20,
          y: i * snakeSize
        })
      }
    }
  }
}

window.onload = function() {
  gameInterval;
  normalizeDivs();
  createMeal();
  bestScoreSpan.textContent = bestScore;
}

document.onkeydown = function(e) {
  handleArrowKeys(e);
  handleSpaceKey(e);
  handleRestartKey(e);
}

startButton.addEventListener('click', startGame)

slider.addEventListener('click', function() {

  this.classList.toggle('rotate-arrow')
  if (slide.classList.contains('slideright')) {
    slide.classList.remove('slideright');
    slide.classList.add('slideleft');
    slider.style.left = canvas.offsetWidth + 'px';
  } else {
    slide.classList.remove('slideleft');
    slide.classList.add('slideright');
    slider.style.left = canvas.offsetWidth - slider.offsetWidth + 'px';
  }
});

rulesSlider.addEventListener('click', function() {
  if (rules.classList.contains('slideright')) {
    rules.classList.remove('slideright');
    rules.classList.add('slideleft');
    this.style.left = 0 + 'px';
  } else {
    rules.classList.remove('slideleft');
    rules.classList.add('slideright');
    this.style.left = 0 - slider.offsetWidth + 'px';
  }
});

complexitySelector.addEventListener('change', function(e) {
  gameComplexity = +this.value;
})

gameModeSelector.addEventListener('change', function(e) {
  gameMode = +this.value;
  walls = [];
})

function game() {
  checkingForBackwardMotion();
  checkingForMealCollision();
  moveAll();
  drawAll();
  checkingForSelfCollision();
  checkingForWallCollision();
  checkingForBorderCrossing();

}

function drawAll() {
  // func draws on canvas all of snake's body and walls with meal
  canvasContext.fillStyle = '#db6804';
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);

  gameModes[gameMode]();

  drawFood();
  drawScore();
  drawSnakesHead();
  drawSnakesBody();

  function drawScore() {
    canvasContext.font = 'bold 40px sans-serif'
    canvasContext.fillStyle = 'rgba(0, 0, 0, 0.2)';
    canvasContext.fillText(currentScore, 20, 50);
    canvasContext.fillText('press R to restart', 100, 550)
  }

  function drawFood() {
    if (isSuperFoodOnTheCanvas) {
      canvasContext.fillStyle = 'green';
    } else {
      canvasContext.fillStyle = '#04ed52';
    }

    canvasContext.fillRect(meal.x, meal.y, snakeSize, snakeSize);
  }

  function drawSnakesHead() {
    canvasContext.fillStyle = 'blue';
    canvasContext.fillRect(snakeBody[0].x, snakeBody[0].y, snakeSize, snakeSize)
  }

  function drawSnakesBody() {
    for (let i = 1; i < snakeBody.length; i++) {
      canvasContext.fillStyle = 'rgba(200,200,200,1)';
      canvasContext.fillRect(snakeBody[i].x, snakeBody[i].y, snakeSize, snakeSize)
      canvasContext.strokeRect(snakeBody[i].x, snakeBody[i].y, snakeSize, snakeSize)
    }
  }
}

function moveAll() {
  x = snakeBody[0].x;
  y = snakeBody[0].y;

  for (let i = snakeBody.length - 1; i > 0; i--) {
    snakeBody[i].x = snakeBody[i - 1].x;
    snakeBody[i].y = snakeBody[i - 1].y;
  }

  if (axis === 'X') {
    snakeBody[0].x += snakeSpeed;
  } else {
    snakeBody[0].y += snakeSpeed;
  }

}

function createMeal() {
  var yCoefficient = canvas.height / snakeSize;
  var xCoefficient = canvas.width / snakeSize;
  var x = Math.floor(Math.random() * xCoefficient) * snakeSize;
  var y = Math.floor(Math.random() * yCoefficient) * snakeSize;

  for (let i = 0; i < walls.length; i++) {
    if (x === walls[i].x && y === walls[i].y) {
      // if coords of meal correspond with coords of one of walls, recreate meal
      return createMeal();
    }
  }

  for (let i = 0; i < snakeBody.length; i++) {
    if (x === snakeBody[i].x && y === snakeBody[i].y) {
      return createMeal();
    }
  }

  if (amountOfMealTaken % 4 === 0 && !(amountOfMealTaken / 4 === amountOfSuperFoodCreated)) {
    amountOfSuperFoodCreated++;
    isSuperFoodOnTheCanvas = true;

    setTimeout(() => {
      if (isSuperFoodOnTheCanvas) {
        isSuperFoodOnTheCanvas = false;
        wasSuperFoodTaken = false;
        createMeal();
      }
    }, 18000 / gameComplexity);
  }

  meal = {
    x,
    y
  };
}

function checkingForBackwardMotion() {
  if (suggestedDirection !== oppositeDirections[previousDirection]) {
    // if player didn't use opposite directions, like when snake is moving left and player presses right arrow
    snakeSpeed = suggestedSpeed;
    previousDirection = suggestedDirection;
  }
}

function checkingForMealCollision() {
  // if snake's head's coords correspond with meal's coords
  // func creates new meal and lengthens the snake
  var x = snakeBody[0].x;
  var y = snakeBody[0].y;

  if (x === meal.x && y === meal.y) {
    currentScore += gameComplexity;
    snakeBody.push({
      x: snakeBody.slice(-1)[0].x,
      y: snakeBody.slice(-1)[0].y
    });

    if (isSuperFoodOnTheCanvas) {
      isSuperFoodOnTheCanvas = false;
      currentScore += 3 * gameComplexity;
    } else {
      amountOfMealTaken++;
    }

    createMeal();

  }
}

function checkingForBorderCrossing() {
  // if snake cross the border, func makes the snake to
  // appear on opposite site of the canvas

  for (let i = 0; i < snakeBody.length; i++) {
    if (snakeBody[i].x >= canvas.width) {
      snakeBody[i].x -= (canvas.width + snakeSize);
    } else if (snakeBody[i].x < 0) {
      snakeBody[i].x += canvas.width;
    }

    if (snakeBody[i].y >= canvas.height) {
      snakeBody[i].y -= (canvas.height + snakeSize);
    } else if (snakeBody[i].y < 0) {
      snakeBody[i].y += canvas.height;
    }
  }
}

function checkingForWallCollision() {
  var x = snakeBody[0].x;
  var y = snakeBody[0].y;

  for (let i = 0; i < walls.length; i++) {
    if (x === walls[i].x && y === walls[i].y) {
      endHandler();
    }
  }

}

function checkingForSelfCollision() {
  var x = snakeBody[0].x;
  var y = snakeBody[0].y;

  for (var i = 1; i < snakeBody.length; i++) {
    if (x === snakeBody[i].x && y === snakeBody[i].y) {
      console.log('self collision detected');
      endHandler();
    }
  }
}

function handleArrowKeys(e) {
  if (!isGoing || !e.code.startsWith('Arrow')) {
    return;
  }

  var dir = e.code.slice(5);

  if (dir === 'Up') {
    suggestedSpeed = -Math.abs(snakeSpeed)
    axis = 'Y';
  }
  if (dir === 'Down') {
    suggestedSpeed = Math.abs(snakeSpeed)
    axis = 'Y';
  }
  if (dir === 'Left') {
    suggestedSpeed = -Math.abs(snakeSpeed)
    axis = 'X';
  }
  if (dir === 'Right') {
    suggestedSpeed = Math.abs(snakeSpeed)
    axis = 'X';
  }
  suggestedDirection = dir;

}

function handleSpaceKey(e) {
  if (e.code === 'Space' && !isEnded) {
    console.log(suggestedDirection, previousDirection);
    if (isGoing) {
      isGoing = false;
      clearInterval(gameInterval);
      showHideShadow(pauseScreen);
    } else {
      showHideShadow(pauseScreen);
      isGoing = true;
      gameInterval = setInterval(game, 1000 / (4 * gameComplexity));
    }
  }
}

function handleRestartKey(e) {
  console.log(e);
  if (e.key === 'r') {
    endHandler();
  }
}

function roundToTwenty(num) {
  return Math.round(num / 20) * 20;
}

function showHideShadow(shadow) {
  clearInterval(gameInterval);
  isGoing = false;

  if (shadow.classList.contains('hidden')) {
    shadow.classList.remove('hidden');
    shadow.style.opacity = 1;

  } else {
    shadow.style.opacity = 0;
    setTimeout(() => shadow.classList.add('hidden'), 600)
  }
}

function endHandler() {
  clearInterval(gameInterval);
  isGoing = false;
  isEnded = true;

  if (currentScore > bestScore) {
    bestScore = currentScore;
    localStorage.setItem('bestScore', bestScore);
  }

  currentScore = 0;
  bestScoreSpan.textContent = bestScore;
  showHideShadow(shadow);
  clearGame()
}

function normalizeDivs() {
  shadow.style.width = pauseScreen.style.width = canvas.offsetWidth + 'px';
  shadow.style.height = pauseScreen.style.height = canvas.offsetHeight + 'px';
  pauseScreen.classList.add('hidden');
  container.style.width = canvas.offsetWidth + 'px';
  startButton.style.left = canvas.offsetWidth / 2 - startButton.offsetWidth / 2 + 'px';
  startButton.style.top = canvas.offsetHeight / 3 * 2 + 'px';
  slide.style.left = canvas.offsetWidth + 'px';
  slide.style.height = canvas.offsetHeight + 'px';
  console.log(slide.style)
  console.log('sdsdssd')
}



function clearGame() {
  amountOfMealTaken = 0;
  amountOfSuperFoodCreated = 0;
  isSuperFoodOnTheCanvas = false;
  axis = 'X';
  previousDirection = 'Right';
  suggestedDirection = 'Right';
  snakeSpeed = Math.abs(snakeSpeed);
  suggestedSpeed = snakeSpeed;

  snakeBody = [{
    x: roundToTwenty(canvas.width / 2),
    y: roundToTwenty(canvas.height / 2)
  }]
}

function startGame() {
  showHideShadow(shadow);
  isGoing = true;
  isEnded = false;

  setTimeout(() => {
    gameInterval = setInterval(game, 1000 / (4 * gameComplexity));
  }, 700);

  slide.classList.remove('slideright');
  slide.classList.add('slideleft');
  slider.style.left = canvas.offsetWidth + 'px';
  slider.classList.remove('rotate-arrow');
}
