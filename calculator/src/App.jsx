import { useState } from 'react'
import style from "./App.module.css"
import Display from './components/Display'
import ButtonContainer from './components/BottonContainer'
function App() {

  const [Displayinput,setDisplayinput]=useState("45");
  const handlekeydown=(event)=>{
    console.log(event);
  }
  const onButtonClick=(buttonname)=>{
    if(buttonname==='C'){
      setDisplayinput("");
    }else if(buttonname==='='){
      const res=eval(Displayinput);
      setDisplayinput(res);
    }else{
      setDisplayinput(Displayinput+buttonname);
    }

  }
  return (
    <div className={style.container}>
      <Display  displayvalue={Displayinput}></Display>
      <ButtonContainer onButtonClick={onButtonClick}></ButtonContainer>
    </div>
  )
}

export default App
