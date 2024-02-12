function paste(evt) {
	const x = navigator.clipboard.read();
	x.then(handlePaste).catch(handleError);
}

async function handlePaste(items) {
	console.log(items.length);
	for (const item of items) {
		for (const type of item.types) {
			const blob = await item.getType(type);
			// we can now use blob here
			renderIt(type, blob);
		}
	}
}

function handleError(err) {
	alert("oops: " + err);
}

function renderIt(type, blob) {
	console.log(type, blob);
	getCanvasContext(true);
	const prefix = type.split("/");
	switch (prefix[0]) {
		case "image":
			renderImage(blob);
			break;
		case "text":
			renderText(blob);
			break;
		default:
			handleError("Weird type: " + type);
	}
}

function renderImage(blob) {
	const ctx = getCanvasContext();
	const img = new Image();
	img.onload = (event) => {
		ctx.drawImage(event.target, 0, 0);
		// release blob after drawing
		URL.revokeObjectURL(event.target.src);
	};
	img.src = URL.createObjectURL(blob);
	ctx.translate(0, img.height);
}

function renderText(blob) {
	const reader = new FileReader();

	reader.addEventListener(
		"load",
		() => {
			renderTextImpl(reader.result);
		},
		false,
	);

	reader.readAsText(blob);
}

function renderTextImpl(text) {
	console.log(text);
	const ctx = getCanvasContext();
	ctx.fillStyle = "grey";
	const { fontBoundingBoxAscent, fontBoundingBoxDescent } =
		ctx.measureText(text);
	ctx.fillText(text, 0, fontBoundingBoxAscent);
	ctx.translate(0, fontBoundingBoxAscent + fontBoundingBoxDescent);
}

function getCanvasContext(clear = false) {
	const canvas = document.getElementById("thecanvas"),
		ctx = canvas.getContext("2d");
	if (clear) {
		ctx.reset();
		// Get the device pixel ratio, falling back to 1.
		const dpr = window.devicePixelRatio || 1;
		// Get the size of the canvas in CSS pixels.
		const rect = canvas.getBoundingClientRect();
		// Give the canvas pixel dimensions of their CSS
		// size * the device pixel ratio.
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		// adjust style to match "original" size
		canvas.style.width = rect.width + "px";
		canvas.style.height = rect.height + "px";
		// Scale all drawing operations by the dpr, so you
		// don't have to worry about the difference.
		ctx.scale(dpr, dpr);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	return ctx;
}
