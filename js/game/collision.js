function testForAABB(object1, object2) {
	const bounds1 = object1.getBounds();
	const bounds2 = object2.getBounds();

	return bounds1.x < bounds2.x + bounds2.width
		&& bounds1.x + bounds2.width > bounds2.x
		&& bounds1.y < bounds2.y + bounds2.height
		&& bounds1.y + bounds2.height > bounds2.y;
}
function AABBIntersectsAABB(a, b) {
	return (a.minX <= b.maxX && a.maxX >= b.minX) &&
		(a.minY <= b.maxY && a.maxY >= b.minY)
}
function ObjectToMinMax(object) {
	const bounds = object.getBounds();
	return {
		minX: bounds.x,
		maxX: bounds.x + bounds.width,
		minY: bounds.y,
		maxY: bounds.y + bounds.height
	}
}