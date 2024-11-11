import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const socket = io("http://localhost:5000");

const VoiceChat = () => {
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const myVideo = useRef();
  const partnerVideo = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });

    socket.on("signal", (data) => {
      const peer = new SimplePeer({
        initiator: data.initiator,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (signalData) => {
        socket.emit("signal", { signal: signalData, initiator: false });
      });

      peer.on("stream", (partnerStream) => {
        partnerVideo.current.srcObject = partnerStream;
      });

      peer.signal(data.signal);
      setPeers((oldPeers) => [...oldPeers, peer]);
    });
  }, [stream]);

  const startCall = () => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (signalData) => {
      socket.emit("signal", { signal: signalData, initiator: true });
    });

    peer.on("stream", (partnerStream) => {
      partnerVideo.current.srcObject = partnerStream;
    });

    setPeers([...peers, peer]);
  };

  return (
    <div>
      <h1>Voice Chat</h1>
      <button onClick={startCall}>Start Call</button>
      <audio ref={myVideo} autoPlay />
      <audio ref={partnerVideo} autoPlay />
    </div>
  );
};

export default VoiceChat;
