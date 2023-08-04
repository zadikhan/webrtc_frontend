import React, { useEffect, useState } from "react";
import "../index.css"
import ReactPlayer from "react-player";


import  {useCallback } from "react";

import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";



const Hostpage =()=> {
    const [room, setRoom] = useState("");
    const [cameraList,setCameraList]=useState([]);
    const [selectedCamera,setSelectedCamera]=useState(null);
    const [isHosted,setIsHosted]=useState(false);
    
    
    const [myStream,setMyStream]= useState();
    
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
    
useEffect(()=>{
  const getCameraList=async()=>{


    try{
      const mediaDevices =await navigator.mediaDevices.enumerateDevices();
      const cameras = mediaDevices.filter((device)=>device.kind ==='videoinput')///incomplete
    setCameraList(cameras);
    }catch(error){
      console.error("error fetching camera ",error);
    }

  }
getCameraList();
},[])

const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
console.log(id);
    setRemoteSocketId(id);
  }, []);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);



  const startHosting =async ()=>{
    socket.emit("room:join", {  room });
     setIsHosted(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video:{deviceId : selectedCamera.deviceId}})
    
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer }); 
    
    setMyStream(stream);
    };



    const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
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
    const handleJoinRoom = useCallback(
        (data) => {
          const {  room } = data;
          console.log(data);
        },
        []
      );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);


  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("room:join", handleJoinRoom);

    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("room:join", handleJoinRoom);

      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleJoinRoom,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);


return (
  
<div className="host-page">
 { isHosted && <p> Stream is hosted for Room Id : {room}</p> }
 <h1 className="title"> Host Page  </h1>
<div className="form">
  
<input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)
          }

          />


  <select
  value={selectedCamera?.deviceId || ''}
  onChange={(e)=>{
    const selectedDeviceId=e.target.value;
    const camera = cameraList.find((camera)=>camera.deviceId===selectedDeviceId);
      
     setSelectedCamera(camera);
  
  }}>
    <option value =" ">select Camera </option>
    {cameraList.map((camera)=>(
      <option key={camera.deviceId} value={camera.deviceId} >
        {camera.label || `camera ${cameraList.indexOf(camera)+1}`}
      </option>
    ))}
  </select>
  <button className="streambutton" onClick={startHosting}>
    Start Hosting 
  </button>
  
  {myStream && <button onClick={sendStreams}>Send Stream</button>}
</div>



<ReactPlayer

playing
muted
height="100px"
width="200px"
url={myStream}
/>

</div>
)
}
export default Hostpage;