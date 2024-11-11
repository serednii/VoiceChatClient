import React, { useRef, useEffect, useState } from "react";

const VoiceChat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerConnection = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    // Підключення до WebSocket-сервера
    // ws.current = new WebSocket("ws://localhost:8080");
    ws.current = new WebSocket(
      "https://voicechatserver-production.up.railway.app/"
    );

    ws.current.onmessage = async ({ data }) => {
        try {
          // Перевірка, чи data є об'єктом Blob
          if (data instanceof Blob) {
            data = await data.text(); // Перетворення Blob на текст
          }
      
          // Парсинг JSON
          const message = JSON.parse(data);
      
          // Обробка типів повідомлень
          if (message.type === "offer") {
            if (peerConnection.current.signalingState === "stable") {
              // Якщо peerConnection в стані "stable", ми можемо обробити offer
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.data));
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);
              ws.current.send(JSON.stringify({ type: "answer", data: answer }));
            } else {
              console.error("PeerConnection не в правильному стані для обробки offer. Стан:", peerConnection.current.signalingState);
            }
          } else if (message.type === "answer") {
            if (peerConnection.current.signalingState === "have-local-offer") {
              // Якщо peerConnection в стані "have-local-offer", можемо обробити answer
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.data));
            } else {
              console.error("PeerConnection не в правильному стані для обробки answer. Стан:", peerConnection.current.signalingState);
            }
          } else if (message.type === "candidate") {
            // Обробка ICE кандидатів
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(message.data));
          }
        } catch (error) {
          console.error("Помилка обробки повідомлення:", error);
        }
      };
      

    // voicechatserver - production.up.railway.app;
    // ws.current.onmessage = async ({ data }) => {
    //   try {
    //     // Перевірка, чи data є об'єктом Blob
    //     if (data instanceof Blob) {
    //       data = await data.text(); // Перетворення Blob на текст
    //     }

    //     const message = JSON.parse(data); // Парсинг JSON
    //     // Далі обробка повідомлення
    //     if (message.type === "offer") {
    //       await peerConnection.current.setRemoteDescription(
    //         new RTCSessionDescription(message.data)
    //       );
    //       const answer = await peerConnection.current.createAnswer();
    //       await peerConnection.current.setLocalDescription(answer);
    //       ws.current.send(JSON.stringify({ type: "answer", data: answer }));
    //     } else if (message.type === "answer") {
    //       await peerConnection.current.setRemoteDescription(
    //         new RTCSessionDescription(message.data)
    //       );
    //     } else if (message.type === "candidate") {
    //       await peerConnection.current.addIceCandidate(
    //         new RTCIceCandidate(message.data)
    //       );
    //     }
    //   } catch (error) {
    //     console.error("Помилка обробки повідомлення:", error);
    //   }
    // };

    // ws.current.onmessage = async ({ data }) => {
    //   const message = JSON.parse(data);

    //   if (message.type === "offer") {
    //     // Потрібно додати перевірку перед setRemoteDescription
    //     if (peerConnection.current.signalingState === "stable") {
    //       await peerConnection.current.setRemoteDescription(
    //         new RTCSessionDescription(message)
    //       );
    //       const answer = await peerConnection.current.createAnswer();
    //       await peerConnection.current.setLocalDescription(answer);
    //       ws.current.send(JSON.stringify({ type: "answer", data: answer }));
    //     } else {
    //       console.error("PeerConnection не в стані 'stable' для обробки offer");
    //     }
    //   } else if (message.type === "answer") {
    //     // Аналогічно перевіряємо для answer
    //     if (peerConnection.current.signalingState === "have-local-offer") {
    //       await peerConnection.current.setRemoteDescription(
    //         new RTCSessionDescription(message)
    //       );
    //     } else {
    //       console.error(
    //         "PeerConnection не в правильному стані для обробки answer"
    //       );
    //     }
    //   } else if (message.type === "candidate") {
    //     // Обробка ICE кандидатів
    //     await peerConnection.current.addIceCandidate(
    //       new RTCIceCandidate(message.data)
    //     );
    //   }
    // };

    startLocalStream();
    setupWebRTC();

    return () => {
      // Закриття з'єднань і ресурсів при відключенні
      if (ws.current) ws.current.close();
      if (peerConnection.current) peerConnection.current.close();
    };
  }, []);

  //   async function startLocalStream() {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //       localStream.current.srcObject = stream; // Встановлення потоку для відображення
  //       setIsConnected(true);
  //       console.log("Local Stream:", localStream.current.getTracks());
  //     } catch (error) {
  //       console.error("Помилка доступу до мікрофона:", error.message);
  //       alert(
  //         "Будь ласка, надайте доступ до мікрофона в налаштуваннях браузера."
  //       );
  //     }
  //   }

  //   async function startLocalStream() {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  //       // Присвоюємо stream до localStream.current
  //       localStream.current = stream;

  //       // Перевіряємо наявність треків
  //       console.log("Local Stream Tracks:", localStream.current.getTracks());

  //       setIsConnected(true);
  //     } catch (error) {
  //       console.error("Помилка доступу до мікрофона:", error);
  //       alert(
  //         "Будь ласка, надайте доступ до мікрофона в налаштуваннях браузера."
  //       );
  //     }
  //   }

  async function startLocalStream() {
    try {
      // Перевірка наявності API для доступу до медіапристроїв
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia не підтримується в цьому браузері");
      }

      // Запит доступу до мікрофона
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setIsConnected(true);
    } catch (error) {
      // Виведення детальної помилки в консоль
      console.error("Помилка доступу до мікрофона:", error.message);

      // Показати сповіщення користувачеві
      alert(
        "Будь ласка, надайте доступ до мікрофона в налаштуваннях браузера."
      );
    }
  }

  async function setupWebRTC() {
    try {
      // Отримуємо потік із мікрофону користувача
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Створюємо RTCPeerConnection і зберігаємо в `peerConnection.current`
      peerConnection.current = new RTCPeerConnection();

      // Додаємо всі треки з MediaStream до RTCPeerConnection
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        // Додаємо потік до рефа для remoteStream
        remoteStream.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          ws.current.send(
            JSON.stringify({ type: "candidate", data: event.candidate })
          );
        }
      };
    } catch (error) {
      console.error("Помилка налаштування WebRTC:", error);
    }
  }

  const startCall = async () => {
    if (peerConnection.current) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      ws.current.send(JSON.stringify({ type: "offer", data: offer }));
    } else {
      console.error("peerConnection не ініціалізовано.");
    }
  };

  return (
    <div>
      <h2>Голосовий чат</h2>
      <div>
        <button onClick={startCall} disabled={!isConnected}>
          Розпочати дзвінок
        </button>
      </div>
      <audio ref={localStream} autoPlay muted />
      <audio ref={remoteStream} autoPlay />
    </div>
  );
};

export default VoiceChat;
