// import video1 from "../Media/VID_805470505_052325_434.mp4"
// import video2 from "../Media/../Media/VID_805471112_192942_354.mp4"
import video3 from "../Media/VID_805490911_221005_197.mp4";
import img1 from "../Media/IMG_20240625_121733_0557.jpg";
import img2 from "../Media/IMG_20240625_121628_0508.jpg";
import img3 from "../Media/IMG_20240625_121705_0744.jpg";
import img4 from "../Media/IMG_20240625_121645_0886.jpg";
import img5 from "../Media/IMG_20240625_121652_0172.jpg";
import audio from "../Media/katy_birthday.mp3"
import "./Front.css"
import { useEffect, useState } from "react";
import AOS from "aos";
import 'aos/dist/aos.css';



export const Front=()=>{
    const [i,setI]=useState(0);
    useEffect(()=>{
        AOS.init({duration:2000});
    },[])

const arr=[img1,img2,img3,img4,img5];

function prev(){
if(i===0){
  setI(arr.length-1);  
}else{
    setI(i-1);
}
}

function next(){
    if(i===arr.length-1){
      setI(0);  
    }else{
        setI(i+1);
    }
    }


    return <div className="Front">
<div className="vid">
<video className="video-background" autoPlay loop muted>
        <source src={video3} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <p>So, you are 18 now. Congratulations on getting closer to the day of your meet and
        greet with God. Even though 
        it's good to be mature and responsible don't grow up too fast okay.</p>
</div>


<audio id="aud" controls autoPlay loop>
 <source src={audio} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
<br />

<h1>Birthday Girl</h1>
<h3>Birthday Girl</h3>
<div className="slider">

    <button onClick={prev}>Prev</button>
<img data-aos="fade-right" className="slideImg" src={arr[i]} alt="err" />
<button onClick={next}>Next</button>

</div>
    </div>
}