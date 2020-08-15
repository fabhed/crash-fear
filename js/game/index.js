class Game extends PIXI.Application {
	players = []
	pointsToWin = 10
	paused = false
	roundActive = false
	gameStarted = false
	elapsedTime = 0
	borderWidth = 5
	countdown = 0
	portalBorders = false
	portalBorderAnimFactor = 0
	debugMode = true
	titleStyle = new PIXI.TextStyle({
		fontSize: 100,
		fontWeight: "bold",
		fill: "white"
	})
	gameContainer = document.getElementById('gameContainer')
	startScreen = {
		activePlayer: null,
		pressKeyNode: 'Press desired key',
		playerList: document.getElementById('playerList'),
		startButton: document.getElementById('startButton'),
		selectPointsContainer: document.getElementById('selectPointsContainer'),
		container: document.getElementById('startScreen')
	}
	scoreboard = {
		container: document.getElementById('scoreboard'),
		subtitle: document.querySelector('#scoreboard p'),
		list: document.getElementById('scoreboardList'),
		againButton : document.getElementById('againButton')
	}
	get isRunning() {
		return this.roundActive && !this.paused
	}
	get alivePlayers() {
		return this.players.filter(p => p.alive)
	}
	get height () {
		return this.renderer.view.height
	}
	get width () {
		return this.renderer.view.width
	}
	get innerHeight() {
		return this.height - this.borderWidth * 2
	}
	get innerWidth() {
		return this.width - this.borderWidth * 2
	}
	/**
		Players to create from a list of predefined players like Fred, Bluebell, etc..
	*/
	get playersToCreate() {
		return players.filter(p => p.controls && p.controls.left && p.controls.right)
	}
	/**
	 * Players that we want to spawn in the begining of a round.
	 * Gets filtered in a tiebrake
	 */
	get activePlayers() {
		return this.players.filter(p => p.active)
	}
	constructor() {
		super({
			width: 800,
			height: 600,
			backgroundColor: 0,
			resolution: 1,
			// resolution: window.devicePixelRatio || 1,
			antialias: true,
		})
		document.body.appendChild(this.view);

		// Maximize
		this.renderer.view.style.position = "absolute";
		this.renderer.view.style.display = "block";
		this.renderer.autoDensity = true;
		window.addEventListener('resize', () => {
			this.renderer.resize(window.innerWidth, window.innerHeight);
			console.log(window.innerWidth)
		})
		this.renderer.resize(window.innerWidth, window.innerHeight);
		console.log(window.innerWidth)
		this.lineContainer = new PIXI.Container()
		this.stage.addChild(this.lineContainer)
		
		this.playerContainer = new PIXI.Container()
		this.stage.addChild(this.playerContainer)
		
		this.tails = []
		this.clearTails()

		// Create borders graphics (get's drawn in loop)
		this.borders = new PIXI.Graphics()
		this.stage.addChild(this.borders)
		this.drawBorders()

		// Powerup container
		this.powerUps = new PIXI.Container()
		this.stage.addChild(this.powerUps)
		this.powerUpSpawnCooldown = 0

		this.createPauseIndicator()
		this.createMessageContainer()
		this.createStartScreen()
		
		// Action key functionality
		this.actionKey = keyboard(" ") // space
		this.actionKey.press = () => {
			if (this.roundActive) {
				this.paused = !this.paused
				this.pauseIndicator.visible = this.paused
			} else if (this.gameStarted && !this.winner){
				this.newRound()
			} else if (this.winner) {
				this.resetGame()
			} else if (this.playersToCreate.length > 0) {
				this.startGame()
			}
		}

		this.hitBoxesDebug = new PIXI.Graphics()
		this.stage.addChild(this.hitBoxesDebug)

		this.testContainer = new PIXI.Container()
		this.testContainer.zIndex = 10000
		this.stage.addChild(this.testContainer)

		this.debugKey = keyboard("§")
		this.debugKey.press = this.toggleDebugMode.bind(this)
		this.toggleDebugMode()

		// Start game loop
		this.ticker.add(this.loop.bind(this))

	}
	toggleDebugMode() {
		this.debugMode = !this.debugMode
		this.drawHitBoxes()

		this.lineContainer.alpha = this.debugMode ? 0.5 : 1
	}
	drawHitBoxes(oldEnoughTime) {
		this.hitBoxesDebug.clear()
		if (!this.debugMode) return
		
		for (let x = 0; x < this.tails.length; x++) {
			for (let y = 0; y < this.tails[x].length; y++) {
				if (this.tails[x][y] !== undefined) {
					if (oldEnoughTime && this.elapsedTime - this.tails[x][y] < oldEnoughTime) this.hitBoxesDebug.beginFill(0x0000FF)
					else this.hitBoxesDebug.beginFill(0x00FF00)
					this.hitBoxesDebug.drawRect(x, y, 1, 1)
				}
			}
		}
		this.hitBoxesDebug.endFill()
	}
	setControlListener(event) {
		let aP = this.startScreen.activePlayer
		if (aP) {
			if (!aP.controls.left) {
				// Setting first key (left)
				aP.controls.left = event.key
				aP.elements.selectLeft.innerText = event.key
				aP.elements.selectRight.innerText = this.startScreen.pressKeyNode
			} else if (!aP.controls.right) {
				// Setting second key (right)
				aP.controls.right = event.key
				// No longer needs to be active
				aP.elements.selectRight.innerText = event.key
				this.startScreen.startButton.disabled = this.playersToCreate.length === 0
				this.startScreen.activePlayer = null

			}
		}
	}
	createStartScreen() {
		this.startScreen.startButton.addEventListener("click", () => {
			if (this.playersToCreate.length > 0) {
				this.startGame()
			}
		});
		this.boundedEventListener = this.setControlListener.bind(this)
		document.addEventListener('keydown', this.boundedEventListener)

		// Add player selection
		players.forEach(p => {
			if (!p.controls) p.controls = {}
			let row = document.createElement('tr')
			p.elements = {
				row
			}
			row.className = 'player-row'
			row.style.color = hexToColor(p.color)
			let name = document.createElement('td')
			name.textContent = p.name
			let selectLeft = document.createElement('td')
			let selectRight = document.createElement('td')
			p.elements.selectLeft = selectLeft
			p.elements.selectRight = selectRight
			row.append(name)
			row.append(selectLeft)
			row.append(selectRight)
			row.style.opacity = 0.5;
			row.addEventListener('click', () => {
				if (!p.controls.left && !p.controls.right) {
					// If no controls are set, start setting them
					this.startScreen.activePlayer = p
					p.elements.row.style.opacity = 1;

					p.controls = {}
					p.elements.selectLeft.innerText = this.startScreen.pressKeyNode
					p.elements.selectRight.innerText = null
				} else if (p.controls.left && p.controls.right) {
					// If both controls are set, remove them if clicked
					this.startScreen.activePlayer = null
					p.elements.row.style.opacity = .5;
					p.controls = {}
					p.elements.selectLeft.innerText = null
					p.elements.selectRight.innerText = null
					this.startScreen.startButton.disabled = this.playersToCreate.length === 0
				}
				
			})
			this.startScreen.playerList.append(row)
		})

		// Points selection
		let pointsArray = [5, 10, 15, 20, 30, 40, 50, 60]
		pointsArray.forEach(points => {
			let e = document.createElement('button')
			e.innerText = points
			e.className = points === this.pointsToWin ? 'btn active sm' : 'btn sm'
			e.addEventListener('click', () => {
				this.pointsToWin = points
				for (let index = 0; index < this.startScreen.selectPointsContainer.children.length; index++) {
					const child = this.startScreen.selectPointsContainer.children[index];
					child.className = points == child.innerText ? 'btn active sm' : 'btn sm'
				}
			})
			this.startScreen.selectPointsContainer.appendChild(e)

		})

	}
	createMessageContainer() {
		this.message = new PIXI.Container()
		this.message.addChild(new PIXI.Text(null, this.titleStyle))
		this.stage.addChild(this.message)

	}
	showMessage(message, color = 'white') {
		let textObject = this.message.getChildAt(0)
		textObject.text = message
		textObject.style.fill = color
		this.message.x = this.renderer.view.width / 2 - this.message.width / 2
		this.message.y = this.renderer.view.height / 2 - this.message.height
		this.message.visible = true
	}
	hideMessage() {
		this.message.visible = false
	}
	createPauseIndicator() {
		// Pause Indicator
		let text = "II Paused"
		this.pauseIndicator = new PIXI.Text(text, this.titleStyle);
		this.stage.addChild(this.pauseIndicator);
		const offset = 40
		this.pauseIndicator.x = offset;
		this.pauseIndicator.y = offset / 2;
		this.pauseIndicator.visible = false;
	}
	drawBorders() {
		this.borders.clear()
		this.borders.beginFill(0xf1e05a)
		this.borders.drawRect(0, 0, this.width, this.height)
		this.borders.endFill()
		this.borders.beginHole()
		this.borders.drawRect(
			this.borderWidth,
			this.borderWidth,
			this.innerWidth,
			this.innerHeight
		)
		this.borders.endHole()

		if (this.portalBorders && this.isRunning) {
			const { alpha, factor} = animateAlpha(this.borders.alpha, this.portalBorderAnimFactor)
			this.borders.alpha = alpha
			this.portalBorderAnimFactor = factor
		}
	}
	startGame() {
		this.clearTails()
		deleteObjects(this.playerContainer.children)
		this.createPlayers()
		this.newRound()
		this.startScreen.container.style.display = "none"
		this.gameStarted = true
	}
	async newRound() {
		if (this.countdown !== 0) return // Disable starting a new round when countdown is active
		this.scoreboard.container.style.display = 'none' // Hide scoreboard

		this.powerUpSpawnCooldown = 0 // Spawn a powerup directly on round start
		this.portalBorders = 0
		clearInterval(this.portalBordersTimer) // clear portal border timer if it exists
		// Reset all players
		this.activePlayers.forEach(p => {
			p.alive = true
			p.effects = []
			p.randomizePosition(this.renderer.view.width, this.renderer.view.height)
			p.drawHead({ indicator: true })
		})
		
		// Remove entities
		this.clearTails()
		this.clearPowerUps()

		// Start the countdown for the next round
		await this.startCountdown(3, 400)
		this.roundActive = true
		this.activePlayers.forEach(p => p.drawHead())
	}
	clearTails() {
		for (let x = 0; x < this.width; x++) {
			this.tails[x] = []
		}
		this.players.forEach(p => p.clearTail())
	}
	clearPowerUps() {
		deleteObjects(this.powerUps.children)
	}
	createPlayers() {
		document.removeEventListener('keydown', this.boundedEventListener)

		// Create players
		let activatedNames = this.playersToCreate.map(aP => aP.name)
		this.players = players
			.filter(p => activatedNames.includes(p.name))
			.map(p => {
				return new Player(p, this.lineContainer)
			})
		
		// Empty Scoreboard
		for (let index = this.scoreboard.list.children.length - 1; index >= 0; index--) {
			const tr = this.scoreboard.list.children[index];
			tr.remove()
			
		}
		this.players.forEach(p => {
			// Add the players to the stage
			this.playerContainer.addChild(p)

			// Add the players to the scoreboard
			let tr = document.createElement('tr')
			tr.style.color = hexToColor(p.color)

			tr.setAttribute('data-name', p.name)
			let tdName = document.createElement('td')
			tdName.innerText = p.name
			tr.append(tdName)
			let tdPoints = document.createElement('td')
			tdPoints.innerText = p.points
			tr.append(tdPoints)
			this.scoreboard.list.append(tr)
		})
		this.scoreboard.subtitle.innerText = `First to ${this.pointsToWin} points wins!`
		this.scoreboard.againButton.addEventListener('click', () => {
			if (this.winner) {
				this.resetGame()
			} else {
				this.newRound()
			}
		})

	}
	createPowerUp() {
		if (this.powerUpSpawnCooldown > 0) return
		this.powerUpSpawnCooldown = getRandomNumberBetween(5, 5)
		const index = Math.round(Math.random() * (powerUpDefinitions.length - 1))
		const {name} = powerUpDefinitions[index]
		const powerUp = new PowerUp(name)
		powerUp.randomizePosition(this.renderer.view.width, this.renderer.view.height)
		this.powerUps.addChild(powerUp)
	}
	async startCountdown(startingNumber, msPerNumber = 1000) {
		return new Promise((res, rej) => {
			this.countdown = startingNumber
			const countSecond = () => {
				this.showMessage(this.countdown)
				setTimeout(() => {
					this.countdown--
					if (this.countdown === 0) {
						res()
						this.hideMessage()
					} else {
						countSecond()
					}
				}, msPerNumber)
			}
			countSecond()

		})
	}
	loop(lag) {
		// lag is a factor showing if the game is going slower or faster than expected - lag = 1 means there is no lag (60 fps)
		this.drawBorders()
		if (!this.isRunning) return
		const deltaTime = lag / 60 // seconds
		this.elapsedTime += deltaTime
		// Handle players
		this.activePlayers.forEach(p => {
			// Update players
			if (!p.alive) return
			p.update(deltaTime, this.elapsedTime, this.tails, this.renderer)

			// Check for borders
			let canTp = this.portalBorders || p.canTeleportThroughBorders // Global or on player
			let offset = this.borderWidth + p.radius
			if (p.x - p.width / 2 < this.borderWidth) { // left
				if (canTp) {
					p.x = this.width - offset
					p.makeNewLineSegment()
				} else {
					this.killPlayer(p)
				}
			} else if (p.x + p.width / 2 > this.width - this.borderWidth) { // right
				if (canTp) {
					p.x = + offset
					p.makeNewLineSegment()
				} else {
					this.killPlayer(p)
				}
			} else if (p.y - p.height / 2 < this.borderWidth) { // up
				if (canTp) {
					p.y = this.height - offset
					p.makeNewLineSegment()
				} else {
					this.killPlayer(p)
				}
			} else if (p.y + p.height / 2 > this.height - this.borderWidth) { // down
				if (canTp) {
					p.y = offset
					p.makeNewLineSegment()
				} else {
					this.killPlayer(p)
				}
			}

			// Check for collision with tails
			let oldEnoughTime = (.8 / p.velocity * lag) // Calculate this first
			for (let x = p.hitBox.minX; x <= p.hitBox.maxX; x++) {
				let row = this.tails[Math.round(x)]
				if (row === undefined) continue; // (happens when we are at the edge)
				for (let y = p.hitBox.minY; y <= p.hitBox.maxY; y++) {
					let point = row[Math.round(y)]
					if (point === undefined) continue; // (happens when we are at the edge)
					if (point[1] !== p.name) { // If not the same player we don't need to check any timing
						this.killPlayer(p)
					} else if (this.elapsedTime - point[0] > oldEnoughTime) {
						// Same player that spawned the hitboxes, so we need to wait a bit to make sure we don't collide when spawning the hitboxes
						this.killPlayer(p)
						break;
					}
				}
			}

			if (this.debugMode) {
				this.drawHitBoxes(oldEnoughTime)
			}

			// Handle powerup aquisition
			this.powerUps.children.forEach((powerUp, i) => {
				let collides = p.collidesWith(powerUp)
				if (collides) {
					this.powerUps.removeChildAt(i)
					if (powerUp.actsOn === 'enemies') {
						this.players
							.filter(p2 => p2.name !== p.name) // All but colliding player
							.forEach(p2 => p2.addEffect(Object.assign({}, powerUp.playerEffect)))
					} else if (powerUp.actsOn === 'self') {
						p.addEffect(powerUp.playerEffect)
					} else if (powerUp.actsOn === 'global') {
						switch (powerUp.name) {
							case 'clear':
								this.clearTails()
								break;
							case 'portalBorders':
								this.portalBorders = true
								this.portalBordersTimer = setTimeout(() => {
									this.portalBorders = false
									this.borders.alpha = 1 // make sure border is totally visible after animation
								}, powerUp.duration * 1000) // sconds to milliseconds
								break;
						}
					}
				}
				// powerUp
			})
		})
		// Handle powerups
		this.powerUpSpawnCooldown -= deltaTime
		this.createPowerUp()
	}
	killPlayer(player) {
		if (!player.alive) return
		let died = player.die()
		if (died) {
			this.alivePlayers.forEach(p => {
				p.points++
			})
		}
		if (this.players.length > 1) {
			if (this.players.filter(p => p.alive).length <= 1) {
				this.endRound()
			}
		} else {
			if (!this.players.some(p => p.alive)) {
				this.endRound()
			}
		}
	}
	endRound() {
		this.checkForWinner()
		if (this.tieBrake) {
			this.showMessage('Sudden death!')
		} else if (this.winner) {
			this.showMessage(`${this.winner.name} is the winner!`, this.winner.color)
		}
		this.roundActive = false
		this.scoreboard.container.style.display = 'block'

		// Update points in scoreboard
		for (let index = 0; index < this.scoreboard.list.children.length; index++) {
			const tr = this.scoreboard.list.children[index];
			let pName = tr.getAttribute('data-name')
			let player = this.players.find(p => p.name === pName)
			tr.lastChild.innerText = player.points
		}

		// Sort scoreboard
		[...this.scoreboard.list.children]
			.sort((a, b) => {
				return a.lastChild.innerText > b.lastChild.innerText ? -1 : 1
			})
			.forEach(node => this.scoreboard.list.append(node))		
	}
	/** Will find a winner, if  more than one player has sufficient points to win, we will go with the player with the most points.
	* If of these players more than one have the same amount of points and all sufficient points to win, we do a tie brake round
	*/
	checkForWinner() {
		this.winner = null
		if (this.tieBrake) {
			this.winner = this.activePlayers.find(p => p.alive)
			this.tieBrake = false
			return
		}
		let potentialWinners = this.players.filter(p => p.points >= this.pointsToWin)
		if (potentialWinners.length === 1) {
			this.winner = potentialWinners[0]
		} else if (potentialWinners.length > 1) {
			potentialWinners.sort((a, b) => a.points - b.points)
			let mostPoints = potentialWinners[potentialWinners.length - 1].points
			let playersWithMostPoints = potentialWinners.filter(p => p.points === mostPoints)
			if (playersWithMostPoints.length === 1) {
				this.winner = playersWithMostPoints[0]
			} else {
				this.winner = null
				this.tieBrake = true
				this.players.forEach(p =>  {
					p.active = playersWithMostPoints.map(p => p.name).includes(p.name)
				})
			}
		}
	}
	resetGame() {
		this.players.forEach(p => {
			p.points = 0
			p.active = true
		})
		this.winner = null
		this.hideMessage()
		document.addEventListener('keydown', this.boundedEventListener)
		this.gameStarted = false
		this.startScreen.container.style.display = 'block'
		this.scoreboard.container.style.display = 'none'
	}
}