import { Button } from "@nextui-org/react"
import { useState } from "react";
import { FaMicrophone,FaMicrophoneSlash } from "react-icons/fa6";
import { } from "react-icons/fa6";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';


export const VoiceHandler=()=>{
const [spokenContent,setSpokenContent]=useState("")
const [microphoneHandle,setMicrophoneHandle]=useState<boolean>(false)
const {
      transcript,
      listening,
      resetTranscript,
      browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

const onButtonPress=()=>{
    if(microphoneHandle){
        SpeechRecognition.stopListening();
    }else{
        SpeechRecognition.startListening();
    }
    setMicrophoneHandle(!microphoneHandle)
}

    return <div>
        <p className="p-2 bg-black text-white">
            {transcript}
        </p>
        <Button className={`p-2 ${microphoneHandle?"bg-red-500 hover:bg-red-700":"bg-blue-500 hover:bg-blue-700"}`}
        onPress={onButtonPress} >
{microphoneHandle?<FaMicrophoneSlash/>:<FaMicrophone/>}
        </Button>
    </div>
}