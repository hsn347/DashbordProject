import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq";

export function useAddProduct() {


  return useMutation({
    mutationFn: async (productData) => {
      // 1. جلب بيانات المستخدم الحالية
      const { data: { user }, error: userError } = await supabase111.auth.getUser();

      if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً");

      const USER_ID = user.id;

      const { data: tenantUser, error: tenantError } = await supabase111
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (tenantError || !tenantUser) {
        throw new Error("لم يتم العثور على منشأة مرتبطة بهذا المستخدم.");
      }

      const tenantId = tenantUser.tenant_id;

      // 3. تجهيز البيانات النهائية المطابقة لهيكل الجدول
      const finalData = {
        title: productData.title,
        description: productData.description,
        price: parseFloat(productData.price) || 0, // التأكد من أنه رقم
        currency: productData.currency || 'USD',
        is_published: productData.is_published || false,
        image_url: productData.image_url, // الرابط الذي أرسلناه من الـ Component
        created_by: user.id,
        tenant_id: tenantId,
        slug: productData.title.toLowerCase().trim().replace(/\s+/g, '-'),
        metadata: productData.metadata || {}, // لضمان عدم ترك الحقل فارغاً
        Quantity: productData.Quantity || 0,
        Location: productData.Location || "",
      };

      // 4. الإرسال إلى Supabase
      const { data: insertedData, error: insertError } = await supabase111
        .from("products")
        .insert([finalData])
        .select(); // إضافة select لضمان عودة البيانات المدرجة

      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        throw insertError;
      }

      return insertedData;
    },

  });
}