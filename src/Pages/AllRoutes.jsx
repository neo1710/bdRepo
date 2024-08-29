import {Route, Routes} from "react-router-dom";
import { Main } from "../Components/Main";
import { Greet } from "./Greet";

export const AllRoutes=()=>{


    return <Routes>
<Route path="/" element={<Main/>} />
<Route path="/greets" element={<Greet/>} />
    </Routes>
}