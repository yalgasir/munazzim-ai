
"use client";

import { useState } from "react";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "خطأ", description: "كلمات المرور غير متطابقة." });
      return;
    }

    setLoading(true);
    
    try {
      if (isFirebaseConfigured) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "تم إنشاء الحساب", description: "مرحباً بك في عائلة منظّم." });
        router.push("/");
      } else {
        // وضع المحاكاة: حفظ المستخدم في LocalStorage
        const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
        if (users.find((u: any) => u.email === email)) {
          throw new Error("هذا البريد مسجل مسبقاً في وضع المحاكاة.");
        }
        
        const newUser = { id: `user_${Date.now()}`, email, password };
        users.push(newUser);
        localStorage.setItem("mock_users", JSON.stringify(users));
        localStorage.setItem("current_mock_user", JSON.stringify(newUser));
        
        toast({ title: "وضع التجربة نشط", description: "تم إنشاء حساب محلي بنجاح (بدون Firebase)." });
        router.push("/");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل التسجيل",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-2">
            <span className="text-2xl font-bold font-headline">م</span>
          </div>
          <CardTitle className="text-2xl font-bold font-headline">إنشاء حساب جديد</CardTitle>
          <CardDescription>انضم إلينا وابدأ بتنظيم وقتك بذكاء واحترافية.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseConfigured && (
            <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs">
                تنبيه: تعمل الآن في "وضع المحاكاة" لعدم توفر مفاتيح Firebase. بياناتك ستكون خاصة بك ولكنها مخزنة محلياً في هذا المتصفح فقط.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="example@mail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              إنشاء حساب
            </Button>
            <div className="text-center text-sm text-muted-foreground mt-4">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                سجل دخولك
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
