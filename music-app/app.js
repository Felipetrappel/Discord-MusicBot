// App de Música - Lógica do Player e Visualizador
// Este arquivo é um módulo ES (carregado com type="module").

const elements = {
	cover: document.getElementById('cover'),
	title: document.getElementById('title'),
	artist: document.getElementById('artist'),
	play: document.getElementById('play'),
	next: document.getElementById('next'),
	prev: document.getElementById('prev'),
	seek: document.getElementById('seek'),
	currentTime: document.getElementById('currentTime'),
	duration: document.getElementById('duration'),
	volume: document.getElementById('volume'),
	playlist: document.getElementById('playlist'),
	canvas: document.getElementById('viz'),
};

// Playlist de exemplo com URLs públicas
const tracks = [
	{
		title: 'SoundHelix Song 1',
		artist: 'SoundHelix',
		url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
		cover: 'assets/cover-placeholder.svg',
	},
	{
		title: 'SoundHelix Song 2',
		artist: 'SoundHelix',
		url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
		cover: 'assets/cover-placeholder.svg',
	},
	{
		title: 'SoundHelix Song 3',
		artist: 'SoundHelix',
		url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
		cover: 'assets/cover-placeholder.svg',
	},
	{
		title: 'SoundHelix Song 4',
		artist: 'SoundHelix',
		url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
		cover: 'assets/cover-placeholder.svg',
	},
];

// Áudio base (não inserido no DOM)
const audio = new Audio();
// Para usar com Web Audio + fontes externas
audio.crossOrigin = 'anonymous';
audio.preload = 'metadata';

audio.volume = Number(localStorage.getItem('musicapp_volume') ?? elements.volume.value);
elements.volume.value = String(audio.volume);

let currentIndex = 0;
let isPlaying = false;

// Web Audio API - Visualizer
let audioContext = null;
let analyser = null;
let sourceNode = null;
let animationId = null;

function ensureAudioContext() {
	if (!audioContext) {
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
		sourceNode = audioContext.createMediaElementSource(audio);
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 2048;
		analyser.smoothingTimeConstant = 0.85;
		sourceNode.connect(analyser);
		analyser.connect(audioContext.destination);
	}
}

function formatTime(seconds) {
	if (!isFinite(seconds)) return '0:00';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60).toString().padStart(2, '0');
	return `${m}:${s}`;
}

function setActiveItem() {
	const items = elements.playlist.querySelectorAll('li');
	items.forEach((item, i) => {
		if (i === currentIndex) item.classList.add('active');
		else item.classList.remove('active');
	});
}

function renderPlaylist() {
	elements.playlist.innerHTML = '';
	tracks.forEach((track, index) => {
		const li = document.createElement('li');
		li.dataset.index = String(index);
		const meta = document.createElement('div');
		meta.className = 'meta';
		const img = document.createElement('img');
		img.src = track.cover;
		img.alt = `Capa de ${track.title}`;
		const textWrap = document.createElement('div');
		const title = document.createElement('div');
		title.textContent = track.title;
		const artist = document.createElement('div');
		artist.textContent = track.artist;
		artist.style.color = 'var(--muted)';
		textWrap.append(title, artist);
		meta.append(img, textWrap);
		const badge = document.createElement('span');
		badge.className = 'badge';
		badge.textContent = 'Play';
		li.append(meta, badge);
		li.addEventListener('click', () => {
			if (currentIndex === index) {
				playPause();
				return;
			}
			loadTrack(index);
			play();
		});
		elements.playlist.appendChild(li);
	});
	setActiveItem();
}

function loadTrack(index) {
	currentIndex = (index + tracks.length) % tracks.length;
	const track = tracks[currentIndex];
	audio.src = track.url;
	elements.cover.src = track.cover;
	elements.title.textContent = track.title;
	elements.artist.textContent = track.artist;
	elements.seek.value = '0';
	elements.currentTime.textContent = '0:00';
	elements.duration.textContent = '0:00';
	setActiveItem();
}

