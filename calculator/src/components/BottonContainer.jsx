import Button from "./Button"
import style from "./ButtonContainer.module.css"
const ButtonContainer=({onButtonClick})=>{
    const button = ['C', '1', '2', '+', '3', '4', '-', '5', '6', '*', '7', '8', '/', '=', '9', '.','0'];
       return(
        <div className={style.buttonContainer}>
        {
            button.map((buttonsname,index)=>(
                <Button key={index} name={buttonsname} onClick={()=> onButtonClick(buttonsname)}></Button>
            ))
        }
        </div>
       )
}
export default ButtonContainer;