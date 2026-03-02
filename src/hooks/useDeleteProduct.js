import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq";


export function useDeleteProduct(){
    const queryClient = useQueryClient();


    return useMutation({
        mutationFn:async(ID_Prod)=>{
            const {error} = await supabase111.from("products").delete().eq("id",ID_Prod);

            if(error)throw new Error (error);
        },
        onSuccess:async()=>{
            await queryClient.invalidateQueries()
        }
    })
}