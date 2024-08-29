
import { useNavigate } from "react-router-dom";
import "./Nav.css";


export const Nav=()=>{
let navigate=useNavigate()

function Nav(){
navigate("/greets");
}

function home(){
    navigate("/")
}

    return <div className="Nav">
<h1 onClick={home}>Happy Birthday Trisha</h1>
<h4 onClick={home}>Happy Birthday Trisha</h4>

<button onClick={Nav}>Greets</button>

    </div>

}