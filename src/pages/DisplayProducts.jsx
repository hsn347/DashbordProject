import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq"
import { DollarSign, ZapOff, Radio, SaudiRiyal, Package, Search, X, Filter, SlidersHorizontal } from "lucide-react";
import { useDeleteProduct } from "../hooks/useDeleteProduct";
import { useState } from "react";



const queryPro = async () => {
    const { data, error } = await supabase111.from("products").select("*");
    if (error) throw new Error(error)
    return data;
}


export default function DisplayProducts() {
    const navigate = useNavigate();
    const { data, isError, isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: queryPro,
    });
    const deleteProd = useDeleteProduct()
    const [searchQuery, setSearchQuery] = useState("");

    // Filter states
    const [sortBy, setSortBy] = useState(""); // "date-new", "date-old", "price-asc", "price-desc"
    const [showPublished, setShowPublished] = useState("all"); // "all", "published", "unpublished"
    const [showWithImage, setShowWithImage] = useState("all"); // "all", "with-image", "without-image"

    // Apply all filters and sorting
    const filteredProducts = data?.filter((product) => {
        // Search filter
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || (
            product.title?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.Location?.toLowerCase().includes(query)
        );

        // Publication status filter
        const matchesPublished =
            showPublished === "all" ||
            (showPublished === "published" && product.is_published) ||
            (showPublished === "unpublished" && !product.is_published);

        // Image availability filter
        const matchesImage =
            showWithImage === "all" ||
            (showWithImage === "with-image" && product.image_url) ||
            (showWithImage === "without-image" && !product.image_url);

        return matchesSearch && matchesPublished && matchesImage;
    })
        ?.sort((a, b) => {
            // Apply sorting
            if (sortBy === "date-new") {
                return new Date(b.created_at) - new Date(a.created_at);
            } else if (sortBy === "date-old") {
                return new Date(a.created_at) - new Date(b.created_at);
            } else if (sortBy === "price-asc") {
                return (a.price || 0) - (b.price || 0);
            } else if (sortBy === "price-desc") {
                return (b.price || 0) - (a.price || 0);
            }
            return 0;
        });

    if (isError) return <div className="">حدث خطا في جلب البيانات</div>

    if (isLoading) return <div className=""> جاري التحميل ... </div>

    return (
        <>
            {/* Search and Filters Section */}
            <div className="space-y-4 mb-6">
                {/* Search Bar */}
                <div className="group relative">
                    <div className="left-4 absolute inset-y-0 flex items-center pointer-events-none">
                        <Search size={20} className="text-text-muted transition-colors group-focus-within:text-accent-primary" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن منتج بالاسم أو الوصف أو الموقع..."
                        className="bg-bg-surface focus:shadow-lg py-4 pr-12 pl-12 border border-border-subtle hover:border-accent-primary/30 focus:border-accent-primary rounded-2xl focus:outline-none w-full font-medium text-text-primary placeholder:text-text-muted transition-all duration-300 focus:shadow-accent-primary/10"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="right-4 absolute inset-y-0 flex items-center text-text-muted transition-colors hover:text-accent-primary"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-text-muted">
                        <SlidersHorizontal size={18} />
                        <span className="font-medium text-sm">الفلاتر:</span>
                    </div>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-bg-surface px-4 py-2 border border-border-subtle hover:border-accent-primary/30 focus:border-accent-primary rounded-xl focus:outline-none font-medium text-text-primary text-sm transition-all cursor-pointer"
                    >
                        <option value="">الترتيب الافتراضي</option>
                        <option value="date-new">الأحدث أولاً</option>
                        <option value="date-old">الأقدم أولاً</option>
                        <option value="price-asc">السعر: تصاعدي</option>
                        <option value="price-desc">السعر: تنازلي</option>
                    </select>

                    {/* Publication Status */}
                    <select
                        value={showPublished}
                        onChange={(e) => setShowPublished(e.target.value)}
                        className="bg-bg-surface px-4 py-2 border border-border-subtle hover:border-accent-primary/30 focus:border-accent-primary rounded-xl focus:outline-none font-medium text-text-primary text-sm transition-all cursor-pointer"
                    >
                        <option value="all">كل المنتجات</option>
                        <option value="published">منشور فقط</option>
                        <option value="unpublished">غير منشور فقط</option>
                    </select>

                    {/* Image Availability */}
                    <select
                        value={showWithImage}
                        onChange={(e) => setShowWithImage(e.target.value)}
                        className="bg-bg-surface px-4 py-2 border border-border-subtle hover:border-accent-primary/30 focus:border-accent-primary rounded-xl focus:outline-none font-medium text-text-primary text-sm transition-all cursor-pointer"
                    >
                        <option value="all">كل الصور</option>
                        <option value="with-image">بصورة فقط</option>
                        <option value="without-image">بدون صورة فقط</option>
                    </select>

                    {/* Clear All Filters */}
                    {(sortBy || showPublished !== "all" || showWithImage !== "all" || searchQuery) && (
                        <button
                            onClick={() => {
                                setSortBy("");
                                setShowPublished("all");
                                setShowWithImage("all");
                                setSearchQuery("");
                            }}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 px-4 py-2 rounded-xl font-semibold text-red-500 hover:text-white text-sm transition-all duration-300"
                        >
                            <X size={16} />
                            مسح الكل
                        </button>
                    )}
                </div>

                {/* Results Count */}
                {(searchQuery || sortBy || showPublished !== "all" || showWithImage !== "all") && (
                    <p className="text-text-muted text-sm">
                        تم العثور على <span className="font-bold text-accent-primary">{filteredProducts?.length || 0}</span> منتج
                    </p>
                )}
            </div>

            <div className="flex flex-col space-y-4">
                {filteredProducts?.map((product) => (
                    <div key={product.id}
                        className="group flex justify-between items-center bg-bg-surface p-5 border border-border-subtle hover:border-accent-primary/30 rounded-2xl transition-all cursor-pointer"
                        onClick={() => navigate(`/products/${product.id}`)}>
                        <div className="flex items-center gap-6">
                            {/* Product Image or Fallback Icon */}
                            <div className="flex justify-center items-center bg-bg-main border border-border-subtle rounded-xl w-16 h-16 overflow-hidden shrink-0">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package size={24} className="text-text-muted/40" />
                                )}
                            </div>

                            <div className="flex flex-col">
                                <h2 className="font-bold text-text-primary transition-colors group-hover:text-accent-primary">{product.title}</h2>
                                <p className="max-w-xs text-text-muted text-sm truncate">{product.description}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="bg-bg-main px-2 py-0.5 border border-border-subtle rounded text-text-muted text-xs">
                                        Qty: {product.Quantity || 0}
                                    </span>
                                    {product.Location && (
                                        <span className="bg-bg-main px-2 py-0.5 border border-border-subtle rounded max-w-[150px] text-text-muted text-xs truncate">
                                            {product.Location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <p className="flex items-center bg-bg-main px-3 py-1.5 border border-border-subtle rounded-lg font-bold text-text-primary">
                                {product.price}
                                <span className="ml-1 text-text-muted">
                                    {product.currency === "USD" ? <DollarSign size={15} /> : <SaudiRiyal size={16} />}
                                </span>
                            </p>

                            <div className="flex items-center gap-4">
                                <div>
                                    {product.is_published ?
                                        <div className="bg-green-500/10 p-2 rounded-full text-green-500"><Radio size={20} /></div> :
                                        <div className="p-2 rounded-full bg-text-muted/10 text-text-muted"><ZapOff size={20} /></div>
                                    }
                                </div>
                                <button className="bg-red-500/10 hover:bg-red-500 px-4 py-2 rounded-xl font-semibold text-red-500 hover:text-white text-sm transition-all duration-300"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteProd.mutate(product.id)
                                    }}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}