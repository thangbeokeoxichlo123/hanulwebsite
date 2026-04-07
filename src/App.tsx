/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  MapPin, 
  Clock, 
  Facebook, 
  ChevronRight, 
  Award, 
  TrendingUp, 
  UserCheck, 
  Zap,
  CheckCircle2,
  Users,
  Calendar,
  Star,
  Info,
  Send,
  Loader2,
  CheckCircle
} from "lucide-react";
import React, { useState, useEffect, Component, ReactNode } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp, doc, getDocFromServer } from "firebase/firestore";

// --- Firebase Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorInfo: error.message };
  }

  public render() {
    const { hasError, errorInfo } = this.state;
    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Đã có lỗi xảy ra</h2>
            <p className="text-slate-400 mb-8">Vui lòng tải lại trang hoặc liên hệ hotline nếu vấn đề tiếp tục.</p>
            <pre className="bg-slate-800 p-4 rounded-xl text-xs text-left overflow-auto max-h-40 mb-8">
              {errorInfo}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-red-600 rounded-xl font-black uppercase tracking-widest"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// Vibrant color palette inspired by Taekwondo (Red, Blue, White, Black)
const COLORS = {
  primary: "#EF4444", // Vibrant Red
  secondary: "#3B82F6", // Vibrant Blue
  accent: "#FACC15", // Bright Yellow
  dark: "#0F172A", // Slate 900
  light: "#FFFFFF",
};

const SERVICES = [
  {
    title: "Tập luyện Taekwondo",
    description: "Chương trình đào tạo bài bản từ cơ bản đến nâng cao cho mọi lứa tuổi.",
    icon: <Award className="w-6 h-6" />,
  },
  {
    title: "Tăng chiều cao",
    description: "Các bài tập chuyên biệt giúp kích thích phát triển chiều cao tối ưu cho trẻ.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    title: "Giảm cân & Thể lực",
    description: "Đốt cháy năng lượng hiệu quả qua các bài tập võ thuật cường độ cao.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: "Dạy kèm & Nhào lộn",
    description: "Kỹ thuật nhào lộn nghệ thuật và các lớp dạy kèm kỹ năng đặc biệt.",
    icon: <UserCheck className="w-6 h-6" />,
  },
];

const LOCATIONS = [
  {
    id: "nguyen-chanh",
    name: "08 Nguyễn Chánh",
    address: "08 Nguyễn Chánh, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng",
    phones: ["0935507000", "0812033444"],
    schedule: {
      morning: [
        { time: "8:30 - 10:00", label: "Lớp học kèm & Nâng cao" },
        { time: "9:30 - 10:30", label: "Lớp học kèm & Nâng cao" },
        { time: "10:30 - 11:00", label: "Lớp học kèm & Nâng cao" },
      ],
      afternoon: [
        { time: "15:30 - 17:00", label: "Lớp phong trào & Theo nhóm" },
        { time: "16:00 - 17:30", label: "Lớp phong trào & Theo nhóm" },
        { time: "17:30 - 19:30", label: "Lớp phong trào & Theo nhóm" },
      ],
      note: "Thứ 7 và Chủ nhật linh động nhiều buổi hơn. Có các lớp tập tự do kèm riêng."
    },
    pricing: [
      { sessions: "8 buổi / tháng", price: "350.000 đ" },
      { sessions: "12 buổi / tháng", price: "400.000 đ" },
      { sessions: "16 buổi / tháng", price: "450.000 đ" },
      { sessions: "Tập tự do", price: "500.000 đ / tháng" },
    ],
    groupPrice: "3.000.000 đ / nhóm",
    hasAddon: true
  },
  {
    id: "ly-thai-tong",
    name: "17 Lý Thái Tông",
    address: "17 Lý Thái Tông, Đà Nẵng",
    phones: ["0935507000", "0812033444"], // Assuming same phones if not provided
    schedule: {
      morning: [
        { time: "8:30 - 10:00", label: "Lớp học kèm & Nâng cao" },
        { time: "9:30 - 10:30", label: "Lớp học kèm & Nâng cao" },
        { time: "10:30 - 11:00", label: "Lớp học kèm & Nâng cao" },
      ],
      afternoon: [
        { time: "15:30 - 17:00", label: "Lớp phong trào & Theo nhóm" },
        { time: "16:00 - 17:30", label: "Lớp phong trào & Theo nhóm" },
        { time: "17:30 - 19:30", label: "Lớp phong trào & Theo nhóm" },
      ],
      note: "Thứ 7 và Chủ nhật linh động nhiều buổi hơn. Có các lớp tập tự do kèm riêng."
    },
    pricing: [
      { sessions: "8 buổi / tháng", price: "350.000 đ" },
      { sessions: "12 buổi / tháng", price: "400.000 đ" },
      { sessions: "16 buổi / tháng", price: "450.000 đ" },
      { sessions: "Tập tự do (Tất cả các ngày)", price: "700.000 đ / tháng" },
    ],
    groupPrice: "3.000.000 đ / nhóm",
    hasAddon: false
  },
  {
    id: "nguyen-tat-thanh",
    name: "27 Nguyễn Tất Thành",
    address: "27 Nguyễn Tất Thành, Đà Nẵng",
    phones: ["0932512520"],
    schedule: {
      morning: [
        { time: "8:30 - 10:00", label: "Lớp học kèm & Nâng cao" },
        { time: "9:30 - 10:30", label: "Lớp học kèm & Nâng cao" },
        { time: "10:30 - 11:00", label: "Lớp học kèm & Nâng cao" },
      ],
      afternoon: [
        { time: "15:30 - 17:00", label: "Lớp phong trào & Theo nhóm" },
        { time: "16:00 - 17:30", label: "Lớp phong trào & Theo nhóm" },
        { time: "17:30 - 19:30", label: "Lớp phong trào & Theo nhóm" },
      ],
      note: "Thứ 7 và Chủ nhật linh động nhiều buổi hơn. Có các lớp tập tự do kèm riêng."
    },
    pricing: [
      { sessions: "8 buổi / tháng", price: "500.000 đ" },
      { sessions: "12 buổi / tháng", price: "650.000 đ" },
      { sessions: "16 buổi / tháng", price: "750.000 đ" },
      { sessions: "Tập tự do (Tất cả các ngày)", price: "800.000 đ / tháng" },
    ],
    groupPrice: "3.000.000 đ / nhóm",
    hasAddon: true
  },
  {
    id: "dinh-liet",
    name: "60 Đinh Liệt",
    address: "60 Đinh Liệt, Đà Nẵng",
    phones: ["0935357966", "0838357966"],
    schedule: {
      morning: [],
      afternoon: [
        { time: "15:30 - 17:00", label: "Lớp phong trào & Theo nhóm" },
        { time: "16:00 - 17:30", label: "Lớp phong trào & Theo nhóm" },
        { time: "17:30 - 19:30", label: "Lớp phong trào & Theo nhóm" },
        { time: "18:30 - 20:00", label: "Lớp phong trào & Theo nhóm" },
      ],
      note: "Thứ 7 và Chủ nhật chiều: 15:30 - 17:00, 16:00 - 17:30, 17:30 - 19:30, 18:30 - 20:00. Có các lớp tập tự do kèm riêng."
    },
    pricing: [
      { sessions: "8 buổi / tháng", price: "300.000 đ" },
      { sessions: "12 buổi / tháng", price: "400.000 đ" },
      { sessions: "16 buổi / tháng", price: "500.000 đ" },
      { sessions: "Tập tự do (Tất cả các ngày)", price: "800.000 đ / tháng" },
    ],
    groupPrice: "2.000.000 đ / nhóm",
    hasAddon: true
  },
  {
    id: "hoa-lien",
    name: "19E Nguyễn Văn Cừ - Lô 1032 Trần Quốc Tản",
    address: "19E Nguyễn Văn Cừ - Lô 1032 Trần Quốc Tản (Khu TĐC Hoà Liên 4), Đà Nẵng",
    phones: ["0355354501", "0585311706"],
    schedule: {
      morning: [],
      afternoon: [
        { time: "16:00 - 17:30", label: "Ca 1" },
        { time: "17:30 - 19:00", label: "Ca 2" },
      ],
      note: "Nghỉ 1 ngày vào Chủ nhật cuối cùng của tháng."
    },
    pricing: [
      { sessions: "Gói Cơ bản (3-4 buổi/tuần)", price: "350.000 VNĐ" },
      { sessions: "Gói Buffet (tự do)", price: "400.000 VNĐ" },
    ],
    groupPrice: "Liên hệ",
    hasAddon: false
  },
  {
    id: "nguyen-ba-phat",
    name: "23 Nguyễn Bá Phát",
    address: "23 Nguyễn Bá Phát, Đà Nẵng",
    phones: ["0355354501", "0585311706"],
    schedule: {
      morning: [],
      afternoon: [
        { time: "15:30 - 17:00", label: "Ca 1" },
        { time: "17:00 - 18:30", label: "Ca 2" },
        { time: "18:30 - 20:00", label: "Ca 3" },
      ],
      note: "Nghỉ 1 ngày vào Chủ nhật cuối cùng của tháng."
    },
    pricing: [
      { sessions: "Gói Cơ bản (3 buổi/tuần)", price: "350.000 VNĐ" },
      { sessions: "Gói Nâng cao (4 buổi/tuần)", price: "400.000 VNĐ" },
      { sessions: "Gói Buffet (tự do)", price: "450.000 VNĐ" },
    ],
    groupPrice: "Liên hệ",
    hasAddon: false
  }
];

const PROMOTIONS = [
  {
    title: "Gói Dài Hạn",
    items: [
      "Đăng ký 3 tháng: giảm 5% học phí",
      "Đăng ký 4 tháng: giảm 7% học phí",
      "Đăng ký 6 tháng: giảm 10% học phí",
      "Đăng ký 1 năm: giảm 15% học phí"
    ],
    icon: <Calendar className="w-6 h-6" />
  },
  {
    title: "Học Viên Mới",
    items: [
      "Miễn phí học phí Tháng đầu tiên",
      "HOẶC Tặng kèm 01 Đồng phục Taekwondo"
    ],
    icon: <Star className="w-6 h-6" />
  },
  {
    title: "Gia Đình (3+ HV)",
    items: [
      "Đăng ký 6 tháng: giảm 15% học phí",
      "Đăng ký 1 năm: giảm 20% học phí"
    ],
    icon: <Users className="w-6 h-6" />
  },
  {
    title: "Giới Thiệu Bạn",
    items: [
      "Giới thiệu 1 HV: giảm 10% tháng tiếp theo",
      "Giới thiệu 3 HV: giảm 30% + 1 buổi free + Quà tặng (áo/dây đai)"
    ],
    icon: <UserCheck className="w-6 h-6" />
  }
];

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    location: LOCATIONS[0].name,
    classType: "8 buổi / tháng",
    additionalServices: [] as string[],
    isToddler: false,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === "location") {
      const loc = LOCATIONS.find(l => l.name === value);
      if (loc) setSelectedLocation(loc);
    }

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (service: string) => {
    setFormData(prev => {
      const services = prev.additionalServices.includes(service)
        ? prev.additionalServices.filter(s => s !== service)
        : [...prev.additionalServices, service];
      return { ...prev, additionalServices: services };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const path = 'registrations';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
      setFormData({
        fullName: "",
        phoneNumber: "",
        location: selectedLocation.name,
        classType: "8 buổi / tháng",
        additionalServices: [],
        isToddler: false,
        message: "",
      });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-red-100 selection:text-red-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              {/* Logo placeholder - using input_file_0.png as guessed path */}
              <img
  src="Logo.png"
  alt="Hanul Logo"
  className="h-14 w-auto object-contain"
  onError={(e) => {
    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/hanul-logo/200/200";
  }}
/>
              <div className="flex flex-col">
                <span className="font-black tracking-tighter text-2xl leading-none text-red-600">HANUL</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">TAEKWONDO ĐÀ NẴNG</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
              <button onClick={() => scrollToSection('services')} className="hover:text-red-600 transition-colors">Dịch vụ</button>
              <button onClick={() => scrollToSection('schedule')} className="hover:text-red-600 transition-colors">Lịch tập</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-red-600 transition-colors">Học phí</button>
              <button onClick={() => scrollToSection('contact')} className="hover:text-red-600 transition-colors">Liên hệ</button>
              <a 
                href="tel:0935507000" 
                className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-200"
              >
                <Phone className="w-4 h-4" /> 0935.507.000
              </a>
            </div>
            <div className="md:hidden">
               <a href="tel:0935507000" className="p-3 bg-red-600 text-white rounded-full shadow-lg"><Phone className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - More Vibrant & Immersive */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden bg-slate-900 text-white">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#EF4444_0%,transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#3B82F6_0%,transparent_50%)]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex flex-wrap items-center gap-2 mb-8">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setFormData(prev => ({ ...prev, location: loc.name }));
                    }}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                      selectedLocation.id === loc.id 
                      ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20" 
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
              <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter mb-10 uppercase">
                DA NANG <br />
                <span className="text-red-500">HANUL</span> <br />
                <span className="text-blue-500">TAEKWONDO</span>
              </h1>
              <p className="text-xl text-slate-300 mb-12 max-w-lg leading-relaxed font-medium">
                Hệ thống Trung tâm Taekwondo Hanul Đà Nẵng. 
                Rèn luyện thể chất, ý chí và kỹ năng tự vệ trong môi trường năng động nhất.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="px-10 py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 group shadow-xl shadow-red-900/20"
                >
                  ĐĂNG KÝ TẬP THỬ <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => scrollToSection('schedule')}
                  className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 font-black rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-3"
                >
                  XEM LỊCH TẬP
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mt-20 lg:mt-0 relative"
            >
              {/* Main Action Image */}
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] border-4 border-white/10">
                <img 
                  src="1.jpg" 
                  alt="Taekwondo Class Action" 
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-10 left-10">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-1 h-red-500 bg-red-500"></div>
                    <p className="text-red-500 font-black uppercase tracking-widest text-sm">Lớp tập phong trào</p>
                  </div>
                  <p className="text-4xl font-black italic uppercase tracking-tighter">Sôi động & Quyết tâm</p>
                </div>
              </div>
              
              {/* Floating Small Image - "Entering the class" feel */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -left-10 w-48 h-48 rounded-3xl overflow-hidden border-4 border-red-600 shadow-2xl z-20 hidden md:block"
              >
                <img 
                  src="2.png" 
                  alt="Class Entry" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Toddlers Section */}
      <section id="toddlers" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-blue-50">
                <img 
                  src="https://picsum.photos/seed/taekwondo-kids/800/1000" 
                  alt="Toddler Taekwondo" 
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-10 right-10 bg-accent text-slate-900 p-6 rounded-3xl shadow-xl rotate-12">
                  <p className="text-xs font-black uppercase tracking-widest mb-1">Ưu đãi mới</p>
                  <p className="text-3xl font-black tracking-tighter">GIẢM 50%</p>
                  <p className="text-sm font-bold">Tháng đầu tiên</p>
                </div>
              </div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-16 lg:mt-0"
            >
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-blue-600 mb-4">Lớp mầm non</h2>
              <h3 className="text-5xl font-black uppercase tracking-tighter mb-8 leading-none">
                Khởi đầu <span className="text-red-600">vững chắc</span> <br /> cho bé từ 3 - 5 tuổi
              </h3>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
                Chương trình Taekwondo Toddler được thiết kế riêng biệt để phát triển kỹ năng vận động, 
                sự tập trung và tính kỷ luật cho trẻ nhỏ thông qua các trò chơi vận động vui nhộn.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-sm mb-1">Phát triển thể chất</h4>
                    <p className="text-xs text-slate-500">Tăng cường sự dẻo dai và thăng bằng.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-sm mb-1">Rèn luyện sự tự tin</h4>
                    <p className="text-xs text-slate-500">Giúp bé dạn dĩ hơn trong giao tiếp.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-3xl text-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black uppercase tracking-widest text-xs opacity-60">Học phí lớp mầm non</span>
                  <span className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Hot</span>
                </div>
                <p className="text-4xl font-black tracking-tighter mb-2">450.000 đ <span className="text-lg opacity-50">/ tháng</span></p>
                <p className="text-sm text-blue-400 font-bold italic">* Áp dụng cho tất cả các cơ sở</p>
                <button 
                  onClick={() => {
                    setFormData(prev => ({ ...prev, isToddler: true }));
                    scrollToSection('contact');
                  }}
                  className="w-full mt-8 py-4 bg-white text-slate-900 font-black rounded-xl hover:bg-blue-50 transition-all uppercase tracking-widest text-sm"
                >
                  Đăng ký cho bé ngay
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <section id="promotions" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#EF4444_0%,transparent_40%)] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-accent mb-4">Ưu đãi đặc biệt</h2>
            <p className="text-5xl font-black uppercase tracking-tighter">Chương trình khuyến mãi</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROMOTIONS.map((promo, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all group"
              >
                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {promo.icon}
                </div>
                <h4 className="text-xl font-black uppercase mb-6 tracking-tight">{promo.title}</h4>
                <ul className="space-y-4">
                  {promo.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 p-10 bg-gradient-to-r from-red-600 to-blue-600 rounded-[3rem] text-center">
            <h4 className="text-3xl font-black uppercase tracking-tighter mb-4">Đăng ký ngay hôm nay để nhận ưu đãi!</h4>
            <p className="text-lg font-medium opacity-90 mb-10 max-w-2xl mx-auto">
              Các chương trình khuyến mãi có thể kết hợp với nhau. Liên hệ hotline để được tư vấn gói học phí tối ưu nhất cho gia đình bạn.
            </p>
            <button 
              onClick={() => scrollToSection('contact')}
              className="px-12 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-accent transition-all uppercase tracking-widest shadow-2xl"
            >
              Nhận tư vấn ưu đãi
            </button>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-red-600 mb-4">Thời gian biểu</h2>
            <p className="text-5xl font-black uppercase tracking-tighter">Lịch tập luyện tại {selectedLocation.name}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10">
            {/* Morning */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Buổi Sáng</h3>
              </div>
              <div className="space-y-6">
                {selectedLocation.schedule.morning.length > 0 ? (
                  selectedLocation.schedule.morning.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
                      <span className="text-xl font-black text-red-600">{item.time}</span>
                      <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">{item.label}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic font-medium">Không có lớp buổi sáng</p>
                )}
              </div>
            </motion.div>
            
            {/* Afternoon */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Buổi Chiều</h3>
              </div>
              <div className="space-y-6">
                {selectedLocation.schedule.afternoon.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
                    <span className="text-xl font-black text-blue-600">{item.time}</span>
                    <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          
          <div className="mt-12 bg-red-600 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Info className="w-8 h-8" />
              <p className="font-bold text-lg">{selectedLocation.schedule.note}</p>
            </div>
            <button 
              onClick={() => scrollToSection('contact')}
              className="px-8 py-4 bg-white text-red-600 font-black rounded-xl hover:bg-slate-100 transition-all uppercase tracking-widest text-sm"
            >
              Đăng ký lớp kèm riêng
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-blue-600 mb-4">Đầu tư bản thân</h2>
            <p className="text-5xl font-black uppercase tracking-tighter">Học phí tại {selectedLocation.name}</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Standard Taekwondo */}
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
              {selectedLocation.pricing.map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-1 group-hover:text-white">Gói tập</p>
                    <h4 className="text-xl font-black uppercase">{item.sessions}</h4>
                  </div>
                  <p className="text-2xl font-black tracking-tighter text-red-600 group-hover:text-white">{item.price}</p>
                </motion.div>
              ))}
              
              {/* Special Options */}
              <div className="md:col-span-2 grid md:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6" />
                    <h4 className="text-xl font-black uppercase">Học Nhóm</h4>
                  </div>
                  <p className="opacity-80 text-sm mb-4">Dành cho nhóm từ 3 - 5 người. Môi trường tập luyện gắn kết.</p>
                  <p className="text-3xl font-black tracking-tighter">{selectedLocation.groupPrice}</p>
                </div>
                <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <UserCheck className="w-6 h-6" />
                    <h4 className="text-xl font-black uppercase">Học Kèm</h4>
                  </div>
                  <p className="opacity-80 text-sm mb-4">Tập luyện 1-1 với huấn luyện viên. Lộ trình cá nhân hóa.</p>
                  <button onClick={() => scrollToSection('contact')} className="text-red-400 font-black hover:text-red-300 transition-colors">LIÊN HỆ BÁO GIÁ →</button>
                </div>
              </div>
            </div>
            
            {/* Combined Options Card */}
            <div className="bg-red-50 p-10 rounded-[3rem] border-2 border-red-100 flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-red-200">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight mb-6">Gói tập <br />Kết hợp</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Nâng cao hiệu quả với các môn tập bổ trợ chuyên sâu:
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 font-bold text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-red-500" /> Tăng chiều cao
                  </li>
                  <li className="flex items-center gap-3 font-bold text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-red-500" /> Giảm cân chuyên sâu
                  </li>
                </ul>
              </div>
              <div className="mt-12 pt-8 border-t border-red-200">
                <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-2">Phụ phí kết hợp</p>
                <p className="text-4xl font-black tracking-tighter text-slate-900">+ 200.000 đ</p>
                <p className="text-xs text-slate-500 mt-2 italic">
                  {selectedLocation.hasAddon 
                    ? "Cộng thêm vào mỗi mức giá gói tập tương ứng" 
                    : "Vui lòng liên hệ để biết thêm chi tiết tại cơ sở này"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - More Visual */}
      <section id="services" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-red-500 mb-4">Tại sao chọn Hanul?</h2>
              <p className="text-5xl font-black uppercase tracking-tighter leading-none">Môi trường tập luyện <br /> chuẩn quốc tế</p>
            </div>
            <button 
              onClick={() => scrollToSection('contact')}
              className="px-8 py-4 border-2 border-white/20 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all"
            >
              Khám phá thêm
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -10 }}
                className="group relative h-[400px] rounded-[2.5rem] overflow-hidden border border-white/10"
              >
                <img 
                  src={`https://picsum.photos/seed/taekwondo-training-${index}/600/800`} 
                  alt={service.title} 
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-slate-900 via-transparent to-transparent">
                  <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-red-900/40">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4">{service.title}</h3>
                  <p className="text-sm opacity-70 leading-relaxed group-hover:opacity-100 transition-opacity">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 gap-20">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter mb-12">Gia nhập <span className="text-red-600">Hanul</span> ngay</h2>
                <div className="space-y-10">
                  <div className="flex gap-8">
                    <div className="flex-shrink-0 w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 shadow-sm">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-xs tracking-[0.2em] text-slate-400 mb-2">Địa chỉ cơ sở đang chọn</h4>
                      <p className="text-xl font-bold leading-tight">{selectedLocation.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-8">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-sm">
                      <Phone className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-xs tracking-[0.2em] text-slate-400 mb-2">Hotline tư vấn</h4>
                      <p className="text-xl font-bold leading-tight">{selectedLocation.phones.join(" — ")}</p>
                    </div>
                  </div>

                <div className="flex gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Facebook className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-xs tracking-[0.2em] text-slate-400 mb-2">Facebook Page</h4>
                    <a 
                      href="https://www.facebook.com/hanuldanangclub" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xl font-bold text-indigo-600 hover:underline"
                    >
                      facebook.com/hanuldanangclub
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-16 p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-sm opacity-60 uppercase tracking-widest font-black">Trạng thái hiện tại</p>
                </div>
                <p className="text-4xl font-black uppercase tracking-tight text-emerald-400 mb-4">ĐANG MỞ CỬA</p>
                <p className="text-lg font-medium opacity-80">8:30 - 19:30 | Thứ 2 - Chủ Nhật</p>
                <p className="mt-4 text-sm italic opacity-50">* Thứ 7 & CN linh động nhiều buổi tập hơn</p>
              </div>
            </div>

            <div className="mt-16 lg:mt-0">
              <div className="bg-slate-50 p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16"></div>
                
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">Đăng ký tư vấn</h3>
                
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <h4 className="text-2xl font-black uppercase mb-2">Gửi thành công!</h4>
                      <p className="text-slate-500 font-medium">Hanul sẽ liên hệ với bạn sớm nhất có thể.</p>
                      <button 
                        onClick={() => setIsSuccess(false)}
                        className="mt-8 text-red-600 font-black uppercase tracking-widest text-sm hover:underline"
                      >
                        Gửi thêm đăng ký mới
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form 
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit} 
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</label>
                          <input 
                            required
                            type="text" 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Nguyễn Văn A"
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all font-bold"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Số điện thoại</label>
                          <input 
                            required
                            type="tel" 
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="09xx xxx xxx"
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Cơ sở đăng ký</label>
                          <select 
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all font-bold appearance-none"
                          >
                            {LOCATIONS.map(loc => (
                              <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Gói tập quan tâm</label>
                          <select 
                            name="classType"
                            value={formData.classType}
                            onChange={handleInputChange}
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all font-bold appearance-none"
                          >
                            {selectedLocation.pricing.map((p, i) => (
                              <option key={i} value={p.sessions}>{p.sessions} ({p.price})</option>
                            ))}
                            <option value="Học nhóm">Học nhóm ({selectedLocation.groupPrice})</option>
                            <option value="Học kèm">Học kèm (Liên hệ)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Dịch vụ bổ trợ (+200k)</label>
                        <div className="flex flex-wrap gap-4">
                          {["Tăng chiều cao", "Giảm cân", "Dạy kèm riêng"].map((service) => (
                            <label key={service} className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  checked={formData.additionalServices.includes(service)}
                                  onChange={() => handleCheckboxChange(service)}
                                  className="peer sr-only"
                                />
                                <div className="w-6 h-6 border-2 border-slate-200 rounded-lg peer-checked:bg-red-600 peer-checked:border-red-600 transition-all"></div>
                                <CheckCircle2 className="absolute inset-0 w-6 h-6 text-white scale-0 peer-checked:scale-75 transition-transform" />
                              </div>
                              <span className="font-bold text-sm group-hover:text-red-600 transition-colors">{service}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <input 
                          type="checkbox" 
                          id="isToddler" 
                          name="isToddler"
                          checked={formData.isToddler}
                          onChange={handleInputChange}
                          className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isToddler" className="text-sm font-bold text-blue-800">
                          Đăng ký cho bé lớp Mầm non (3 - 5 tuổi)
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Lời nhắn (nếu có)</label>
                        <textarea 
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Tôi muốn đăng ký tập thử..."
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all font-bold resize-none"
                        ></textarea>
                      </div>

                      <button 
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" /> ĐANG GỬI...
                          </>
                        ) : (
                          <>
                            GỬI ĐĂNG KÝ NGAY <Send className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-4">
              <img 
                src="/Logo.png" 
                alt="Hanul Logo" 
                className="h-16 w-auto brightness-0 invert"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://picsum.photos/seed/hanul-logo/200/200";
                }}
              />
              <div className="leading-none">
                <p className="font-black tracking-tighter text-3xl">HANUL CLUB</p>
                <p className="text-xs uppercase tracking-[0.3em] opacity-50 font-bold">Hệ thống Taekwondo Đà Nẵng</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex gap-8 text-sm font-bold uppercase tracking-widest opacity-60">
                <button onClick={() => scrollToSection('services')} className="hover:text-red-500 transition-colors">Dịch vụ</button>
                <button onClick={() => scrollToSection('schedule')} className="hover:text-red-500 transition-colors">Lịch tập</button>
                <button onClick={() => scrollToSection('pricing')} className="hover:text-red-500 transition-colors">Học phí</button>
              </div>
              <p className="text-sm opacity-30 font-medium">
                © {new Date().getFullYear()} Hanul Taekwondo Đà Nẵng.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
