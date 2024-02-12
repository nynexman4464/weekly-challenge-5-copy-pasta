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
			await renderIt(type, blob);
		}
	}
}

function handleError(err) {
	alert("oops: " + err);
}

async function renderIt(type, blob) {
	console.log(type, blob);
	getCanvasContext(true);
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
			ctx.drawImage(event.target, 0, 0);
			// release blob after drawing
			URL.revokeObjectURL(event.target.src);
			resolve();
		};
		img.onerror = (evt) => {
			// release blob after error
			URL.revokeObjectURL(event.target.src);
			reject("couldn't render image");
		};
		img.src = URL.createObjectURL(blob);
		ctx.translate(0, img.height);
	});
}

async function renderText(blob, flavor) {
	const text = await readText(blob);
	console.log(text);
	let data;
	switch (flavor) {
		case "plain":
			//TODO
			break;
		case "html":
			const doc = document.createDocumentFragment(); //document.implementation.createHTMLDocument("");
			const svg = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"svg",
			);
			svg.setAttribute("width",500);
			svg.setAttribute("height",500);
			doc.appendChild(svg);
			const elt = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
			elt.setAttribute("width","100%");
			elt.setAttribute("height","100%");
			svg.appendChild(elt);
			const container = document.createElementNS(
				"http://www.w3.org/1999/xhtml",
				"div",
			);
			elt.appendChild(container);
			container.innerHTML = text;

			// You must manually set the xmlns if you intend to immediately serialize the HTML
			// document to a string as opposed to appending it to a <foreignObject> in the DOM
			// doc.documentElement.setAttribute(
			// 	"xmlns",
			// 	doc.documentElement.namespaceURI,
			// );

			// Get well-formed markup
			data = new XMLSerializer().serializeToString(doc);
			break;
		default:
			throw new Error("I don't know how to use text/" + flavor);
	}
	if (data == null) {
		return;
	}
	const svg = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
	await renderImage(svg);

	// const ctx = getCanvasContext();
	// ctx.fillStyle = "grey";
	// const { fontBoundingBoxAscent, fontBoundingBoxDescent } =
	// 	ctx.measureText(text);
	// ctx.fillText(text, 0, fontBoundingBoxAscent);
	// ctx.translate(0, fontBoundingBoxAscent + fontBoundingBoxDescent);
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
