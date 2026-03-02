import { useQuery } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq"


const productsQu =async ()=>{
    const {data , error} = await supabase111
    .from("tasks_E")
    .select("*");

    if(error)  throw new Error (error)

    return data;
}

export default function Users(){

    const {data,error,isLoading} = useQuery({
        queryKey:["products"],
        queryFn:productsQu
    })

    return(
        <>
        <ul className="h-screen w-full bg-slate-800 rounded-2xl  items-center justify-center ">
        {data?.map((one ,index)=>(
            <li key={index}>{one.name}</li>
        ))}
        </ul>
        
        </>
    )
}