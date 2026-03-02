import { useState, useRef, useEffect } from "react";
import {
    Building2,
    FileText,
    Image,
    Phone,
    Globe,
    MapPin,
    Plus,
    Trash2,
    Save,
    Loader2,
    Camera,
    CheckCircle2,
    XCircle,
    CreditCard,
    Landmark
} from "lucide-react";
import { useAddBrand } from "../hooks/useAddBrand";
import { useGetBrandInfo } from "../hooks/useGetBrandInfo";
import { supabase111 } from "../lib/supabaseq";

export default function BrandInfo() {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        logo_url: "",
        website: "",
        main_branch: "",
        contact_numbers: [""],
        branches: [""],
        is_published: false,
        bank_accounts: [{ bank_name: "", account_number: "", account_currency: "", account_holder: "" }]
    });

    const { data: existingBrand, isLoading: isFetching } = useGetBrandInfo();
    const addBrand = useAddBrand();

    useEffect(() => {
        if (existingBrand && existingBrand.details) {
            const { details } = existingBrand;
            setFormData({
                name: details.name || "",
                description: details.description || "",
                logo_url: details.logo_url || "",
                website: details.website || "",
                main_branch: details.main_branch || "",
                contact_numbers: details.contact_numbers?.length > 0 ? details.contact_numbers : [""],
                branches: details.other_branches?.length > 0 ? details.other_branches : [""],
                is_published: existingBrand.is_published || false,
                bank_accounts: details.bank_accounts?.length > 0 ? details.bank_accounts : [{ bank_name: "", account_number: "", account_currency: "", account_holder: "" }]
            });
            setLogoPreview(details.logo_url);
        }
    }, [existingBrand]);

    const handleFileChange = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            setLogoPreview(URL.createObjectURL(file));

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `brand-logos/${fileName}`;

            const { error: uploadError } = await supabase111.storage
                .from('products-images') // Reusing existing bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase111.storage
                .from('products-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
        } catch (error) {
            alert("Error uploading logo: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAddField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], ""]
        }));
    };

    const handleRemoveField = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleFieldChange = (field, index, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({
            ...prev,
            [field]: newArray
        }));
    };

    const handleBankAccountChange = (index, field, value) => {
        const newAccounts = [...formData.bank_accounts];
        newAccounts[index] = { ...newAccounts[index], [field]: value };

        // Clear currency if bank is not Al-Kuraimi
        if (field === "bank_name" && value !== "الكريمي") {
            newAccounts[index].account_currency = "";
        }

        setFormData(prev => ({
            ...prev,
            bank_accounts: newAccounts
        }));
    };

    const handleAddBankAccount = () => {
        setFormData(prev => ({
            ...prev,
            bank_accounts: [...prev.bank_accounts, { bank_name: "", account_number: "", account_currency: "", account_holder: "" }]
        }));
    };

    const handleRemoveBankAccount = (index) => {
        setFormData(prev => ({
            ...prev,
            bank_accounts: prev.bank_accounts.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const details = {
            name: formData.name,
            description: formData.description,
            logo_url: formData.logo_url,
            website: formData.website,
            main_branch: formData.main_branch,
            contact_numbers: formData.contact_numbers.filter(n => n.trim() !== ""),
            other_branches: formData.branches.filter(b => b.trim() !== ""),
            bank_accounts: formData.bank_accounts.filter(acc => acc.bank_name || acc.account_number)
        };

        addBrand.mutate({
            id: existingBrand?.id,
            brandDetails: details
        }, {
            onSuccess: () => {
                alert("Brand information saved successfully!");
            },
            onError: (err) => {
                alert("Error saving data: " + err.message);
            }
        });
    };

    if (isFetching) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-accent-primary" size={40} /></div>;
    }

    return (
        <div className="space-y-8 mx-auto pb-10 max-w-4xl">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="mb-1 font-bold text-text-primary text-3xl">Brand Information</h1>
                    <p className="text-text-muted">Manage your business brand details and contact info.</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${formData.is_published
                    ? "bg-green-500/10 border-green-500/20 text-green-500"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    }`}>
                    {formData.is_published ? (
                        <>
                            <CheckCircle2 size={16} />
                            <span className="font-semibold text-sm">Published</span>
                        </>
                    ) : (
                        <>
                            <XCircle size={16} />
                            <span className="font-semibold text-sm">Draft / Unpublished</span>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-bg-surface/50 shadow-xl backdrop-blur-xl p-8 border border-border-subtle rounded-3xl">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Brand Identity Section */}
                    <div className="flex md:flex-row flex-col items-center gap-8 pb-8 border-border-subtle/50 border-b">
                        <div className="group relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="flex justify-center items-center bg-bg-main shadow-2xl border-4 border-bg-surface rounded-2xl w-32 h-32 overflow-hidden group-hover:scale-105 transition-transform">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 size={40} className="text-text-muted/30" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 flex justify-center items-center bg-black/50">
                                        <Loader2 className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="right-[-10px] bottom-[-10px] absolute shadow-lg p-2.5 border-4 border-bg-surface rounded-full text-white transition-colors bg-accent-primary group-hover:bg-accent-secondary">
                                <Camera size={16} />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                            <div className="space-y-2">
                                <label className="block ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">Brand Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                    placeholder="Enter your brand name"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">Business Description</label>
                        <textarea
                            rows="4"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary resize-none"
                            placeholder="Tell us about your business..."
                        ></textarea>
                    </div>

                    {/* Contact & Links */}
                    <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">
                                <Globe size={14} /> Website URL
                            </label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">
                                <MapPin size={14} /> Main Branch Location
                            </label>
                            <input
                                type="text"
                                value={formData.main_branch}
                                onChange={e => setFormData({ ...formData, main_branch: e.target.value })}
                                className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                placeholder="City, Street, Building"
                            />
                        </div>
                    </div>

                    {/* Dynamic Contact Numbers */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">
                                <Phone size={14} /> Contact Numbers
                            </label>
                            <button
                                type="button"
                                onClick={() => handleAddField("contact_numbers")}
                                className="flex items-center gap-1 font-bold text-xs transition-colors text-accent-primary hover:text-accent-secondary"
                            >
                                <Plus size={14} /> Add Number
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.contact_numbers.map((number, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="tel"
                                        value={number}
                                        onChange={e => handleFieldChange("contact_numbers", idx, e.target.value)}
                                        className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                        placeholder="Enter phone number"
                                    />
                                    {formData.contact_numbers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveField("contact_numbers", idx)}
                                            className="bg-red-500/10 hover:bg-red-500 p-3.5 rounded-xl text-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Branches */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">
                                <MapPin size={14} /> Other Branches
                            </label>
                            <button
                                type="button"
                                onClick={() => handleAddField("branches")}
                                className="flex items-center gap-1 font-bold text-xs transition-colors text-accent-primary hover:text-accent-secondary"
                            >
                                <Plus size={14} /> Add Branch
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.branches.map((branch, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={branch}
                                        onChange={e => handleFieldChange("branches", idx, e.target.value)}
                                        className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                        placeholder="Branch location"
                                    />
                                    {formData.branches.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveField("branches", idx)}
                                            className="bg-red-500/10 hover:bg-red-500 p-3.5 rounded-xl text-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bank Information Section */}
                    <div className="space-y-6 pt-8 border-border-subtle/50 border-t">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <Landmark className="text-accent-primary" size={20} />
                                <h3 className="font-bold text-text-primary text-lg">Bank Information</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddBankAccount}
                                className="flex items-center gap-1 font-bold text-xs transition-colors text-accent-primary hover:text-accent-secondary"
                            >
                                <Plus size={14} /> Add Account
                            </button>
                        </div>

                        <div className="space-y-8">
                            {formData.bank_accounts.map((account, idx) => (
                                <div key={idx} className="group/acc relative bg-bg-main/30 p-6 border border-border-subtle/30 rounded-2xl">
                                    <div className="top-4 right-4 absolute flex items-center gap-3">
                                        <span className="bg-bg-surface px-2 py-1 rounded-md font-mono text-[10px] text-text-muted uppercase tracking-wider">Account #{idx + 1}</span>
                                        {formData.bank_accounts.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBankAccount(idx)}
                                                className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500 shadow-sm px-3 py-1.5 rounded-lg font-bold text-[10px] text-red-500 hover:text-white uppercase active:scale-95 transition-all"
                                            >
                                                <Trash2 size={14} />
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                                        {/* Bank Name */}
                                        <div className="space-y-2">
                                            <label className="block ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">Bank Name</label>
                                            <select
                                                value={account.bank_name}
                                                onChange={e => handleBankAccountChange(idx, "bank_name", e.target.value)}
                                                className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary transition-all focus:ring-accent-primary select-none"
                                            >
                                                <option value="">Select a Bank</option>
                                                <option value="الكريمي">الكريمي</option>
                                                <option value="العمقي">العمقي</option>
                                                <option value="البسيري">البسيري</option>
                                                <option value="بن دول">بن دول</option>
                                                <option value="بنك التضامن">بنك التضامن</option>
                                            </select>
                                        </div>

                                        {/* Account Number */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">
                                                <CreditCard size={14} /> Account Number
                                            </label>
                                            <input
                                                type="text"
                                                value={account.account_number}
                                                onChange={e => handleBankAccountChange(idx, "account_number", e.target.value)}
                                                className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                                placeholder="Enter account number"
                                            />
                                        </div>

                                        {/* Account Holder Name */}
                                        <div className="space-y-2">
                                            <label className="block ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">Account Holder Name</label>
                                            <input
                                                type="text"
                                                value={account.account_holder}
                                                onChange={e => handleBankAccountChange(idx, "account_holder", e.target.value)}
                                                className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                                placeholder="e.g., Saleh Saeed Ahmed Al-Habshi"
                                            />
                                        </div>

                                        {/* Conditional Currency Field */}
                                        {account.bank_name === "الكريمي" && (
                                            <div className="space-y-2">
                                                <label className="block ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">Account Currency</label>
                                                <select
                                                    value={account.account_currency}
                                                    onChange={e => handleBankAccountChange(idx, "account_currency", e.target.value)}
                                                    className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary transition-all focus:ring-accent-primary"
                                                >
                                                    <option value="">Select Currency</option>
                                                    <option value="YER">Yemeni Rial (YER)</option>
                                                    <option value="SAR">Saudi Rial (SAR)</option>
                                                    <option value="USD">US Dollar (USD)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-6 border-border-subtle border-t">
                        <button
                            type="submit"
                            disabled={addBrand.isPending || uploading}
                            className="flex items-center gap-2 bg-linear-to-r disabled:opacity-70 hover:shadow-lg px-8 py-3.5 rounded-xl font-bold text-white active:scale-95 transition-all from-accent-primary to-accent-secondary hover:shadow-accent-primary/25 disabled:cursor-not-allowed"
                        >
                            {addBrand.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Brand Info
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
