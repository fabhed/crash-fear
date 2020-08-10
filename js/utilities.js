/**
 * 
 * @param {*} min 
 * @param {*} max 
 * @returns A number between min and max
 */
function getRandomNumberBetween(min, max) {
	let diff = max - min
	return min + Math.random() * diff
}

/**
 * Will subtract dt from cooldown until cooldown becomes 0
 * @param {Number} cooldown The current cooldown
 * @param {Number} dt deltaTime
 * @returns {Number}
 */
function updateCooldown(cooldown, dt) {
	if (cooldown > 0) {
		let newCd = cooldown - dt
		if (newCd < 0) {
			return 0
		} else {
			return newCd
		}
	} else {
		return 0
	}
}
/**
 * 
 * @param {[*]} objects An array of PIXI objects to be deleted
 */
function deleteObjects(objects) {
	for (let i = objects.length - 1; i >= 0; i--) {
		objects[i].destroy({ objects: true });
	}
}


function combineMultipliers(multipliers, base) {
	return multipliers.filter(m => typeof m === 'number').reduce((prev, curr) => {
		return prev * curr
	}, base)
}

/**
 * Helper function to work with random possibilities
 * oneIn(2) will return true 50% of the time
 * oneIn(4) will return true 25% of the time
 * etc...
 * @param {Number} possibilities 
 * @returns {Boolean}
 */
function oneIn(possibilities) {
	return Math.round(Math.random() * possibilities - 1) === 0
}

/**
 * Smoother animation, where it goes faster close to current = 0.5, and slower near 0, and 1
 * @param {*} current 
 * @param {*} directionFactor 
 * @param {*} step 
 */
function animateAlpha(current, directionFactor, step = 0.005) {
	let newDirectionFactor
	if (current >= 1) {
		newDirectionFactor = -1
	} else if (current <= 0) {
		newDirectionFactor = 1
	} else {
		newDirectionFactor = directionFactor
	}
	let smoothnessFactor = (1 / Math.max(Math.abs(0.5 - current), 0.1))
	let newCurrent = current + newDirectionFactor * step * smoothnessFactor
	return {
		alpha: newCurrent,
		factor: newDirectionFactor 
	}
}

/**
 * NOTE: Will not work if hexa number starts with 0
 * @param {*} number a hexa decimal number representing the color
 * @returns Color str begining with a #
 */
function hexToColor(number) {
	return '#' + number.toString(16)
}