window.onload = function() {
	$('input').on('click', function() {
		$(this).val("bruh");
	});
	
	let isRecording = false;
	let socket;
	let recorder;
	
	const run = async () => {
		if (isRecording) {
			if (socket) {
				socket.send(JSON.stringify({terminate_session: true}));
				socket.close();
				socket = null;
			}
			
			if (recorder) {
				recorder.pauseRecording();
				recorder = null;
			}
		} else {
		}
	}
}