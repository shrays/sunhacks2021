window.onload = function() {
	let textBox;
	let isRecording = false;
	let socket;
	let recorder;
	
	$('input').filter(function() {
		return ($(this).attr('type') == 'text' || $(this).attr('type') == 'search');
	}).parent().append('<div class = "micButton"><img id = "handleImg" class = "sizeHandle" src = "https://raw.githubusercontent.com/shrays/sunhacks2021/main/recordButton.png"></div>');
	
	const start = async () => {
		const response = await fetch('http://localhost:5000'); // get temp session token from server.js (backend)
		const data = await response.json();
		const { token } = data;
		
		socket = await new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`); // establish wss with AssemblyAI (AAI) at 16000 sample rate
		
		socket.onerror = (event) => console.error('Error:', event);
		socket.onclose = event => {
			console.log(event)
		}
		
		// handle incoming messages to display transcription to the DOM
		const texts = {};
		socket.onmessage = (message) => {
			let msg = '';
			const res = JSON.parse(message.data);
			texts[res.audio_start] = res.text;
			const keys = Object.keys(texts);
			keys.sort((a, b) => a - b);
			for (const key of keys) {
				if (texts[key]) {
					msg += ` ${texts[key]}`;
				}
			}
			textBox.val(msg);
		};
		
		socket.onopen = () => {
		  // once socket is open, begin recording
			navigator.mediaDevices.getUserMedia({ audio: true })
				.then((stream) => {
					recorder = new RecordRTC(stream, {
					type: 'audio',
					mimeType: 'audio/webm;codecs=pcm', // endpoint requires 16bit PCM audio
					recorderType: StereoAudioRecorder,
					timeSlice: 250, // set 250 ms intervals of data that sends to AAI
					desiredSampRate: 16000,
					numberOfAudioChannels: 1, // real-time requires only one channel
					bufferSize: 4096,
					audioBitsPerSecond: 128000,
					ondataavailable: (blob) => {
						const reader = new FileReader();
						reader.onload = () => {
							const base64data = reader.result;

							// audio data must be sent as a base64 encoded string
							if (socket) {
								socket.send(JSON.stringify({ audio_data: base64data.split('base64,')[1] }));
							}
						};
						reader.readAsDataURL(blob);
					},
				});

				recorder.startRecording();
			})
			.catch((err) => console.error(err));
		};
	};
	
	const stop = async () => {
		if (socket) {
			socket.send(JSON.stringify({terminate_session: true}));
			socket.close();
			socket = null;
		}
		
		if (recorder) {
			recorder.pauseRecording();
			recorder = null;
		}
	}
	
	$('.sizeHandle').on('mousedown touchstart', function() {
		textBox = $(this).parent().siblings('input:first');
		start();
	});
	
	$('.sizeHandle').on('mouseup mouseleave touchend', function() {
		stop();
	});
}