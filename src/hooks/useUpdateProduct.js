import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq";

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, productData }) => {
            // 1. جلب بيانات المستخدم الحالية للتحقق من الأمان
            const { data: { user }, error: userError } = await supabase111.auth.getUser();

            if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً");

            // 2. تحديث البيانات في Supabase
            // نستخدم الـ ID لضمان تحديث المنتج الصحيح
            // السياسات (RLS) في Supabase ستتولى التأكد من أن المستخدم له صلاحية التعديل
            const { data, error } = await supabase111
                .from("products")
                .update({
                    title: productData.title,
                    description: productData.description,
                    price: parseFloat(productData.price) || 0,
                    currency: productData.currency,
                    is_published: productData.is_published,
                    image_url: productData.image_url,
                    slug: productData.title.toLowerCase().trim().replace(/\s+/g, '-'),
                    metadata: productData.metadata || {},
                    Quantity: productData.Quantity || 0,
                    Location: productData.Location || "",
                })
                .eq("id", id)
                .select();

            if (error) {
                console.error("Supabase Update Error:", error);
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            // تحديث الكاش لضمان ظهور البيانات الجديدة في كل مكان
            queryClient.invalidateQueries(["products"]);
        },
    });
}
