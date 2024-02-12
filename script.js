function paste(evt){
	const x = navigator.clipboard.read();
	x.then(handlePaste).catch(handleError)
}

async function handlePaste(items){
	console.log(items.length);
	for (const item of items) {
		for (const type of item.types) {
			const blob = await item.getType(type);
        // we can now use blob here
			console.log(type, blob);
		}
	}
}

function handleError(err){
	alert("oops: "+err);
}