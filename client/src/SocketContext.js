import React  , {createContext , useState , useRef , useEffect} from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();

const socket = io ('https://calling-app.onrender.com');

const ContextProvider = ( {children}) => {

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();  

    const [stream , setStream] = useState();
    const [me,setMe] = useState('');
    const [call , setCall]= useState({});
    const [callAccepted , setCallAccepted] = useState(false);
    const [callEnded , setCallEnded] = useState(false);
    const [name , setName] = useState('');
    

    useEffect(()=>{
        navigator.mediaDevices.getUserMedia({video: true , audio: true})
        .then((currentStream)=>{
            setStream(currentStream);
            myVideo.current.srcObject = currentStream;
        });

            socket.on('me' , (id)=> {
                console.log(id , 'myId');
                setMe(id)
            });
            socket.on('calluser' , ({ from , name: callerName , signal})=>{
                setCall({ isReceivingCall: true , from , name: callerName , signal});
            });
    } , []);

    const answerCall = () => {
        setCallAccepted(true);
        const peer = new Peer({ initiator: false , trickle: false  , stream });

        peer.on('signal' , (data)=>{
            socket.emit('answercall' , {signal: data , to: call.from});
        });

        peer.on('stream', (currentStream) => {
            userVideo.current.srcObject = currentStream;
        });

        peer.signal(call.signal);

        connectionRef.current = peer;
    }

    const callUser = (id) => {
        const peer = new Peer({ initiator: true , trickle: false  , stream });

        peer.on('signal' , (data)=>{
            socket.emit('calluser' , {userToCall: id , signalData: data , from: me , name });
        });

        peer.on('stream', (currentStream) => {
            userVideo.current.srcObject = currentStream;
        });

        socket.on('callAccepted' , (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current=peer;

    }

    const leaveCall = () => {
        setCallEnded(true);
        //connectionRef.current.destroy();

       // window.location.reload();

    }
    return (
        <SocketContext.Provider value={{
            call,
            callAccepted,
            callEnded,
            myVideo,
            userVideo,
            me,
            stream,
            setName,
            name,
            answerCall,
            callUser,
            leaveCall,
        }}>
            {children}
        </SocketContext.Provider>
    );
};
 export {ContextProvider , SocketContext};

