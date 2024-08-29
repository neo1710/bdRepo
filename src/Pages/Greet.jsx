import { useState } from "react"
import "../Components/Greet.css"
import { GreetCard } from "../Components/GreetCard";



export const Greet=()=>{
const [i,setI]=useState(0);
const messages= [{name:"Manya",msg:"Happy birthday bihari litti chokha bitchass nigga. we dont talk much, i still ly🦵🦵🦵You're an adult now tho you look 12 years old, so watch out for pedos(me). anyways, aapan gaand hawai, dusar ke kari dawai💃🏻🔥mwah"},
{name:"Rythima",msg:"Happy 18 Goluaaaaaaaaaaaaaaaaaaa! I wish you have a great great great adulthood and always count on me for anything, haan meri salary bhi udalena future mein🦵 Also, life mein kya karna hai batade, I'm worried for your future and of course you as well🏃🏻‍♀️Jiya ho Bihari ke lala, jiya tu hajaar saala💃🏻💅🏻ILYSM!💞"},
{name:"Gokul",msg:"Happy Birthday Bihariiiiiii. Lil fucking kid is now 18 and shi- :')))) wow! Really hope that this year and the remaining years shall be the best EVERRRR! turn how much ever old you want you still a kid in our eyes so keep listening to what we elder ones are saying kiddo 😋! You one of the best person everrr trisha- and remember that I've always gotchu! have a shit load of fun! HAPPY BIRTHDAY!!!!"},
{name:"Keshav",msg:"HAPPY BIRTHDAY TRISHAAAAAAAAA. Finally 18 lesgooooooooo, no more minor jokes😔. Anyways enjoy the day, have fun. Chini ke saath maze karo, college life ke fun soon starting (unless you end up like Gokul 💀). Hoping waisa na ho💀, have the best year of your life and achieve whatever you set your heart to. You got all our wishes with you and if anything you just hmu, always with you. Once again happy birthday from your fellow majdoor"},
{name:"Neeraj",msg:"Happy Birthday Trisha, You survived 18 years of your life just few hundreds more to go. Adult movies theatre mein dekhne ki excitement, Being more emotional and everything that happens when you are 18 try to experience it in the best way possible. Welcome to hell it's going to be fun Good Luck😈.  "}
]

    return <div className="greet">
        <p style={{position:"static"}}>
            Greetings and Messages from your friends.
        </p>
        <div className="msg">
            <button disabled={i===0?true:false} onClick={()=>{setI(i-1)}} >{"<"}</button>
             <GreetCard name={messages[i].name} message={messages[i].msg}/>
            <button disabled={i===messages.length-1?true:false} onClick={()=>{setI(i+1)}}>{">"}</button>
        </div> <br />

        <p style={{position:"static"}}>
           Special Wishes From Chini-:
        </p>
        <div className="cat">
            <p style={{position:"static" ,color:"white"}}>
Meow Meow! <br />

Happy 18th Birthday, my favorite hooman! 🐾🎂 <br />

It's been purrfectly wonderful growing up with you. We've shared so many snuggles, playtimes, and cozy naps together. You're my best friend, and I couldn't ask for a better companion. Now that you're officially an adult, I know you'll continue to be amazing and kind, just like you've always been.
<br /> Let's celebrate with lots of treats and extra cuddles today!
<br />
Paws and whiskers.
            </p>
        </div>
    </div>
}