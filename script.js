const locales = {
  en: {
    localeName: 'English',
    copiedString: 'Copied the comic to your clipboard!',
    defaultTopic: 'Silicate Chemistry',
    defaultExperts: 'Geochemists',
    defaultExample: 'The formulas for olivine and one or two feldspars',
    defaultResponse: 'Quartz',
    templateTopSingular: "{topic} is second nature to us {experts}, so it's easy to forget that the average person probably only knows {example}.",
    templateTopPlural: "{topic} are second nature to us {experts}, so it's easy to forget that the average person probably only knows {example}.",
    templateBottom: "And {response}, of course."
  },
  pt: {
    localeName: 'Português',
    copiedString: 'Quadrinho copiado para a área de transferência!',
    defaultTopic: 'Química de Silicatos',
    defaultExperts: 'Geoquímicos',
    defaultExample: 'As fórmulas de olivina e um ou dois feldspatos',
    defaultResponse: 'Quartzo',
    templateTopSingular: "{topic} é algo natural para nós, {experts}, por isso é fácil esquecer que pessoas comuns provavelmente só sabem {example}.",
    templateTopPlural: "{topic} são coisas naturais para nós, {experts}, por isso é fácil esquecer que pessoas comuns provavelmente só sabem {example}.",
    templateBottom: "E {response}, é claro."
  }
};

let currentLocale
function setLocale (userLocale) {
  let userShortLocale = userLocale.slice(0, 2);
  currentLocale = locales[userLocale] || locales[userShortLocale] || locales.en;
}
setLocale(navigator.language)

localeSelector.addEventListener('change', () => {
  setLocale(localeSelector.value)
  draw()
})
localeSelector.innerHTML = Object.entries(locales).map(e => `<option value="${e[0]}">${e[1].localeName}</option>`).join('')

const ctx = canvas.getContext('2d');
ctx.font = '18px xkcd-script';
ctx.textBaseline ='top';

document.querySelectorAll('input').forEach(input => {
	input.addEventListener('input', draw);
})

buttonSave.addEventListener('click', function saveImage() {
	let data = canvas.toDataURL('image/png');
	let dummyLink = document.createElement('a');
	dummyLink.href = data;
	dummyLink.download = 'comic.png';
	dummyLink.click();
	dummyLink.remove();
})

buttonCopy.addEventListener('click', async function copyImage() {
	const data = canvas.toBlob(async (blob) => {
		await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
	});
	window.alert(currentLocale.copiedString);
})

function interpolateTemplate (template, params) {
  return template.replace(/\{([^}]+?)\}/g, (all, key) => params[key] || '')
}

function draw() {
	let topic = inputTopic.value || currentLocale.defaultTopic;
	let plural_topic = inputPluralTopic.checked;
	let experts = inputExperts.value || currentLocale.defaultExperts;
	let example = inputExample.value || currentLocale.defaultExample;
	let response = inputResponse.value || currentLocale.defaultResponse;
	
	let top_template = plural_topic ? currentLocale.templateTopPlural : currentLocale.templateTopSingular; 

	let text1 = interpolateTemplate(top_template, {topic, experts, example, response})
	let text2 = interpolateTemplate(currentLocale.templateBottom, {topic, experts, example, response})
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	
	ctx.fillStyle = '#FFF';
	ctx.fillRect(26, 21, 241, 114);
	ctx.fillRect(88, 150, 181, 16);
	
	ctx.fillStyle = '#000';
	ctx.textAlign = 'left';
	textWrap(text1.toUpperCase(), 10, 10, 280, 130)
	ctx.font = '18px xkcd-script';
	ctx.textAlign = 'right';
	ctx.fillText(text2.toUpperCase(), 285, 150, 220)
}

function textWrap(text, x, y, width, height) {
	let words = text.split(/\s+/);
	let currentLine = '';
	let wrappedText = [];
	let fontSize = 18;
	for(let i = 0; i < words.length; i++) {
		let testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
		if (ctx.measureText(testLine).width > width && currentLine) {
			wrappedText.push(currentLine);
			currentLine = words[i];
		} else {
			currentLine = testLine
		}
	}
	if (currentLine) wrappedText.push(currentLine);
	
	if (wrappedText.length * fontSize > height) {
		fontSize = height / wrappedText.length;
		ctx.font = `${fontSize}px xkcd-script`;
	}
	
	let blockHeight = fontSize * wrappedText.length
	if (blockHeight < height) {
		y = 10 + height - blockHeight;
	}
	
	for (let i = 0; i < wrappedText.length; i++) {
		ctx.fillText(wrappedText[i], x, y + fontSize * i)
	}
}

function init() {
	img = new Image();
	img.crossOrigin = 'anonymous';
	img.src = 'assets/comic.png';
	img.onload = () => {draw(); document.querySelector('fieldset').removeAttribute('hidden')}
	
	let params = new URLSearchParams(document.location.search);
	inputTopic.value = params.get('topic');
	inputPluralTopic.checked = params.get('plural_topic');
	inputExperts.value = params.get('experts');
	inputExample.value = params.get('example');
	inputResponse.value = params.get('response');
  
  const paramsLocale = params.get('locale');
  if (paramsLocale) setLocale(setLocale)
}

init();
