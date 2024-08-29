import "./Greet.css";
// import video3 from "../Media/VID_805471112_192942_354.mp4"


export const GreetCard=({name,message})=>{


    return <div className="gCard">
      <h2 style={{color:"orange"}}>{name} -:</h2>
<p style={{position:"static"}}>{message}</p>
    </div>
}