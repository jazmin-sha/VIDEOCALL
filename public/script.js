const socket = io();
let localStream, peer;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

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
  peer.addIceCandidate(new RTCIceCandidate(candidate));
});
