const textures = {
	bolt: new PIXI.Texture.from('/assets/bolt-solid.svg'),
	ie: new PIXI.Texture.from('/assets/internet-explorer-brands.svg'),
	eraser: new PIXI.Texture.from('/assets/eraser-solid.svg'),
	plus: new PIXI.Texture.from('/assets/plus-solid.svg'),
	minus: new PIXI.Texture.from('/assets/minus-solid.svg'),
	eye: new PIXI.Texture.from('/assets/eye-solid.svg'),
	random: new PIXI.Texture.from('/assets/random-solid.svg'),
	globe: new PIXI.Texture.from('/assets/globe-solid.svg'),
	square: new PIXI.Texture.from('/assets/wave-square-solid.svg'),
}


const colorByActOn = {
	self: 0x00AA00, // green
	enemies: 0xAA0000, // red
	global: 0xAAAAAA // grey
}
const powerUpDefinitions = [
	{
		name: 'haste',
		texture: textures.bolt,
		actsOnPlayer: true,
		playerEffect: {
			velocityMultiplier: 2.5,
			duration: 3,
		}
	},
	{
		name: 'slowness',
		texture: textures.ie,
		actsOnPlayer: true,
		playerEffect: {
			velocityMultiplier: .5,
			duration: 5,
		}
	},
	{
		name: 'fatness',
		texture: textures.plus,
		actsOnPlayer: true,
		playerEffect: {
			thicknessMultiplier: 2,
			duration: 5
		}
	},
	{
		name: 'thinness',
		texture: textures.minus,
		actsOnPlayer: true,
		playerEffect: {
			thicknessMultiplier: 0.5,
			duration: 5
		}
	},
	{
		name: 'invincibility',
		texture: textures.eye,
		actsOnPlayer: true,
		playerEffect: {
			invincibility: true,
			duration: 5
		},
	},
	{
		name: 'dizzyness',
		actsOnPlayer: true,
		texture: textures.random,
		playerEffect: {
			invertedControls: true,
			duration: 5
		}
	},
	{
		name: 'portalPlayer',
		actsOnPlayer: true,
		texture: textures.globe,
		playerEffect: {
			teleportThroughBorders: true,
			duration: 5
		}
	},
	{
		name: 'square',
		actsOnPlayer: true,
		texture: textures.square,
		playerEffect: {
			square: true,
			duration: 5
		}
	},
	// Global powerups
	{
		name: 'portalBorders',
		texture: textures.globe,
		duration: 5
	},
	{
		name: 'clear',
		texture: textures.eraser,
	},
]
class PowerUp extends PIXI.Container {
	get color () {
		return colorByActOn[this.actsOn]
	}
	radius = 20
	constructor(name) {
		super()
		this.name = name

		// deep copy definition over
		const definition = powerUpDefinitions.find(e => e.name === this.name)
		const deepCopy = Object.assign({}, definition, {playerEffect: Object.assign({}, definition.playerEffect)})
		Object.assign(this, deepCopy)
	
		// Set appropiate actsOn
		if (this.actsOnPlayer) {
			let randomized = oneIn(2)
			this.actsOn = randomized ? 'self' : 'enemies'
		} else {
			this.actsOn = 'global'
		}

		// Graphics
		const circle = new PIXI.Graphics()
		circle.beginFill(this.color)
		circle.drawCircle(this.radius / 2, this.radius / 2, this.radius)
		circle.endFill()
		this.addChild(circle)
		this.sprite = new PIXI.Sprite(this.texture)
		const padding = 10
		this.sprite.width = this.radius * 2 - padding * 2
		this.sprite.height = this.radius * 2 - padding * 2
		this.addChild(this.sprite)

	}
	randomizePosition(width, height) {
		this.x = Math.random() * width
		this.y = Math.random() * height
	}

}