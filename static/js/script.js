function copyFile() {
  const inputFile = document.getElementById("audioFileInput");
  const file = inputFile.files[0];
  const newName = "newFileName.mp3"; // Specify the new file name here
  const destinationDir = "/path/to/destination"; // Specify the destination directory here

  if (!file) {
    console.error("No file selected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const fileData = new Uint8Array(event.target.result);

    fetch("/copy-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: fileData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("File copied successfully.");
        } else {
          console.error("Failed to copy file:", data.error);
        }
      })
      .catch((error) => {
        console.error("Error copying file:", error);
      });
  };

  reader.readAsArrayBuffer(file);
} //webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

var recordTimeout; // variable to hold the timeout for stopping recording

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);

function startRecording() {
  console.log("recordButton clicked");

  /*
    Simple constraints object, for more advanced audio features see
    https://addpipe.com/blog/audio-constraints-getusermedia/
  */

  var constraints = { audio: true, video: false };

  /*
      Disable the record button until we get a success or fail from getUserMedia() 
  */

  recordButton.disabled = true;
  stopButton.disabled = false;
  pauseButton.disabled = false;

  /*
      We're using the standard promise based getUserMedia() 
      https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  */

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      console.log(
        "getUserMedia() success, stream created, initializing Recorder.js ..."
      );

      /*
          create an audio context after getUserMedia is called
          sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
          the sampleRate defaults to the one set in your OS for your playback device
      */
      audioContext = new AudioContext();

      //update the format
      document.getElementById("formats").innerHTML =
        "Format: 1 channel pcm @ " + audioContext.sampleRate / 1000 + "kHz";

      /*  assign to gumStream for later use  */
      gumStream = stream;

      /* use the stream */
      input = audioContext.createMediaStreamSource(stream);

      /* 
          Create the Recorder object and configure to record mono sound (1 channel)
          Recording 2 channels  will double the file size
      */
      rec = new Recorder(input, { numChannels: 1 });

      //start the recording process
      rec.record();

      console.log("Recording started");

      // Set a timeout to stop recording after 5 seconds
      recordTimeout = setTimeout(stopRecording, 6000);
    })
    .catch(function (err) {
      //enable the record button if getUserMedia() fails
      recordButton.disabled = false;
      stopButton.disabled = true;
      pauseButton.disabled = true;
    });
}

function pauseRecording() {
  console.log("pauseButton clicked rec.recording=", rec.recording);
  if (rec.recording) {
    //pause
    rec.stop();
    pauseButton.innerHTML = "Resume";
  } else {
    //resume
    rec.record();
    pauseButton.innerHTML = "Pause";
  }
}

function stopRecording() {
  console.log("stopButton clicked");

  //disable the stop button, enable the record too allow for new recordings
  stopButton.disabled = true;
  recordButton.disabled = false;
  pauseButton.disabled = true;

  //reset button just in case the recording is stopped while paused
  pauseButton.innerHTML = "Pause";

  //tell the recorder to stop the recording
  rec.stop();

  //stop microphone access
  gumStream.getAudioTracks()[0].stop();

  // Clear the timeout for stopping recording if it's still running
  clearTimeout(recordTimeout);

  //create the wav blob and pass it on to createDownloadLink
  rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
  var url = URL.createObjectURL(blob);
  var au = document.createElement("audio");
  var li = document.createElement("li");
  var link = document.createElement("a");

  //name of .wav file to use during upload and download (without extendion)
  var filename = new Date().toISOString();

  //add controls to the <audio> element
  au.controls = true;
  au.src = url;

  //save to disk link
  link.href = url;
  link.download = filename + ".wav"; //download forces the browser to donwload the file using the  filename
  link.innerHTML = "Save to disk";

  //add the new audio element to li
  li.appendChild(au);

  //add the filename to the li
  li.appendChild(document.createTextNode(filename + ".wav "));

  //add the save to disk link to li
  li.appendChild(link);

  // add the li element to the ol
  recordingsList.appendChild(li);

  rec.exportWAV(function (blob) {
    // Create FormData object
    var formData = new FormData();
    formData.append("audio", blob, "recorded_audio.wav");

    // Send audio data to server
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/predict", true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        var predicted_emotion = "";
        var responseData = JSON.parse(xhr.responseText);
        var emotion = responseData["predicted_emotion"].toLowerCase();

        if (emotion === "disgust") {
          predicted_emotion = "😒" + emotion;
        } else if (emotion === "calm") {
          predicted_emotion = "😌" + emotion;
        } else if (emotion === "happy") {
          predicted_emotion = "😊" + emotion;
        } else if (emotion === "fearful") {
          predicted_emotion = "😱" + emotion;
        } else if (emotion === "sad") {
          predicted_emotion = "🥺" + emotion;
        } else if (emotion === "surprised") {
          predicted_emotion = "😮‍💨" + emotion;
        } else if (emotion === "angry") {
          predicted_emotion = "🤬" + emotion;
        }
        document.getElementById("predicted_emotion").innerHTML =
          predicted_emotion;
        console.log("Upload successful");
      } else {
        console.error("Upload failed:", xhr.status);
      }
    };
    xhr.onerror = function () {
      console.error("Error occurred during upload");
    };
    xhr.send(formData);
  });
}


function copyFile() {
  const inputFile = document.getElementById("audioFileInput");
  const file = inputFile.files[0];
  const newName = "newFileName.mp3"; // Specify the new file name here
  const destinationDir =
    "C:UsersUSEROneDriveDocumentsSpeech_Emotion_Detection-masterSpeech_Emotion_Detection-master"; // Specify the destination directory here

  if (!file) {
    console.error("No file selected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const fileData = new Uint8Array(event.target.result);

    fetch("/copy-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: fileData,
    })
      .then((response) => {
        console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          console.log("File copied successfully.");
        } else {
          console.error("Failed to copy file:", data.error);
        }
      })
      .catch((error) => {
        console.error("Error copying file:", error);
      });
  };

  reader.readAsArrayBuffer(file);
}
