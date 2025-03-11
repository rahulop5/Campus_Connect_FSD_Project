const btns=document.getElementsByClassName("btn");
const att_divs=document.getElementsByClassName("d_attendance");

let curratt=0

const btnarray=Array.from(btns);
btnarray.forEach((btn, index)=>{
    btn.addEventListener("click", ()=>{
        att_divs[curratt].classList.remove("active");
        att_divs[curratt].style.display = "none";
        att_divs[index].style.display = "flex";
        setTimeout(() => {
            att_divs[index].classList.add("active");
        }, 100);
        curratt=index;
    });
});