
import style from "./ButtonContainer.module.css"
const Button = ({ name,onClick }) => {
    return <button className={style.button} onClick={onClick}>{name} </button>;
  };
  export default Button;
  