document.onreadystatechange = function () {
	if (document.readyState == "complete") {
		window.game = new Game();
	}
}