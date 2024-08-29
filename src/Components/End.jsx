import "./End.css"
import cartoon from "../Media/cartoon.jpg"
import { useEffect } from "react";
import AOS from "aos";
import 'aos/dist/aos.css';


export const End=()=>{
    useEffect(()=>{
        AOS.init({duration:2000});
    },[])
    return <div className="end">
     
<div className="card">
    <img data-aos="fade-up" src={cartoon} alt="err" />
    <div data-aos="fade-down" ><p>
     Someone who is kind-hearted and full of life. 
    With a beautiful smile that lights up the room and a great
    sense of style that reflects unique personality.
        </p>
        
        <img src="https://t3.ftcdn.net/jpg/04/84/61/14/360_F_484611409_x5BGIPlOLOVNLDkWqnuiVnxj3nrL7exK.jpg" alt="err" /></div>
</div>

    </div>
}