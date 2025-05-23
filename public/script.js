const socket = io();
let localStream, peer;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCallBtn = document.getElementById("startCallBtn");
const endCallBtn = document.getElementById("endCallBtn");

startCallBtn.onclick = startCall;
endCallBtn.onclick = endCall;

async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localVideo.srcObject = localStream;

  peer = new RTCPeerConnection(config);

  localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

  peer.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit("candidate", candidate);
  };

  peer.ontrack = ({ streams: [stream] }) => {
    remoteVideo.srcObject = stream;
  };

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("offer", offer);
}

function endCall() {
  if (peer) {
    peer.close();
    peer = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  alert("Call Ended");
}

socket.on("offer", async (offer) => {
  if (!peer) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;

    peer = new RTCPeerConnection(config);
    localStream
      .getTracks()
      .forEach((track) => peer.addTrack(track, localStream));

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("candidate", candidate);
    };

    peer.ontrack = ({ streams: [stream] }) => {
      remoteVideo.srcObject = stream;
    };
  }

  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", (candidate) => {
  if (peer) {
    peer.addIceCandidate(new RTCIceCandidate(candidate));
  }
});
