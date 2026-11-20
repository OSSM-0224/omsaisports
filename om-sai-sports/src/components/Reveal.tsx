import {motion} from "framer-motion";
import type {ReactNode} from "react";
export default function Reveal({children,className=""}:{children:ReactNode;className?:string}){
 return <motion.div className={className} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.15}} transition={{duration:.65,ease:[.22,1,.36,1]}}>{children}</motion.div>
}