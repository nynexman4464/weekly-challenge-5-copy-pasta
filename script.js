function paste(evt) {
	const x = navigator.clipboard.read();
	x.then(handlePaste).catch(handleError);
}

async function handlePaste(items) {
	console.log(items.length);
	// reset the canvas
	getCanvasContext(true);
	for (const item of items) {
		for (const type of item.types) {
			const blob = await item.getType(type);
			// we can now use blob here
			await renderIt(type, blob);
		}
	}
}

function handleError(err) {
	alert("oops: " + err);
}

async function renderIt(type, blob) {
	console.log(type, blob);
	const [prefix, suffix] = type.split("/");
	switch (prefix) {
		case "image":
			await renderImage(blob);
			break;
		case "text":
			await renderText(blob, suffix);
			break;
		default:
			handleError("Weird type: " + type);
	}
}

async function renderImage(blob) {
	return await new Promise((resolve, reject) => {
		const ctx = getCanvasContext();
		const img = new Image();
		img.onload = (event) => {
			// ctx.strokeRect(0, 0, img.width + 2, img.height + 2);
			ctx.drawImage(event.target, 0, 0); //1, 1);
			// release blob after drawing
			URL.revokeObjectURL(event.target.src);
			ctx.translate(0, img.height);
			resolve();
		};
		img.onerror = (evt) => {
			// release blob after error
			URL.revokeObjectURL(event.target.src);
			reject("couldn't render image");
		};
		img.src = URL.createObjectURL(blob);
		// document.body.appendChild(img);
	});
}

async function renderText(blob, flavor) {
	const text = await readText(blob);
	console.log(text);
	let data;
	switch (flavor) {
		case "plain":
			const node = document.createElementNS(
				"http://www.w3.org/1999/xhtml",
				"pre",
			);
			node.style.whiteSpace = "pre-wrap";
			node.innerText = text;
			data = getAsSvgXml(node);
			break;
		case "html":
			const container = document.createElementNS(
				"http://www.w3.org/1999/xhtml",
				"div",
			);
			container.innerHTML = text;
			data = getAsSvgXml(container);
			break;
		default:
			throw new Error("I don't know how to use text/" + flavor);
	}
	if (data == null) {
		return;
	}
	const svg = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
	await renderImage(svg);
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

async function readText(blob) {
	return await new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.addEventListener("load", () => resolve(reader.result), false);

		reader.addEventListener("error", () => reject(reader.error), false);

		reader.readAsText(blob);
	});
}

function getAsSvgXml(node) {
	const doc = document.createDocumentFragment();
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	// svg.setAttribute("width", 500);
	// svg.setAttribute("height", 1000);
	doc.appendChild(svg);
	const elt = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"foreignObject",
	);
	elt.setAttribute("width", "100%");
	elt.setAttribute("height", "100%");
	svg.appendChild(elt);
	elt.appendChild(node);

	// Get well-formed markup
	let data = new XMLSerializer().serializeToString(doc);
	return data;
}