function updatePlayButton() {
	elements.play.textContent = isPlaying ? '⏸' : '▶️';
	elements.play.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
}

async function play() {
	ensureAudioContext();
	if (audioContext && audioContext.state === 'suspended') {
		await audioContext.resume();
	}
	await audio.play();
	isPlaying = true;
	updatePlayButton();
	startVisualizer();
}

function pause() {
	audio.pause();
	isPlaying = false;
	updatePlayButton();
	stopVisualizer();
}

function playPause() {
	if (isPlaying) pause(); else play();
}

function next() {
	loadTrack(currentIndex + 1);
	play();
}

function prev() {
	loadTrack(currentIndex - 1);
	play();
}

function startVisualizer() {
	if (!analyser) return;
	const canvas = elements.canvas;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	function resizeCanvas() {
		const dpr = window.devicePixelRatio || 1;
		const width = canvas.clientWidth || canvas.width;
		const height = canvas.clientHeight || canvas.height;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		ctx.scale(dpr, dpr);
	}
	// Clear any previous scaling by resetting transform
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	resizeCanvas();

	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);

	cancelAnimationFrame(animationId);
	const barColorA = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7c3aed';
	const barColorB = getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim() || '#22d3ee';

	function draw() {
		animationId = requestAnimationFrame(draw);
		analyser.getByteFrequencyData(dataArray);
		const w = canvas.width / (window.devicePixelRatio || 1);
		const h = canvas.height / (window.devicePixelRatio || 1);
		ctx.clearRect(0, 0, w, h);

		const bars = Math.floor(w / 6);
		const step = Math.floor(dataArray.length / bars);
		const gradient = ctx.createLinearGradient(0, 0, 0, h);
		gradient.addColorStop(0, barColorB);
		gradient.addColorStop(1, barColorA);
		ctx.fillStyle = gradient;

		for (let i = 0; i < bars; i++) {
			const value = dataArray[i * step] / 255; // 0..1
			const barHeight = value * (h * 0.9);
			const x = i * (w / bars);
			const barWidth = Math.max(3, (w / bars) - 2);
			ctx.fillRect(x, h - barHeight, barWidth, barHeight);
		}
	}

	draw();
	window.addEventListener('resize', resizeCanvas, { passive: true });
}

function stopVisualizer() {
	if (animationId) cancelAnimationFrame(animationId);
}

// Eventos do elemento de áudio
audio.addEventListener('loadedmetadata', () => {
	elements.duration.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
	if (!isFinite(audio.duration) || audio.duration === 0) return;
	elements.currentTime.textContent = formatTime(audio.currentTime);
	const percent = (audio.currentTime / audio.duration) * 100;
	elements.seek.value = String(percent);
});

audio.addEventListener('ended', () => {
	next();
});

// Controles
elements.play.addEventListener('click', playPause);

elements.next.addEventListener('click', next);

elements.prev.addEventListener('click', prev);

elements.seek.addEventListener('input', () => {
	if (!isFinite(audio.duration) || audio.duration === 0) return;
	const percent = Number(elements.seek.value);
	audio.currentTime = (percent / 100) * audio.duration;
});

elements.volume.addEventListener('input', () => {
	const vol = Number(elements.volume.value);
	audio.volume = vol;
	localStorage.setItem('musicapp_volume', String(vol));
});

// Ações de teclado básicas (espaço play/pause, setas p/ seek)
document.addEventListener('keydown', (ev) => {
	if (ev.target instanceof HTMLInputElement) return; // não interferir com sliders
	if (ev.code === 'Space') { ev.preventDefault(); playPause(); }
	if (ev.code === 'ArrowRight') { audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || audio.currentTime + 5); }
	if (ev.code === 'ArrowLeft') { audio.currentTime = Math.max(audio.currentTime - 5, 0); }
});

// Inicialização
renderPlaylist();
loadTrack(currentIndex);
updatePlayButton();

// Dica: alguns navegadores requerem gesto do usuário para iniciar o áudio/contexto
// O play só será efetivado após clique em play ou seleção de faixa.
