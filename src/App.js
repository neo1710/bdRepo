
import './App.css';
import { Nav } from './Components/Nav';
import { AllRoutes } from './Pages/AllRoutes';
import { Footer } from './Components/Footer';

function App() {
  return (
    <div className="App">
     <Nav/>
     <AllRoutes/>
     <Footer/>
    </div>
  );
}

export default App;
