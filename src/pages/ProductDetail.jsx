import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, DollarSign, Image as ImageIcon, Tag, ArrowRight, Loader2, MapPin, Boxes, CheckCircle2, XCircle } from "lucide-react";
import { supabase111 } from "../lib/supabaseq";
import { useUpdateProduct } from "../hooks/useUpdateProduct";
import { useGetBrandInfo } from "../hooks/useGetBrandInfo";

const fetchProduct = async (id) => {
    const { data, error } = await supabase111
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const updateProduct = useUpdateProduct();

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ["product", id],
        queryFn: () => fetchProduct(id),
    });

    const [formData, setFormData] = useState({
        title: "",
        price: 0,
        description: "",
        currency: "USD",
        is_published: false,
        image_url: "",
        Quantity: 0,
        Location: ""
    });

    const { data: brandInfo } = useGetBrandInfo();
    const [selectedLocations, setSelectedLocations] = useState([]);

    const branches = brandInfo?.details?.other_branches || [];
    const mainBranch = brandInfo?.details?.main_branch;
    const allLocations = ["الجميع", ...(mainBranch ? [mainBranch] : []), ...branches];

    const handleLocationToggle = (loc) => {

        let newSelected;
        if (loc === "الجميع") {
            newSelected = selectedLocations.includes("الجميع") ? [] : ["الجميع"];
        } else {
            newSelected = selectedLocations.filter(l => l !== "الجميع");
            if (newSelected.includes(loc)) {
                newSelected = newSelected.filter(l => l !== loc);
            } else {
                newSelected = [...newSelected, loc];
            }
        }
        setSelectedLocations(newSelected);
        setFormData(prev => ({ ...prev, Location: newSelected.join(", ") }));
    };

    useEffect(() => {
        if (product) {
            setFormData({
                title: product.title || "",
                price: product.price || 0,
                description: product.description || "",
                currency: product.currency || "USD",
                is_published: product.is_published || false,
                image_url: product.image_url || "",
                Quantity: product.Quantity || 0,
                Location: product.Location || ""
            });
            setImagePreview(product.image_url);
            if (product.Location) {
                setSelectedLocations(product.Location.split(", ").filter(Boolean));
            }
        }
    }, [product]);

    const handleFileChange = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            setImagePreview(URL.createObjectURL(file));

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase111.storage
                .from('products-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase111.storage
                .from('products-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (error) {
            alert("Error uploading image!");
            console.log(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.price) {
            alert("Please complete basic information");
            return;
        }

        updateProduct.mutate({ id, productData: formData }, {
            onSuccess: () => {
                alert("Product updated successfully");
                navigate("/products");
            }
        });
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-accent-primary" size={40} /></div>;
    if (isError) return <div className="p-10 text-red-500 text-center">Error loading product data</div>;

    return (
        <div className="space-y-8 mx-auto pb-10 max-w-4xl">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/products")}
                    className="bg-bg-surface p-3 border border-border-subtle hover:border-accent-primary rounded-full text-text-secondary hover:text-text-primary transition-all"
                >
                    <ArrowRight size={20} />
                </button>
                <div>
                    <h1 className="font-bold text-text-primary text-2xl">Edit Product</h1>
                    <p className="text-text-muted text-sm">Update product details and settings</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="gap-8 grid grid-cols-1 md:grid-cols-3">
                {/* Left Section: Basic Data */}
                <div className="space-y-6 md:col-span-2 bg-bg-surface shadow-sm p-8 border border-border-subtle rounded-3xl">
                    <h3 className="flex items-center gap-2 font-bold text-text-primary text-lg">
                        <Package size={20} className="text-accent-primary" /> Product Information
                    </h3>

                    <div className="space-y-2">
                        <label className="font-medium text-text-secondary text-sm">Product Title</label>
                        <div className="relative">
                            <Tag className="top-3.5 left-3 absolute text-text-muted" size={18} />
                            <input
                                className="bg-input-bg py-3 pr-4 pl-10 border border-transparent focus:border-accent-primary rounded-xl outline-none focus:ring-1 w-full placeholder-text-muted text-text-primary transition-all focus:ring-accent-primary"
                                placeholder="e.g. iPhone 15 Pro"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="font-medium text-text-secondary text-sm">Description</label>
                        <textarea
                            value={formData.description}
                            className="bg-input-bg p-4 border border-transparent focus:border-accent-primary rounded-xl outline-none focus:ring-1 w-full h-32 placeholder-text-muted text-text-primary transition-all focus:ring-accent-primary resize-none"
                            placeholder="Detailed description..."
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="gap-4 grid grid-cols-2">
                        <div className="space-y-2">
                            <label className="font-medium text-text-secondary text-sm">Price</label>
                            <div className="relative">
                                <div className="top-3.5 left-3 absolute text-text-muted">
                                    <DollarSign size={18} />
                                </div>
                                <input
                                    value={formData.price}
                                    type="number"
                                    className="bg-input-bg py-3 pr-4 pl-10 border border-transparent focus:border-accent-primary rounded-xl outline-none w-full text-text-primary transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                                    placeholder="0.00"
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-medium text-text-secondary text-sm">Currency</label>
                            <select
                                value={formData.currency}
                                className="bg-input-bg px-4 py-3 border border-transparent focus:border-accent-primary rounded-xl outline-none w-full text-text-primary cursor-pointer"
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="SAR">SAR (ر.س)</option>
                            </select>
                        </div>
                    </div>

                    <div className="gap-4 grid grid-cols-2">
                        <div className="space-y-2">
                            <label className="font-medium text-text-secondary text-sm">Quantity</label>
                            <div className="relative">
                                <Boxes className="top-3.5 left-3 absolute text-text-muted" size={18} />
                                <input
                                    className="bg-input-bg py-3 pr-4 pl-10 border border-border-subtle focus:border-accent-primary rounded-xl outline-none focus:ring-1 w-full text-text-primary transition-all focus:ring-accent-primary"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.Quantity}
                                    onChange={(e) => setFormData({ ...formData, Quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-medium text-text-secondary text-sm">Locations</label>
                            <div className="relative">
                                <MapPin className="top-3.5 left-3 absolute text-text-muted" size={18} />
                                <div className="flex flex-wrap gap-1 bg-input-bg py-1.5 pr-4 pl-10 border border-border-subtle border-transparent rounded-xl min-h-[46px]">
                                    {allLocations.map((loc) => (
                                        <button
                                            key={loc}
                                            type="button"
                                            onClick={() => handleLocationToggle(loc)}
                                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${selectedLocations.includes(loc)
                                                ? "bg-accent-primary text-white"
                                                : "bg-bg-surface text-text-muted hover:text-text-primary border border-border-subtle"
                                                }`}
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Settings */}
                <div className="space-y-6">
                    <div className="space-y-6 bg-bg-surface shadow-sm p-6 border border-border-subtle rounded-3xl">
                        <h3 className="font-bold text-text-primary">Status & Visibility</h3>

                        <div className="group flex justify-between items-center bg-bg-surface-hover p-4 border border-border-subtle rounded-xl transition-all">
                            <span className="font-medium text-text-secondary text-sm">Publish Status</span>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${formData.is_published
                                ? "bg-green-500/10 border-green-500/20 text-green-500"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                }`}>
                                {formData.is_published ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                {formData.is_published ? "Published" : "Draft"}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-text-primary">Product Image</h3>
                            <div
                                onClick={() => fileInputRef.current.click()}
                                className="group relative flex flex-col justify-center items-center bg-input-bg border-2 border-border-subtle hover:border-accent-primary border-dashed rounded-2xl h-48 overflow-hidden transition-all cursor-pointer"
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                        <div className="absolute inset-0 flex justify-center items-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="font-bold text-white text-sm">Change Image</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-4 text-center">
                                        {uploading ? (
                                            <Loader2 className="mx-auto animate-spin text-accent-primary" size={32} />
                                        ) : (
                                            <>
                                                <div className="flex justify-center items-center bg-bg-surface mx-auto mb-3 rounded-full w-12 h-12 text-text-muted group-hover:scale-110 transition-all group-hover:text-accent-primary">
                                                    <ImageIcon size={24} />
                                                </div>
                                                <p className="font-medium text-text-muted text-sm">Click to upload</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <button
                        className="bg-linear-to-r disabled:opacity-70 hover:shadow-lg py-4 rounded-xl w-full font-bold text-white active:scale-95 transition-all duration-300 from-accent-gradient-start to-accent-gradient-end hover:shadow-accent-primary/25 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={updateProduct.isPending || uploading}
                    >
                        {updateProduct.isPending ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
