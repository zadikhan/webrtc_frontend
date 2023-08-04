import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
   const [perStream,setPerStream]=useState()  
  const [remoteStream, setRemoteStream] = useState();



const personal=async()=>{
 
  const strea = await navigator.mediaDevices.getUserMedia({audio:true, video:true})
  setPerStream(strea);
}
  const handleIncommingCall = useCallback (
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
      
       personal()

    },
    [socket]
  );


  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
          
    socket.on("incomming:call", handleIncommingCall);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
    
      socket.off("incomming:call", handleIncommingCall);
    
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
  
    handleIncommingCall,
  
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);
  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={perStream}
          />
        </>
      )}
    </div>
  );
};

export default RoomPage;
