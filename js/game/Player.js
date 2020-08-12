class Player extends PIXI.Container {

	alive = true
	points = 0
	active = true
	isPaintingCooldown = 0
	isMakingHitboxesCooldown = 0
	makeHoleCooldown = getRandomNumberBetween(.5, 1)
	effects = []
	lag = 1
	wasPainting = true
	get lastLineSegment () {
		let graphicsData = this.line.geometry.graphicsData
		let last = graphicsData[graphicsData.length - 1]
		return last
	}
	get lineStyle () {
		return {
			width: this.radius * 2,
			texture: PIXI.Texture.WHITE,
			color: this.color,
			alpha: 1,
			matrix: null,
			alignment: 0.5,
			native: false,
			cap: PIXI.LINE_CAP.BUTT,
			join: PIXI.LINE_JOIN.ROUND,
			miterLimit: 10,
			visible: true
        }
	}
	get isPainting () {
		return this.isPaintingCooldown === 0
	}
	get isMakingHitboxes () {
		return this.isMakingHitboxesCooldown === 0
	}
	get hitBoxSize () {
		return Math.sqrt(2) * this.radius
	}
	get hitBox() {
		return {
			minX: this.x - this.hitBoxSize / 2,
			maxX: this.x + this.hitBoxSize / 2,
			minY: this.y - this.hitBoxSize / 2,
			maxY: this.y + this.hitBoxSize / 2
		}
	}
	get spawnBoxSize () {
		return this.hitBoxSize * 0.8
	}
	get spawnBox() {
		return {
			minX: this.x - this.spawnBoxSize / 2,
			maxX: this.x + this.spawnBoxSize / 2,
			minY: this.y - this.spawnBoxSize / 2,
			maxY: this.y + this.spawnBoxSize / 2
		}
	}
	get activeEffects () {
		return this.effects.filter(e => !e.timedOut)
	}
	get velocity() {
		return combineMultipliers(this.activeEffects.map(e => e.velocityMultiplier), this.baseVelocity) * this.lag
	}
	get radius() {
		return combineMultipliers(this.activeEffects.map(e => e.thicknessMultiplier), this.baseRadius)
	}
	get isInvincible () {
		return !this.isPainting || this.activeEffects.some(e => e.invincibility)
	}
	get canTeleportThroughBorders () {
		return this.activeEffects.some(e => e.teleportThroughBorders)
	}
	get hasInvertedControls () {
		return this.activeEffects.some(e => e.invertedControls)
	}
	get turn90Degrees () {
		return this.activeEffects.some(e => e.square)
	}
	get visible () {
		return this.active
	} 
	set visible (val) {
		this.active = val
	}
	constructor(options, lineContainer) {
		super()
		this.name = options.name
		this.color = options.color
		if (options.x && options.y && options.direction) {
			this.position.set(options.x, options.y)
			this.direction = options.direction
		}
		// Controls
		const { left, right } = options.controls
		this.leftKey = keyboard(left)
		this.rightKey = keyboard(right)

		this.leftKey.press = () => {
			this.leftWasPressed = true
		}
		this.rightKey.press = () => {
			this.rightWasPressed = true
		}

		this.baseRadius = 5 // size
		this.baseVelocity = 3
		this.turnVelocity = this.velocity / 50

		// Create head
		this.head = new PIXI.Graphics()
		this.addChild(this.head);
		this.drawHead()

		// Create line
		this.line = new PIXI.Graphics()
		this.line.lineStyle(this.lineStyle)
		lineContainer.addChild(this.line)
	}
	drawHead(options) {
		this.head.clear()
		let defaults = {
			indicator: false
		}
		options = Object.assign(defaults, options)
		let color = this.hasInvertedControls ? 0x183153 : 0xf1e05a // blue or yellow
		this.head.beginFill(color)
		
		if (this.turn90Degrees) {
			this.head.drawRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2)
		} else {
			this.head.drawCircle(0, 0, this.radius)
		}
		this.head.endFill()
		if (options.indicator) {
			this.head.lineStyle(4, this.color)
			this.head.drawCircle(0, 0, this.radius * 2)
			this.head.endFill()
		}

		if (this.canTeleportThroughBorders) {
			this.head.alpha = 0.4
		} else {
			this.head.alpha = 1
		}
	}
	clearTail() {
		this.line.geometry.graphicsData = []
		this.makeNewLineSegment()
		this.redrawLine()
	}
	randomizePosition(width, height) {
		// Minimum x/y distance to edges
		let safetyP = this.radius * 2
		this.x = getRandomNumberBetween(safetyP, width - safetyP)
		this.y = getRandomNumberBetween(safetyP, height - safetyP)
		
		// Minimum x/y distance to edges when we limit direction randomness
		let safetyD = 110 // 110 makes it so that it's possible to turn away, but hard
		let minX = safetyD,
			minY = safetyD,
			maxX = width - safetyD,
			maxY = height - safetyD

		// radians
		let top = -3/2 * Math.PI,
			right = 0,
			bottom = -1/2 * Math.PI,
			left = -Math.PI
		let direction
		// In a corner
		if (this.x < minX && this.y < minY) {
			// top-left
			direction = getRandomNumberBetween(bottom, right) // bottom-right
		} else if (this.x > maxX && this.y < minY) {
			// top-right
			direction = getRandomNumberBetween(bottom, left) // bottom-left
		} else if (this.x > maxX && this.y > maxY) {
			// bottom-right
			direction = getRandomNumberBetween(top, left) // top-left
		} else if (this.x < minX && this.y > maxY) {
			// bottom-left
			direction = getRandomNumberBetween(top, right) // top-right
		}
		// On an edge
		else if (this.y < minY) {
			// top
			direction = getRandomNumberBetween(right, left) // down
		} else if (this.x > maxX) {
			// right
			direction = getRandomNumberBetween(bottom, top) // left
		} else if (this.y > maxY) {
			// bottom
			direction = getRandomNumberBetween(right, Math.PI * 2 - -left) // up
		} else if (this.x < minX) {
			// left
			direction = getRandomNumberBetween(bottom, Math.PI*2 - top) // right
		} else {
			// Not close enought to any edge or corner, any direction allowed
			direction = Math.random() * 2 * Math.PI
		}
		this.direction = direction
		this.makeNewLineSegment()

	}
	turn() {
		let left, right
		// if making hard turns, require to let go of button before pressing again
		if (this.turn90Degrees) {
			left = this.leftWasPressed
			right = this.rightWasPressed
		} else {
			left = this.leftKey.isDown
			right = this.rightKey.isDown
		}

		this.leftWasPressed = false
		this.rightWasPressed = false

		// Handle if the player hasInvertedControls
		if (this.hasInvertedControls) {
			[left, right] = [right, left]
		}
		let deltaDirection = this.turn90Degrees ? Math.PI / 2 : this.turnVelocity * this.lag
		if (left) {
			this.direction = this.direction + deltaDirection
		} else if (right) {
			this.direction = this.direction - deltaDirection
		}
	}
	moveForward() {
		const dx = Math.cos(this.direction) * this.velocity, // x-component
			dy = -Math.sin(this.direction) * this.velocity // y-component
		this.lastX = this.x
		this.lastY = this.y
		this.y = this.y + dy
		this.x = this.x + dx
	}
	die() {
		if (this.isInvincible) return false
		this.alive = false
		return true

	}
	collidesWith(object) {
		return AABBIntersectsAABB(this.hitBox, ObjectToMinMax(object))
	}
	addEffect(effect) {
		this.effects.push(effect)
		this.makeNewLineSegment()
		if (effect.invincibility) {
			this.isPaintingCooldown = 5
			this.isMakingHitboxesCooldown = 5
		}
		this.drawHead()
		setTimeout(() => {
			if (this.alive) {
				effect.timedOut = true
			}
			this.drawHead()
			this.makeNewLineSegment()
		}, effect.duration * 1000)
	}
	makeNewLineSegment() {
		this.line.lineStyle(this.lineStyle)
		this.line.moveTo(this.x, this.y)
		this.line.lineTo(this.x + .0001, this.y + .0001)
		let newGD = new PIXI.GraphicsData(new PIXI.Polygon(this.x, this.y), this.line._fillStyle, this.lineStyle)
		newGD.shape.closeStroke = false
		this.line.geometry.graphicsData.push(newGD)
	}
	redrawLine() {
		this.line.geometry.invalidate()
	}
	makeHole() {
		let holeFactor = .03
		this.isMakingHitboxesCooldown = holeFactor * this.radius
		this.isPaintingCooldown = this.isMakingHitboxesCooldown * .8
		this.makeHoleCooldown = getRandomNumberBetween(1, 4)
	}
	update(dt, elapsedTime, tailHitBoxes, renderer) {
		this.lag = dt * 60
		if (!this.alive) return
		
		if (this.makeHoleCooldown === 0 && this.isPainting && this.isMakingHitboxes) {
			this.makeHole()
		}
		// Create hitbox
		if (this.isMakingHitboxes) {
			for (let x = this.spawnBox.minX; x <= this.spawnBox.maxX; x++) {
				if (undefined === tailHitBoxes[Math.round(x)]) continue;
				for (let y = this.spawnBox.minY; y <= this.spawnBox.maxY; y++) {
					if (!tailHitBoxes[Math.round(x)][Math.round(y)]) {
						tailHitBoxes[Math.round(x)][Math.round(y)] = [elapsedTime, this.name]
					}
				}
			}
		}

		if (!this.wasPainting && this.isPainting) {
			this.makeNewLineSegment()
		}
		// Make icremental movement
		this.turn()
		this.moveForward()

		// Set end of tail part - see https://github.com/pixijs/pixi.js/issues/6529
		if (this.wasPainting && this.isPainting) {
			let points = this.lastLineSegment.shape.points
			let x = points[points.length-2]
			let y = points[points.length-1]
			let dist = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)) // Pythagoras
			// Limit how often we set new points to line (this makes very little visual difference and creates about 50% of the points)
			if (dist > this.radius * 0.8) {
				this.lastLineSegment.shape.points.push(this.x)
				this.lastLineSegment.shape.points.push(this.y)
				this.redrawLine()
			}
		}

		this.wasPainting = this.isPainting

		this.isPaintingCooldown = updateCooldown(this.isPaintingCooldown, dt)
		this.isMakingHitboxesCooldown = updateCooldown(this.isMakingHitboxesCooldown, dt)
		this.makeHoleCooldown = updateCooldown(this.makeHoleCooldown, dt)

	}
}